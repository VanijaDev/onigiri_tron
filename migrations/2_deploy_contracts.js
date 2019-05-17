let Onigiri = artifacts.require("./Onigiri.sol");

module.exports = function (deployer) {
  deployer.deploy(Onigiri);
};