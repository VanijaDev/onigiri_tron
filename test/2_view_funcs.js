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

  describe("view functions", () => {
    it("should validate getBalance after multiple investments", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);

      //  1
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(300), (await onigiri.getBalance().call()).toNumber(), "wrong balance, should be 300");

      //  2
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(500),
        shouldPollResponse: true
      });
      assert.equal(tronWeb.toSun(800), (await onigiri.getBalance().call()).toNumber(), "wrong balance, should be 800");
    });

    it("should validate guaranteedBalance after multiple investments", async () => {
      await tronWeb.setPrivateKey(INVESTOR_0_PRIV);

      //  1
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(300),
        shouldPollResponse: true
      });
      let lockboxTotal = BigNumber(await onigiri.lockboxTotal().call()); //  252
      let dev0_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  6
      let dev1_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  6
      assert.equal(tronWeb.toSun(264), (lockboxTotal.plus(dev0_commision).plus(dev1_commision)).toNumber(), "guaranteedBalance, should be 264");

      //  2
      await onigiri.invest(REFERRAL_0).send({
        from: INVESTOR_0,
        callValue: tronWeb.toSun(400),
        shouldPollResponse: true
      });
      lockboxTotal = BigNumber(await onigiri.lockboxTotal().call()); //  588
      dev0_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  14
      dev1_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  14
      assert.equal(tronWeb.toSun(616), (lockboxTotal.plus(dev0_commision).plus(dev1_commision)).toNumber(), "wrong balance, should be 616");

      //  3
      await tronWeb.setPrivateKey(INVESTOR_1_PRIV);
      await onigiri.invest(REFERRAL_1).send({
        from: INVESTOR_1,
        callValue: tronWeb.toSun(500),
        shouldPollResponse: true
      });
      lockboxTotal = BigNumber(await onigiri.lockboxTotal().call()); //  1008
      dev0_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  24
      dev1_commision = BigNumber(await onigiri.devCommission(DEV_0_ESCROW).call()); //  24
      assert.equal(tronWeb.toSun(1056), (lockboxTotal.plus(dev0_commision).plus(dev1_commision)).toNumber(), "wrong balance, should be 1056");
    });
  });

  //  Made PRIVATE
  // describe("percentRateInternal", () => {
  //   it("should fail if balance == 0", async () => {
  //     let failed = false;
  //     try {
  //       await onigiri.percentRateInternal(0).call();
  //     } catch (error) {
  //       failed = true;
  //     }

  //     assert.isTrue(failed, "should fail if balance == 0");
  //   });

  //   it("should validate percentRateInternal is 25 if < 7501", async () => {
  //     assert.equal(25, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1000)).call()).toNumber(), "should be 25 for 1000");
  //     assert.equal(25, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(7499)).call()).toNumber(), "should be 25 for 7499");
  //     assert.equal(25, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(7500)).call()).toNumber(), "should be 25 for 7500");
  //   });

  //   it("should validate percentRateInternal is 40 if >= 7501 && < 380,000", async () => {
  //     assert.equal(40, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(7501)).call()).toNumber(), "should be 40 for 7501");
  //     assert.equal(40, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(379999)).call()).toNumber(), "should be 40 for 379999");
  //     assert.equal(40, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(380000)).call()).toNumber(), "should be 40 for 380000");
  //   });

  //   it("should validate percentRateInternal is 50 if >= 380,001 && < 750,000", async () => {
  //     assert.equal(50, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(380001)).call()).toNumber(), "should be 40 for 380001");
  //     assert.equal(50, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(700000)).call()).toNumber(), "should be 40 for 700000");
  //     assert.equal(50, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(749999)).call()).toNumber(), "should be 40 for 749999");
  //     assert.equal(50, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(750000)).call()).toNumber(), "should be 60 for 750000");
  //   });

  //   it("should validate percentRateInternal is 60 if >= 750,001 && < 1,885,000", async () => {
  //     assert.equal(60, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(750001)).call()).toNumber(), "should be 60 for 750001");
  //     assert.equal(60, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1005000)).call()).toNumber(), "should be 60 for 1005000");
  //     assert.equal(60, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1885000)).call()).toNumber(), "should be 60 for 1885000");
  //   });

  //   it("should validate percentRateInternal is 75 if >= 1,885,001", async () => {
  //     assert.equal(75, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1885001)).call()).toNumber(), "should be 60 for 1,885,000");
  //     assert.equal(75, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1886001)).call()).toNumber(), "should be 60 for 1,886,001");
  //     assert.equal(75, BigNumber(await onigiri.percentRateInternal(tronWeb.toSun(1888000)).call()).toNumber(), "should be 60 for 1,888,000");
  //   });
  // })

  describe("percentRatePublic", () => {
    it("should fail if balance == 0", async () => {
      let failed = false;
      try {
        await onigiri.percentRatePublic(0).call();
      } catch (error) {
        failed = true;
      }

      assert.isTrue(failed, "should fail if balance == 0");
    });

    it("should validate percentRatePublic is 60 if < 7501", async () => {
      assert.equal(60, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1000)).call()).toNumber(), "should be 60 for 1000");
      assert.equal(60, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(7499)).call()).toNumber(), "should be 60 for 7499");
      assert.equal(60, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(7500)).call()).toNumber(), "should be 60 for 7500");
    });

    it("should validate percentRatePublic is 96 if >= 7501 && < 380,000", async () => {
      assert.equal(96, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(7501)).call()).toNumber(), "should be 96 for 7501");
      assert.equal(96, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(38000)).call()).toNumber(), "should be 96 for 38000");
      assert.equal(96, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(379999)).call()).toNumber(), "should be 96 for 379999");
      assert.equal(96, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(380000)).call()).toNumber(), "should be 96 for 380000");
    });

    it("should validate percentRatePublic is 120 if >= 380,001 && < 750,000", async () => {
      assert.equal(120, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(380001)).call()).toNumber(), "should be 120 for 380001");
      assert.equal(120, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(700000)).call()).toNumber(), "should be 120 for 700000");
      assert.equal(120, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(749999)).call()).toNumber(), "should be 120 for 749999");
      assert.equal(120, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(750000)).call()).toNumber(), "should be 120 for 750000");
    });

    it("should validate percentRatePublic is 144 if >= 750,001 && < 1,885,000", async () => {
      assert.equal(144, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(750001)).call()).toNumber(), "should be 144 for 750001");
      assert.equal(144, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1884000)).call()).toNumber(), "should be 144 for 1884000");
      assert.equal(144, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1884999)).call()).toNumber(), "should be 144 for 1884999");
      assert.equal(144, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1885000)).call()).toNumber(), "should be 144 for 1885000");
    });

    it("should validate percentRatePublic is 180 if >= 1,885,001", async () => {
      assert.equal(180, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1885001)).call()).toNumber(), "should be 180 for 1,885,001");
      assert.equal(180, BigNumber(await onigiri.percentRatePublic(tronWeb.toSun(1886000)).call()).toNumber(), "should be 180 for 1,886,000");
    });
  })

  describe("profitFor", () => {
    it("should validate profitFor for 0 hours, 1000 lockbox", async () => {
      let profit = (await onigiri.profitFor(0, tronWeb.toSun(1000)).call()).toNumber();
      console.log("\nprofitFor for 0 hours, 1000 lockbox: ", profit);

      assert.equal(0, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 7000 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(7000)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 7000 lockbox: ", profit);

      assert.equal(1750000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 7500 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(7500)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 7500 lockbox: ", profit);

      assert.equal(1875000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 380,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(380000)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 380,000 lockbox: ", profit);

      assert.equal(152000000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 749,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(749000)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 749,000 lockbox: ", profit);

      assert.equal(374500000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 750,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(750000)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 750,000 lockbox: ", profit);

      assert.equal(375000000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 1,884,999 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(1884999)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 1,884,999 lockbox: ", profit);

      assert.equal(1130999400, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 1,885,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(1885000)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 1,885,000 lockbox: ", profit);

      assert.equal(1131000000, profit, "wrong value");
    });

    it("should validate profitFor for 1 hour, 1,885,001 lockbox", async () => {
      let profit = (await onigiri.profitFor(1, tronWeb.toSun(1885001)).call()).toNumber();
      console.log("\nnprofitFor for 1 hour, 1,885,001 lockbox: ", profit);

      assert.equal(1413750750, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 7000 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(7000)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 7000 lockbox: ", profit);

      assert.equal(14000000, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 7500 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(7500)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 7500 lockbox: ", profit);

      assert.equal(15000000, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 380,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(380000)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 380,000 lockbox: ", profit);

      assert.equal(1216000000, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 749,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(749000)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 749,000 lockbox: ", profit);

      assert.equal(2996000000, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 750,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(750000)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 750,000 lockbox: ", profit);

      assert.equal(3000000000, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 1,884,999 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(1884999)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 1,884,999 lockbox: ", profit);

      assert.equal(9047995200, profit, "wrong value");
    });

    it("should validate profitFor for 8 hours, 1,885,001 lockbox", async () => {
      let profit = (await onigiri.profitFor(8, tronWeb.toSun(1885001)).call()).toNumber();
      console.log("\nnprofitFor for 8 hours, 1,885,001 lockbox: ", profit);

      assert.equal(11310006000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 7000 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(7000)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 7000 lockbox: ", profit);

      assert.equal(157500000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 7500 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(7500)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 7500 lockbox: ", profit);

      assert.equal(168750000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 380,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(380000)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 380,000 lockbox: ", profit);

      assert.equal(13680000000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 749,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(749000)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 749,000 lockbox: ", profit);

      assert.equal(33705000000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 750,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(750000)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 750,000 lockbox: ", profit);

      assert.equal(33750000000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 1,884,999 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(1884999)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 1,884,999 lockbox: ", profit);

      assert.equal(101789946000, profit, "wrong value");
    });

    it("should validate profitFor for 90 hours, 1,885,001 lockbox", async () => {
      let profit = (await onigiri.profitFor(90, tronWeb.toSun(1885001)).call()).toNumber();
      console.log("\nnprofitFor for 90 hours, 1,885,001 lockbox: ", profit);

      assert.equal(127237567500, profit, "wrong value");
    });

    it("should validate profitFor for 92 hours, 1,885,001 lockbox", async () => {
      let profit = (await onigiri.profitFor(92, tronWeb.toSun(1885001)).call()).toNumber();
      console.log("\nnprofitFor for 92 hours, 1,885,001 lockbox: ", profit);

      assert.equal(130065069000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 7000 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(7000)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 7000 lockbox: ", profit);

      assert.equal(1575000000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 7500 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(7500)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 7500 lockbox: ", profit);

      assert.equal(1687500000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 380,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(380000)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 380,000 lockbox: ", profit);

      assert.equal(136800000000, profit, "wrong value");
      //  380000 000000 * 900 * 40 / 100000
    });

    it("should validate profitFor for 900 hours, 749,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(749000)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 749,000 lockbox: ", profit);

      assert.equal(337050000000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 750,000 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(750000)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 750,000 lockbox: ", profit);

      assert.equal(337500000000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 1,884,999 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(1884999)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 1,884,999 lockbox: ", profit);

      assert.equal(1017899460000, profit, "wrong value");
    });

    it("should validate profitFor for 900 hours, 1,885,001 lockbox", async () => {
      let profit = (await onigiri.profitFor(900, tronWeb.toSun(1885001)).call()).toNumber();
      console.log("\nnprofitFor for 900 hours, 1,885,001 lockbox: ", profit);

      assert.equal(1272375675000, profit, "wrong value");
    });
  });

});