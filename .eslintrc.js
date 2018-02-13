const { Neutrino } = require('neutrino');

module.exports = Neutrino()
  .use('.neutrinorc.js')
  .call('eslintrc');

console.log(
  JSON.stringify(
    Neutrino()
      .use('.neutrinorc.js')
      .call('eslintrc'),
    null,
    2
  )
);
