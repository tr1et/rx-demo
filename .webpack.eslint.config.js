const { Neutrino } = require('neutrino');

module.exports = Neutrino().use('.neutrinorc.js').config.toConfig();

console.log(JSON.stringify(
  Neutrino().use('.neutrinorc.js').config.toConfig(),
  null,
  2
));
