const Onigiri = artifacts.require("Onigiri.sol");
let BigNumber = require('bignumber.js');
const TronWeb = require('tronweb');


const DockerKeys = require('./helpers/docker_keys.js');

contract("Donations", (accounts) => {
  const DEPLOYER = accounts[0];
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];
  const ACC_3 = accounts[3];

  const DEPLOYER_PRIV = DockerKeys.priv[0];
  const ACC_1_PRIV = DockerKeys.priv[1];
  const ACC_2_PRIV = DockerKeys.priv[2];
  const ACC_3_PRIV = DockerKeys.priv[3];

  let onigiri;

  beforeEach("setup", async () => {
    await tronWeb.setPrivateKey(DEPLOYER_PRIV);

    onigiri = await tronWeb.contract().new({
      abi: Onigiri.abi,
      bytecode: Onigiri.bytecode,
      shouldPollResponse: true
    });
  });

  it("should ", async () => {

  });
});