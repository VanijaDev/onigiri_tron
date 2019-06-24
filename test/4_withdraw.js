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

  describe("withdrawDevCommission", () => {
    it("should fail if commission == 0", async () => {
      let failed = false;

      await tronWeb.setPrivateKey(DEV_0_ESCROW_PRIV);
      try {
        await onigiri.withdrawDevCommission().send({
          from: DEV_0_ESCROW,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if no commission yet");
    });

    it("should fail if not dev", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      let failed = false;

      try {
        await onigiri.withdrawDevCommission().send({
          from: INVESTOR_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if not dev");
    });

    it("should clear devCommission after withdrawal", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - check DEV_0_ESCROW > 0
      assert.isTrue(await onigiri.devCommission(DEV_0_ESCROW).call() > 0, "DEV_0_ESCROW balance should be > 0 before  withdraw");

      //  3 - withdraw
      await tronWeb.setPrivateKey(DEV_0_ESCROW_PRIV);
      await onigiri.withdrawDevCommission().send({
        from: DEV_0_ESCROW,
        shouldPollResponse: true
      });

      //  4 - check DEV_0_ESCROW == 0
      assert.isTrue(await onigiri.devCommission(DEV_0_ESCROW).call() == 0, "DEV_0_ESCROW balance should be == 0 after withdraw");

    });

    it("should increase DEV_0_ESCROW balance after success withdrawal", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - get DEV_0_ESCROW
      let DEV_0_ESCROW_before = BigNumber(await tronWeb.trx.getBalance(DEV_0_ESCROW)).toNumber();
      // console.log(DEV_0_ESCROW_before);

      //  3 - withdraw
      await tronWeb.setPrivateKey(DEV_0_ESCROW_PRIV);
      await onigiri.withdrawDevCommission().send({
        from: DEV_0_ESCROW,
        shouldPollResponse: true
      });

      //  4 - check DEV_0_ESCROW increased
      let DEV_0_ESCROW_after = BigNumber(await tronWeb.trx.getBalance(DEV_0_ESCROW)).toNumber();
      assert.isTrue(DEV_0_ESCROW_after > DEV_0_ESCROW_before, "DEV_0_ESCROW balance should be increased after withdraw");
    });
  });

  describe("withdrawAffiliateCommission", () => {
    it("should fail if commission == 0", async () => {
      let failed = false;

      await tronWeb.setPrivateKey(REFERRAL_0_PRIV);
      try {
        await onigiri.withdrawAffiliateCommission().send({
          from: REFERRAL_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if no commission yet");
    });

    it("should fail if not affiate", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      let failed = false;
      await tronWeb.setPrivateKey(OTHER_ADDR_PRIV);

      try {
        await onigiri.withdrawAffiliateCommission().send({
          from: OTHER_ADDR,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if not refferral");
    });

    it("should delete affiliateCommission after withdrawal", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - check REFERRAL_0 balance > 0
      assert.isTrue(await onigiri.affiliateCommission(REFERRAL_0).call() > 0, "REFERRAL_0 balance should be > 0 before  withdraw");

      //  3 - withdraw
      await tronWeb.setPrivateKey(REFERRAL_0_PRIV);
      await onigiri.withdrawAffiliateCommission().send({
        from: REFERRAL_0,
        shouldPollResponse: true
      });

      //  4 - check REFERRAL_0 balance == 0
      assert.isTrue(await onigiri.affiliateCommission(REFERRAL_0).call() == 0, "REFERRAL_0 balance should be == 0 after withdraw");
    });

    it("should increase affiliateCommissionWithdrawnTotal after withdrawal", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - get affiliateCommissionWithdrawnTotal
      let affiliateCommissionWithdrawnTotal_before = await onigiri.affiliateCommissionWithdrawnTotal().call();

      //  3 - withdraw
      await tronWeb.setPrivateKey(REFERRAL_0_PRIV);
      await onigiri.withdrawAffiliateCommission().send({
        from: REFERRAL_0,
        shouldPollResponse: true
      });

      //  4 - check affiliateCommissionWithdrawnTotal increased
      let affiliateCommissionWithdrawnTotal_after = await onigiri.affiliateCommissionWithdrawnTotal().call();
      assert.equal(tronWeb.toSun(3), affiliateCommissionWithdrawnTotal_after - affiliateCommissionWithdrawnTotal_before, "wrong affiliateCommissionWithdrawnTotal after");
    });

    it("should transfer withdrawal amount to affiliate address", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(30000),
        shouldPollResponse: true
      });

      //  2 - get REFERRAL_0
      let REFERRAL_0_before = BigNumber(await tronWeb.trx.getBalance(REFERRAL_0)).toNumber();

      //  3 - withdraw
      await tronWeb.setPrivateKey(REFERRAL_0_PRIV);
      await onigiri.withdrawAffiliateCommission().send({
        from: REFERRAL_0,
        shouldPollResponse: true
      });

      //  4 - check REFERRAL_0 increased
      let REFERRAL_0_after = BigNumber(await tronWeb.trx.getBalance(REFERRAL_0)).toNumber();
      assert.isTrue(REFERRAL_0_after > REFERRAL_0_before, "REFERRAL_0 balance should be increased after withdraw");
    });

    it("should emit WithdrawnAffiliateCommission with correct params", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(30000),
        shouldPollResponse: true
      });

      //  2 - withdraw
      await tronWeb.setPrivateKey(REFERRAL_0_PRIV);
      await onigiri.withdrawAffiliateCommission().send({
        from: REFERRAL_0,
        shouldPollResponse: true
      });

      //  3 - event
      let events = await tronWeb.getEventResult(onigiri.address, {
        eventName: 'WithdrawnAffiliateCommission',
        size: 1,
        page: 1
      });

      assert.equal(tronWeb.address.toHex(REFERRAL_0), tronWeb.address.toHex(events[0].result.affiliate), "wrong affiliate address in WithdrawnAffiliateCommission event");
      assert.equal(tronWeb.toSun(300), events[0].result.amount, "wrong amount in WithdrawnAffiliateCommission event");
    });
  });

  describe("withdrawLockBoxAndClose", () => {
    it("should fail if lockboxAmount == 0", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - validate INVESTOR_1
      let failed = false;

      await tronWeb.setPrivateKey(INVESTOR_1_PRIV);
      try {
        await onigiri.withdrawLockBoxAndClose().send({
          from: INVESTOR_1,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail");
    });

    it("should delete investor", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      await onigiri.withdrawLockBoxAndClose().send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  3 - validate investor is being deleted
      assert.equal(0, BigNumber((await onigiri.investors(INVESTOR_0).call()).invested).toNumber());
    });

    it("should decrease investorsCount", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - get investorsCount
      let investorsCount_before = BigNumber(await onigiri.investorsCount().call()).toNumber();

      //  3 - withdraw
      await onigiri.withdrawLockBoxAndClose().send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  4 - validate
      let investorsCount_after = BigNumber(await onigiri.investorsCount().call()).toNumber();
      assert.equal(1, investorsCount_before - investorsCount_after, "should be decreased");
      assert.equal(0, investorsCount_after, "wrong amount after decreased");
    });

    it("should decrease lockboxTotal", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - invest from INVESTOR_1
      await tronWeb.setPrivateKey(INVESTOR_1_PRIV);
      await onigiri.invest(REFERRAL_1).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });

      //  3 - get lockboxTotal
      let lockboxTotal_before = BigNumber(await onigiri.lockboxTotal().call()).toNumber();

      //  4 - withdraw
      await onigiri.withdrawLockBoxAndClose().send({
        from: INVESTOR_1,
        shouldPollResponse: true
      });

      //  5 - validate
      let lockboxTotal_after = BigNumber(await onigiri.lockboxTotal().call()).toNumber();
      assert.equal(tronWeb.toSun(336), lockboxTotal_before - lockboxTotal_after, "should be decreased");
      assert.equal(tronWeb.toSun(252), lockboxTotal_after, "wrong amount after decreased");
    });

    it("should transfer to investor address", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(30000),
        shouldPollResponse: true
      });

      //  2 - get INVESTOR_0
      let INVESTOR_0_before = BigNumber(await tronWeb.trx.getBalance(INVESTOR_0)).toNumber();

      //  3 - withdraw
      await onigiri.withdrawLockBoxAndClose().send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  4 - check REFERRAL_0 increased
      let INVESTOR_0_after = BigNumber(await tronWeb.trx.getBalance(INVESTOR_0)).toNumber();
      assert.isTrue(INVESTOR_0_after > INVESTOR_0_before, "INVESTOR_0 balance should be increased after withdraw");
    });

    it("should emit WithdrawnLockbox", async () => {
      //  1 - invest
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      await onigiri.withdrawLockBoxAndClose().send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  3 - event
      let events = await tronWeb.getEventResult(onigiri.address, {
        eventName: 'WithdrawnLockbox',
        size: 1,
        page: 1
      });

      assert.equal(tronWeb.address.toHex(INVESTOR_0), tronWeb.address.toHex(events[0].result.investor), "wrong investor address in WithdrawnLockbox event");
      assert.equal(tronWeb.toSun(252), events[0].result.amount, "wrong amount in WithdrawnLockbox event");
    });
  });

  describe("withdrawLockBoxPartially", () => {
    it("should fail if 0", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      let failed = false;
      try {
        await onigiri.withdrawLockBoxPartially(0).send({
          from: INVESTOR_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if 0");
    });

    it("should fail if No investments", async () => {
      let failed = false;
      try {
        await onigiri.withdrawLockBoxPartially(tronWeb.toSun(300)).send({
          from: INVESTOR_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if No investments");
    });

    it("should fail if Not enough lockBox", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      let failed = false;
      try {
        await onigiri.withdrawLockBoxPartially(tronWeb.toSun(301)).send({
          from: INVESTOR_0,
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if Not enough lockBox");
    });

    it("should call withdrawLockBoxAndClose if _amount == lockbox amount", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      await onigiri.withdrawLockBoxPartially(tronWeb.toSun(252)).send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  3 - event
      let events = await tronWeb.getEventResult(onigiri.address, {
        eventName: 'WithdrawnLockbox',
        size: 1,
        page: 1
      });

      assert.equal(tronWeb.address.toHex(INVESTOR_0), tronWeb.address.toHex(events[0].result.investor), "wrong investor address in WithdrawnLockbox event");
      assert.equal(tronWeb.toSun(252), events[0].result.amount, "wrong amount in WithdrawnLockbox event, when _amount == lockbox amount");
    });

    it("should update lockbox amount", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - withdraw
      await onigiri.withdrawLockBoxPartially(tronWeb.toSun(200)).send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      assert.equal(tronWeb.toSun(52), (await onigiri.getLockBox(INVESTOR_0).call()).toNumber(), "lockbox should be 52 after partial lockbox withdrawal");
    });

    it("should update lockboxTotal", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(350),
        shouldPollResponse: true
      });

      //  3 - withdraw
      await onigiri.withdrawLockBoxPartially(tronWeb.toSun(200)).send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      assert.equal(tronWeb.toSun(346), (await onigiri.lockboxTotal().call()).toNumber(), "lockbox should be 346 after partial lockbox withdrawal");
    });

    it("should transfer to investor", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      let INVESTOR_0_before = BigNumber(await tronWeb.trx.getBalance(INVESTOR_0)).toNumber();

      //  2 - withdraw
      await onigiri.withdrawLockBoxPartially(tronWeb.toSun(200)).send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  3 - check REFERRAL_0 increased
      let INVESTOR_0_after = BigNumber(await tronWeb.trx.getBalance(INVESTOR_0)).toNumber();
      assert.isTrue(INVESTOR_0_after > INVESTOR_0_before, "INVESTOR_0 balance should be increased after withdraw");
    });

    it("should emit WithdrawnLockBoxPartially event", async () => {
      //  1 - invest from INVESTOR_0
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      let INVESTOR_0_before = BigNumber(await tronWeb.trx.getBalance(INVESTOR_0)).toNumber();

      //  2 - withdraw
      await onigiri.withdrawLockBoxPartially(tronWeb.toSun(200)).send({
        from: INVESTOR_0,
        shouldPollResponse: true
      });

      //  3 - event
      let events = await tronWeb.getEventResult(onigiri.address, {
        eventName: 'WithdrawnLockBoxPartially',
        size: 1,
        page: 1
      });

      assert.equal(tronWeb.address.toHex(INVESTOR_0), tronWeb.address.toHex(events[0].result.investor), "wrong investor address in WithdrawnLockBoxPartially event");
      assert.equal(tronWeb.toSun(200), events[0].result.amount, "wrong amount in WithdrawnLockBoxPartially event, should be 200");
    });
  });
});