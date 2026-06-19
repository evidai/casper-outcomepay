// Trivial app logic that exercises the dependencies, so the test suite is a
// real (if small) gate: if a fix breaks the dependency API, the test fails.
const _ = require("lodash");
const parseArgs = require("minimist");

function summarize(items) {
  // group an array of {team, points} by team, summing points — stable lodash API
  const byTeam = _.groupBy(items, "team");
  return _.mapValues(byTeam, (rows) => _.sumBy(rows, "points"));
}

function parseFlags(argv) {
  return parseArgs(argv, { boolean: ["verbose"] });
}

module.exports = { summarize, parseFlags };
