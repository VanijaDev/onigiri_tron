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

  describe("Donations", () => {
    it("should update donations correctly", async () => {
      let donatedAmountBefore = await onigiri.donatedTotal().call();
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(donatedAmountBefore), "donatedTotal should be 0 before");

      await tronWeb.setPrivateKey(OTHER_ADDR_PRIV);
      await onigiri.donate().send({
        from: OTHER_ADDR,
        callValue: tronWeb.toSun(1),
        shouldPollResponse: true
      });

      let donatedAmountAfter = await onigiri.donatedTotal().call();
      assert.equal(0, BigNumber(tronWeb.toSun(1)).comparedTo(donatedAmountAfter), "donatedTotal should be 1 after");

      let balance = BigNumber(await onigiri.getBalance().call());
      assert.equal(0, BigNumber(tronWeb.toSun(1)).comparedTo(balance), "balance should be 1 after");
    });

    it("should update dev fee correctly", async () => {
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.devCommission(DEV_0_ESCROW).call()), "dev 0 fee should 0 before");
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.devCommission(DEV_1_ESCROW).call()), "dev 1 fee should 0 before");

      await tronWeb.setPrivateKey(OTHER_ADDR_PRIV);
      await onigiri.donate().send({
        from: OTHER_ADDR,
        callValue: tronWeb.toSun(2),
        shouldPollResponse: true
      });

      assert.equal(0, BigNumber(tronWeb.toSun(0.02)).comparedTo(await onigiri.devCommission(DEV_0_ESCROW).call()), "dev 0 fee should 0.02 after");
      assert.equal(0, BigNumber(tronWeb.toSun(0.02)).comparedTo(await onigiri.devCommission(DEV_1_ESCROW).call()), "dev 1 fee should 0.02 after");
    });
  });

  describe("Donations from games", () => {
    it("should update donations correctly", async () => {
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.gamesIncomeTotal().call()), "gamesIncomeTotal should 0 before");

      await onigiri.fromGame().send({
        from: OTHER_ADDR,
        callValue: tronWeb.toSun(1),
        shouldPollResponse: true
      });
      assert.equal(0, BigNumber(tronWeb.toSun(1)).comparedTo(await onigiri.gamesIncomeTotal().call()), "gamesIncomeTotal should 1 after");
    });

    it("should update dev fee correctly", async () => {
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.devCommission(DEV_0_ESCROW).call()), "dev 0 fee should 0 before");
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.devCommission(DEV_1_ESCROW).call()), "dev 1 fee should 0 before");

      await onigiri.fromGame().send({
        from: OTHER_ADDR,
        callValue: tronWeb.toSun(2),
        shouldPollResponse: true
      });

      assert.equal(0, BigNumber(tronWeb.toSun(0.04)).comparedTo(await onigiri.devCommission(DEV_0_ESCROW).call()), "dev 0 fee should 0.04 after");
      assert.equal(0, BigNumber(tronWeb.toSun(0.04)).comparedTo(await onigiri.devCommission(DEV_1_ESCROW).call()), "dev 1 fee should 0.04 after");
    });
  });

  describe("Invest", () => {
    it("should not allow investment less than 250 TRX", async () => {
      let failed = false;

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      try {
        await onigiri.invest(REFERRAL_0).send({
          from: INVESTOR_0,
          callValue: tronWeb.toSun(249),
          shouldPollResponse: true
        });
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if sent less, than minimum");
    });

    it("should not send any ptofit on first investment", async () => {
      let balanceBefore = BigNumber(await onigiri.getBalance().call());
      // console.log("balanceBefore: ", balanceBefore);

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      let balanceAfter = BigNumber(await onigiri.getBalance().call());
      // console.log("balanceAfter: ", balanceAfter);

      assert.equal(tronWeb.toSun(259), balanceAfter.minus(balanceBefore).toNumber(), "should be 259 TRX");
    });

    it("should not increase affiliateCommission[_affiliate] if == sender", async () => {
      assert.equal(0, BigNumber(0).comparedTo(await onigiri.affiliateCommission(INVESTOR_0).call()), "affiliateCommission for INVESTOR_0 must be 0 before");

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(INVESTOR_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(259),
        shouldPollResponse: true
      });

      assert.equal(0, BigNumber(0).comparedTo(await onigiri.affiliateCommission(INVESTOR_0).call()), "affiliateCommission for INVESTOR_0 must be 0 after");
    });

    it("should increase affiliateCommission[_affiliate] if(_affiliate != msg.sender && _affiliate != address(0))", async () => {
      assert.equal(0, BigNumber(0).comparedTo(await onigiri.affiliateCommission(REFERRAL_0).call()), "affiliateCommission for REFERRAL_0 must be 0 before");

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(0, BigNumber(tronWeb.toSun(3)).comparedTo(await onigiri.affiliateCommission(REFERRAL_0).call()), "affiliateCommission for REFERRAL_0 must be 3 after");
    });

    it("should increase investorsCount if first time deposit", async () => {
      assert.equal(0, (await onigiri.investorsCount().call()).toNumber(), "investorsCount should be 0 before");

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(1, (await onigiri.investorsCount().call()).toNumber(), "investorsCount should be 1 after");
    });

    it("should not increase investorsCount if was previous deposit", async () => {
      assert.equal(0, (await onigiri.investorsCount().call()).toNumber(), "investorsCount should be 0 before");

      //  1
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });
      assert.equal(1, (await onigiri.investorsCount().call()).toNumber(), "investorsCount should be 1 after");

      //  2
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });

      assert.equal(1, (await onigiri.investorsCount().call()).toNumber(), "investorsCount should still be 1 after");
    });

    it("should update lockbox after investment", async () => {
      assert.equal(0, (await onigiri.getLockBox(INVESTOR_0).call()).toNumber(), "lockbox should be 0 before");

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(tronWeb.toSun(252), (await onigiri.getLockBox(INVESTOR_0).call()).toNumber(), "lockbox should be 252 after");
    });

    it("should update invested after investment", async () => {
      assert.equal(0, (await onigiri.getInvested(INVESTOR_0).call()).toNumber(), "invested should be 0 before");

      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(tronWeb.toSun(300), (await onigiri.getInvested(INVESTOR_0).call()).toNumber(), "invested should be 300 after");
    });

    it("should update lastInvestmentTime after investment", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(-1, BigNumber(0).comparedTo(await onigiri.getLastInvestmentTime(INVESTOR_0).call()), "lastInvestmentTime must be > 0 after");
    });

    it("should vlidate withdrawn was deleted", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      assert.equal(0, BigNumber(0).comparedTo(await onigiri.getWithdrawn(INVESTOR_0).call()), "withdrawn must be == 0 after");

    });

    it("should update lockboxTotal after investment", async () => {
      assert.equal(0, (await onigiri.lockboxTotal().call()).toNumber(), "lockboxTotal should be 0 before");

      //  1
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(252), (await onigiri.lockboxTotal().call()).toNumber(), "lockboxTotal should be 252 after");

      //  2
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(588), (await onigiri.lockboxTotal().call()).toNumber(), "lockboxTotal should be 588 after #2");
    });

    it("should update both developer's balance on investment", async () => {
      assert.equal(0, (await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber(), "DEV_0_ESCROW should be 0 before");
      assert.equal(0, (await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber(), "DEV_1_ESCROW should be 0 before");

      //  1
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(6), (await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber(), "DEV_0_ESCROW should be 6 after");
      assert.equal(tronWeb.toSun(6), (await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber(), "DEV_1_ESCROW should be 6 after");

      //  2
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(14), (await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber(), "DEV_0_ESCROW should be 14 after");
      assert.equal(tronWeb.toSun(14), (await onigiri.devCommission(DEV_1_ESCROW).call()).toNumber(), "DEV_1_ESCROW should be 14 after");
    });

    it("should update developer's balance on investment after withdrawal", async () => {
      //  1
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });

      //  2
      wait(1);
      await tronWeb.setPrivateKey(DEV_0_ESCROW_PRIV);
      await onigiri.withdrawDevCommission().send({
        from: DEV_0_ESCROW,
        shouldPollResponse: true
      });
      assert.equal(0, (await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber(), "DEV_0_ESCROW should be 0 before");

      //  3
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(8), (await onigiri.devCommission(DEV_0_ESCROW).call()).toNumber(), "DEV_0_ESCROW should be 7 after");
    });

    it("should emit Invested event with correct values", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });

      let events = await tronWeb.getEventResult(onigiri.address, {
        eventName: 'Invested',
        size: 1,
        page: 1
      });

      assert.equal(tronWeb.address.toHex(INVESTOR_0), tronWeb.address.toHex(events[0].result.investor), "wrong investor address in Invested event");
      assert.equal(tronWeb.toSun(400), events[0].result.amount, "wrong amount in Invested event");
    });

    it("should validate InvestorInfo after on multiple investments", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);

      //  1
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

      //  2
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });

      investorDetails = await onigiri.investors(INVESTOR_0).call();
      assert.equal(tronWeb.toSun(700), (await investorDetails.invested).toNumber(), "wrong invested amount, should be 700");
      assert.equal(tronWeb.toSun(588), (await investorDetails.lockbox).toNumber(), "wrong lockbox amount, should be 588");
      assert.equal(0, (await investorDetails.withdrawn).toNumber(), "wrong withdrawn amount");
      assert.equal(-1, BigNumber(0).comparedTo(await investorDetails.lastInvestmentTime), "wrong lastInvestmentTime");
    });
  });
});