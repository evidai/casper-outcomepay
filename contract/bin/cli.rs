//! odra-cli entrypoint: deploy & exercise OutcomePay on a live network.

use outcomepay::outcomepay::OutcomePay;
use odra::casper_types::U512;
use odra::host::{HostEnv, HostRef, NoArgs};
use odra_cli::{
    deploy::DeployScript,
    scenario::{Args, Error, Scenario, ScenarioMetadata},
    ContractProvider, DeployedContractsContainer, DeployerExt, OdraCli,
};

/// Deploys OutcomePay (constructor `init`, no args) and registers it.
pub struct OutcomePayDeployScript;

impl DeployScript for OutcomePayDeployScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
        let _c = OutcomePay::load_or_deploy(env, NoArgs, container, 350_000_000_000)?;
        Ok(())
    }
}

/// Runs the full lifecycle on-chain so every step is a real, inspectable tx:
///   set_cap → lock(job1) → settle(job1) → lock(job2) → refund(job2)
/// Emits Locked / Settled / Refunded events and exercises the on-chain cap.
pub struct DemoScenario;

impl Scenario for DemoScenario {
    fn args(&self) -> Vec<odra_cli::CommandArg> {
        vec![]
    }

    fn run(
        &self,
        env: &HostEnv,
        container: &DeployedContractsContainer,
        _args: Args,
    ) -> Result<(), Error> {
        let mut c = container.contract_ref::<OutcomePay>(env)?;
        let me = env.caller(); // agent == provider for the demo (self-settle)

        env.set_gas(3_000_000_000);
        c.try_set_cap(U512::from(1_000_000_000u64))?; // cap = 1 CSPR

        env.set_gas(30_000_000_000); // payable lock goes through a proxy → needs more gas
        c.with_tokens(U512::from(200_000_000u64)).try_lock(1, me)?; // lock 0.2 CSPR, job 1

        env.set_gas(10_000_000_000);
        c.try_settle(1)?; // outcome verified → release to provider

        env.set_gas(30_000_000_000);
        c.with_tokens(U512::from(150_000_000u64)).try_lock(2, me)?; // lock 0.15 CSPR, job 2

        env.set_gas(10_000_000_000);
        c.try_refund(2)?; // outcome failed → refund payer (green-or-no-fee)

        Ok(())
    }
}

impl ScenarioMetadata for DemoScenario {
    const NAME: &'static str = "demo";
    const DESCRIPTION: &'static str =
        "Full on-chain lifecycle: set_cap, lock+settle (job 1), lock+refund (job 2)";
}

pub fn main() {
    OdraCli::new()
        .about("CLI tool for the OutcomePay smart contract")
        .deploy(OutcomePayDeployScript)
        .contract::<OutcomePay>()
        .scenario(DemoScenario)
        .build()
        .run();
}
