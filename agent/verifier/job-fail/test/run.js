// Minimal zero-dependency test runner. Exits non-zero on any failure, so it
// works as a CI gate (and as the machine-checkable acceptance signal).
const assert = require("assert");
const { summarize, parseFlags } = require("../src/index.js");

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL - ${name}: ${err.message}`);
  }
}

test("summarize groups and sums points by team", () => {
  const out = summarize([
    { team: "a", points: 3 },
    { team: "b", points: 5 },
    { team: "a", points: 4 },
  ]);
  assert.deepStrictEqual(out, { a: 7, b: 5 });
});

test("parseFlags parses boolean and positional args", () => {
  const out = parseFlags(["--verbose", "build"]);
  assert.strictEqual(out.verbose, true);
  assert.deepStrictEqual(out._, ["build"]);
});

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log("\nAll tests passed");
