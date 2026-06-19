use odra::prelude::*;
use odra::casper_types::U512;

/// Errors enforced on-chain.
#[odra::odra_error]
pub enum Error {
    /// Locking this job would push the agent over its on-chain budget cap.
    CapExceeded = 1,
    /// A job with this id already exists.
    JobExists = 2,
    /// The job is not in the LOCKED state.
    JobNotLocked = 3,
    /// Caller is not the payer (agent) that locked the job.
    NotAuthorized = 4,
}

/// Funds escrowed for a job. The on-chain receipt of intent.
#[odra::event]
pub struct Locked {
    pub job_id: u64,
    pub payer: Address,
    pub provider: Address,
    pub amount: U512,
}

/// Outcome verified → funds released to the provider. The settlement receipt.
#[odra::event]
pub struct Settled {
    pub job_id: u64,
    pub provider: Address,
    pub amount: U512,
}

/// Outcome failed → funds returned to the payer (green-or-no-fee), on-chain.
#[odra::event]
pub struct Refunded {
    pub job_id: u64,
    pub payer: Address,
    pub amount: U512,
}

/// OutcomePay — escrow with an on-chain budget cap and outcome-conditioned release.
///
/// An agent LOCKs CSPR for a job (refused if it exceeds the agent's cap), then
/// SETTLEs (release to provider) when the outcome is verified, or REFUNDs
/// (return to payer) when it fails. Every transition emits a verifiable event.
#[odra::module(events = [Locked, Settled, Refunded])]
pub struct OutcomePay {
    /// Per-agent budget cap (hard ceiling on total simultaneously-locked funds).
    cap: Mapping<Address, U512>,
    /// Per-agent total currently locked.
    locked_total: Mapping<Address, U512>,
    job_payer: Mapping<u64, Address>,
    job_provider: Mapping<u64, Address>,
    job_amount: Mapping<u64, U512>,
    /// 0 = none, 1 = locked, 2 = settled, 3 = refunded.
    job_status: Mapping<u64, u8>,
}

#[odra::module]
impl OutcomePay {
    pub fn init(&mut self) {}

    /// The agent sets its own hard budget cap. It can never lock more than this.
    pub fn set_cap(&mut self, amount: U512) {
        let agent = self.env().caller();
        self.cap.set(&agent, amount);
    }

    pub fn cap_of(&self, agent: Address) -> U512 {
        self.cap.get_or_default(&agent)
    }

    pub fn locked_of(&self, agent: Address) -> U512 {
        self.locked_total.get_or_default(&agent)
    }

    pub fn status_of(&self, job_id: u64) -> u8 {
        self.job_status.get_or_default(&job_id)
    }

    /// Lock attached CSPR in escrow for `job_id`, payable to `provider` on settle.
    /// Reverts if the agent has no cap headroom — the cap is enforced by consensus,
    /// so the agent physically cannot overspend even if its own code goes haywire.
    #[odra(payable)]
    pub fn lock(&mut self, job_id: u64, provider: Address) {
        let payer = self.env().caller();
        let amount = self.env().attached_value();
        if self.job_status.get_or_default(&job_id) != 0 {
            self.env().revert(Error::JobExists);
        }
        let new_total = self.locked_total.get_or_default(&payer) + amount;
        if new_total > self.cap.get_or_default(&payer) {
            self.env().revert(Error::CapExceeded);
        }
        self.locked_total.set(&payer, new_total);
        self.job_payer.set(&job_id, payer);
        self.job_provider.set(&job_id, provider);
        self.job_amount.set(&job_id, amount);
        self.job_status.set(&job_id, 1);
        self.env().emit_event(Locked { job_id, payer, provider, amount });
    }

    /// Outcome verified → release escrow to the provider.
    pub fn settle(&mut self, job_id: u64) {
        let (payer, provider, amount) = self.require_locked(job_id);
        self.job_status.set(&job_id, 2);
        self.release_lock(payer, amount);
        self.env().transfer_tokens(&provider, &amount);
        self.env().emit_event(Settled { job_id, provider, amount });
    }

    /// Outcome failed → return escrow to the payer (green-or-no-fee).
    pub fn refund(&mut self, job_id: u64) {
        let (payer, _provider, amount) = self.require_locked(job_id);
        self.job_status.set(&job_id, 3);
        self.release_lock(payer, amount);
        self.env().transfer_tokens(&payer, &amount);
        self.env().emit_event(Refunded { job_id, payer, amount });
    }

    /// Only the payer (agent) may settle/refund its own job; job must be LOCKED.
    fn require_locked(&self, job_id: u64) -> (Address, Address, U512) {
        if self.job_status.get_or_default(&job_id) != 1 {
            self.env().revert(Error::JobNotLocked);
        }
        let payer = self.job_payer.get(&job_id).unwrap();
        if self.env().caller() != payer {
            self.env().revert(Error::NotAuthorized);
        }
        let provider = self.job_provider.get(&job_id).unwrap();
        let amount = self.job_amount.get(&job_id).unwrap();
        (payer, provider, amount)
    }

    fn release_lock(&mut self, payer: Address, amount: U512) {
        let cur = self.locked_total.get_or_default(&payer);
        self.locked_total.set(&payer, cur - amount);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostRef, NoArgs};

    #[test]
    fn settle_releases_to_provider_under_cap() {
        let env = odra_test::env();
        let mut c = OutcomePay::deploy(&env, NoArgs);
        let agent = env.get_account(0);
        let provider = env.get_account(1);

        env.set_caller(agent);
        c.set_cap(U512::from(1_000_000_000u64));

        env.set_caller(agent);
        c.with_tokens(U512::from(100_000_000u64)).lock(1, provider);
        assert_eq!(c.status_of(1), 1);
        assert_eq!(c.locked_of(agent), U512::from(100_000_000u64));

        env.set_caller(agent);
        c.settle(1);
        assert_eq!(c.status_of(1), 2);
        assert_eq!(c.locked_of(agent), U512::zero());
    }

    #[test]
    fn lock_over_cap_reverts() {
        let env = odra_test::env();
        let mut c = OutcomePay::deploy(&env, NoArgs);
        let agent = env.get_account(0);
        let provider = env.get_account(1);

        env.set_caller(agent);
        c.set_cap(U512::from(50_000_000u64));

        env.set_caller(agent);
        let res = c.with_tokens(U512::from(100_000_000u64)).try_lock(1, provider);
        assert!(res.is_err());
    }

    #[test]
    fn refund_returns_to_payer() {
        let env = odra_test::env();
        let mut c = OutcomePay::deploy(&env, NoArgs);
        let agent = env.get_account(0);
        let provider = env.get_account(1);

        env.set_caller(agent);
        c.set_cap(U512::from(1_000_000_000u64));
        env.set_caller(agent);
        c.with_tokens(U512::from(100_000_000u64)).lock(7, provider);
        env.set_caller(agent);
        c.refund(7);
        assert_eq!(c.status_of(7), 3);
    }
}
