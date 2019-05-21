const Onigiri = artifacts.require("Onigiri.sol");
let BigNumber = require('bignumber.js');
let wait = require("./helpers/wait");
const TronWeb = require('tronweb');
const tronWeb = new TronWeb(
  "http://127.0.0.1:9090",
  "http://127.0.0.1:9090",
  "http://127.0.0.1:9090",
  'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
);

const DockerKeys = require('./helpers/docker_keys.js');

//  0x0000000000000000000000000000000000000000

/**
 * IMPORTANT: update DEV ADDRESSES before tests.
 */

contract("Donations", (accounts) => {
  const DEPLOYER = accounts[0];
  const DEV_0_MASTER = accounts[9];
  const DEV_1_MASTER = accounts[8];
  const DEV_0_ESCROW = accounts[7];
  const DEV_1_ESCROW = accounts[6];
  const INVESTOR_0 = accounts[5];
  const INVESTOR_1 = accounts[4];
  const REFERRAL_0 = accounts[3];
  const REFERRAL_1 = accounts[2];
  const OTHER_ADDR = accounts[1];

  const DEPLOYER_PRIV = DockerKeys.priv[0];
  const DEV_0_MASTER_PRIV = DockerKeys.priv[9];
  const DEV_1_MASTER_PRIV = DockerKeys.priv[8];
  const DEV_0_ESCROW_PRIV = DockerKeys.priv[7];
  const DEV_1_ESCROW_PRIV = DockerKeys.priv[6];
  const INVESTOR_0_PRIV = DockerKeys.priv[5];
  const INVESTOR_1_PRIV = DockerKeys.priv[4];
  const REFERRAL_0_PRIV = DockerKeys.priv[3];
  const REFERRAL_1_PRIV = DockerKeys.priv[2];
  const OTHER_ADDR_PRIV = DockerKeys.priv[1];

  let onigiri;

  before("accounts", () => {
    console.log("\n");
    console.log(tronWeb.address.toHex(DEV_0_MASTER));
    console.log(tronWeb.address.toHex(DEV_1_MASTER));
    console.log(tronWeb.address.toHex(DEV_0_ESCROW));
    console.log(tronWeb.address.toHex(DEV_1_ESCROW));
  });

  beforeEach("setup", async () => {
    wait(1);
    await tronWeb.setPrivateKey(DEPLOYER_PRIV);
    onigiri = await tronWeb.contract().new({
      abi: Onigiri.abi,
      bytecode: Onigiri.bytecode,
      shouldPollResponse: true
    });
  });

  describe("Investor info", () => {
    it("should validate InvestorInfo after single investment", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      let investorDetails = await onigiri.investors(INVESTOR_0).call();
      assert.equal(tronWeb.toSun(300), (await investorDetails.invested).toNumber(), "wrong invested amount");
      assert.equal(tronWeb.toSun(252), (await investorDetails.lockbox).toNumber(), "wrong lockbox amount");
      assert.equal(0, (await investorDetails.withdrawn).toNumber(), "wrong withdrawn amount");
      assert.equal(-1, BigNumber(0).comparedTo(await investorDetails.lastInvestmentTime), "wrong lastInvestmentTime");
    });

    it("should validate getBalance after multiple investments", async () => {

    });

    it("should validate guaranteedBalance after multiple investments", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

    it("should ", async () => {

    });

  });

});