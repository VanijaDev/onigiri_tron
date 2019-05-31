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

  beforeEach("setup", async () => {
    await wait(1);
    await tronWeb.setPrivateKey(DEPLOYER_PRIV);
    onigiri = await tronWeb.contract().new({
      abi: Onigiri.abi,
      bytecode: Onigiri.bytecode,
      shouldPollResponse: true
    });
  });

  it("accounts", () => {
    console.log("\n");
    console.log("DEV_0_MASTER: ", tronWeb.address.toHex(DEV_0_MASTER));
    console.log("DEV_1_MASTER: ", tronWeb.address.toHex(DEV_1_MASTER));
    console.log("DEV_0_ESCROW: ", tronWeb.address.toHex(DEV_0_ESCROW));
    console.log("DEV_1_ESCROW: ", tronWeb.address.toHex(DEV_1_ESCROW));
  });

  describe("updateDevEscrow", () => {
    it("should fail if msg.sender != dev_0_master || msg.sender != dev_1_master", async () => {
      let failed = false;

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      try {
        await onigiri.updateDevEscrow(INVESTOR_0).send({
          from: INVESTOR_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }
      assert.isTrue(failed, "should be failed");
    });

    it("should update only dev_0_escrow if dev_0_master", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      //  2 - check dev balances
      let DEV_0_ESCROW_before = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber();
      let DEV_1_ESCROW_before = BigNumber(await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber();

      //  3 - update DEV_0_ESCROW
      await tronWeb.setPrivateKey(DEV_0_MASTER_PRIV);
      await onigiri.updateDevEscrow(OTHER_ADDR).send({
        from: DEV_0_MASTER,
        shouldPollResponse: true
      })

      //  4 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      //  5 - check dev balances
      let DEV_0_ESCROW_after = BigNumber(await onigiri.devCommission(OTHER_ADDR).call()).toNumber();
      let DEV_1_ESCROW_after = BigNumber(await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber();

      assert.equal(5180000, DEV_0_ESCROW_before, "wrong amount for previous DEV_0_ESCROW before update");
      assert.equal(5180000, DEV_0_ESCROW_after, "wrong amount for previous DEV_0_ESCROW after update");
      assert.equal(10360000, DEV_1_ESCROW_after, "wrong DEV_1_ESCROW amount");

    });

    it("should update only dev_1_escrow if dev_1_master", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      //  2 - check dev balances
      let DEV_0_ESCROW_before = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber();
      let DEV_1_ESCROW_before = BigNumber(await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber();

      //  3 - update DEV_0_ESCROW
      await tronWeb.setPrivateKey(DEV_1_MASTER_PRIV);
      await onigiri
        .updateDevEscrow(OTHER_ADDR).send({
          from: DEV_1_MASTER,
          shouldPollResponse: true
        })

      //  4 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      //  5 - check dev balances
      let DEV_0_ESCROW_after = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber();
      let DEV_1_ESCROW_after = BigNumber(await onigiri.devCommission(OTHER_ADDR).call()).toNumber();

      assert.equal(10360000, DEV_0_ESCROW_after, "wrong DEV_0_ESCROW amount");
      assert.equal(5180000, DEV_1_ESCROW_before, "wrong amount for previous DEV_1_ESCROW before update");
      assert.equal(5180000, DEV_1_ESCROW_after, "wrong amount for previous DEV_1_ESCROW after update");
    });
  });
});