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
    wait(1);
    await tronWeb.setPrivateKey(DEPLOYER_PRIV);
    onigiri = await tronWeb.contract().new({
      abi: Onigiri.abi,
      bytecode: Onigiri.bytecode,
      shouldPollResponse: true
    });
  });

  it("accounts", () => {
    console.log("\n");
    console.log(tronWeb.address.toHex(DEV_0_MASTER));
    console.log(tronWeb.address.toHex(DEV_1_MASTER));
    console.log(tronWeb.address.toHex(DEV_0_ESCROW));
    console.log(tronWeb.address.toHex(DEV_1_ESCROW));
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
      assert.equal(0, BigNumber(tronWeb.toSun(0)).comparedTo(await onigiri.gamesIncomeTotal().call()), "gamesIncomeTotal should 1 after");
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

  describe.only("Invest", () => {
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

    it.only("should send correct ptofit on second investment, 1 hour after first investment", async () => {



      // assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.calculateProfit.call(INVESTOR_1)), "balance should be 0 before");
      // await onigiri.invest(REFERRAL_0, {
      //   from: INVESTOR_0,
      //   value: ether("0.5")
      // });
      // await time.increase(time.duration.hours(1));
      // let balanceBefore = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));

      // const CORRECT_PROFIT = new web3.utils.BN(await onigiri.calculateProfit.call(INVESTOR_0));

      // let investTX = await onigiri.invest(REFERRAL_0, {
      //   from: INVESTOR_0,
      //   value: ether("1.5")
      // });
      // let gasUsed = investTX.receipt.gasUsed;
      // let gasPrice = (await web3.eth.getTransaction(investTX.tx)).gasPrice;
      // let weiUsed = new web3.utils.BN(gasUsed).mul(new web3.utils.BN(gasPrice));
      // let balanceAfter = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));

      // assert.equal(0, balanceBefore.add(CORRECT_PROFIT).sub(weiUsed).sub(ether("1.5")).cmp(balanceAfter), "wrong profit was transferred");
    });

    // it("should update refferral's balance if provided during investment", async () => {
    //   assert.equal(0, ether("0").cmp(await onigiri.affiliateCommission.call(REFERRAL_0)), "REFERRAL_0 should be 0 before");

    //   //  1
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   //  2
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   //  3
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   assert.equal(0, ether("0.03").cmp(await onigiri.affiliateCommission.call(REFERRAL_0)), "REFERRAL_0 should be 0.03 after");
    // });

    // it("should increase investorsCount, if player is new", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.investorsCount.call()), "should be 0 before");

    //   // 1
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be 1 after");

    //   //  2
    //   await onigiri.invest(REFERRAL_1, {
    //     from: INVESTOR_1,
    //     value: ether("0.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(2).cmp(await onigiri.investorsCount.call()), "should be 2 after");
    // });

    // it("should not increase investorsCount, if player is not new", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.investorsCount.call()), "should be 0 before");

    //   //  1
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be 1 after");

    //   //  2
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be again 1 after");
    // });

    // it("should update lockbox after single investment", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0 before");
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });
    //   assert.equal(0, ether("0.84").cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0.84 after");
    // });

    // it("should update lockbox after multiple investments", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0 before");
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   await time.increase(time.duration.minutes(1));
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });
    //   assert.equal(0, ether("1.68").cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 1.68 after");
    // });

    // it("should update invested after single investment", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 0 before");
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });
    //   assert.equal(0, ether("1").cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 1 after");
    // });

    // it("should update invested after multiple investments", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 0 before");
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   await time.increase(time.duration.minutes(1));
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });
    //   assert.equal(0, ether("2").cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 2 after");
    // });

    // it("should update lastInvestmentTime after investment", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lastInvestmentTime), "lastInvestmentTime should be 0 before");
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.1")
    //   });
    //   assert.equal(0, (await time.latest()).cmp((await onigiri.investors.call(INVESTOR_0)).lastInvestmentTime), "lastInvestmentTime should be 0 before");
    // });

    // it("should clear withdrawn after investment", async () => {
    //   //  1 - invest
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.5")
    //   });

    //   await onigiri.invest(REFERRAL_1, {
    //     from: INVESTOR_1,
    //     value: ether("1")
    //   });

    //   //  2 - withdraw profit
    //   await time.increase(time.duration.days(1));
    //   await onigiri.withdrawProfit({
    //     from: INVESTOR_0
    //   });

    //   assert.equal(-1, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).withdrawn), "withdrawn should be > 0");

    //   //  3 - invest
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.1")
    //   });

    //   assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).withdrawn), "withdrawn should be == 0");
    // });

    // it("should increase lockboxTotal", async () => {
    //   assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.lockboxTotal.call()), "should be 0 before");

    //   //  1
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("0.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(ether("0.42")).cmp(await onigiri.lockboxTotal.call()), "should be 0.42 after");

    //   //  2
    //   await onigiri.invest(REFERRAL_1, {
    //     from: INVESTOR_1,
    //     value: ether("1.5")
    //   });
    //   assert.equal(0, new web3.utils.BN(ether("1.68")).cmp(await onigiri.lockboxTotal.call()), "should be again 1.68 after");
    // });

    // it("should update devCommission correctly on single investment", async () => {
    //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
    //     from: DEV_0_ESCROW
    //   })), "devCommission for DEV_0_ESCROW should be 0 before");
    //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
    //     from: DEV_1_ESCROW
    //   })), "devCommission for DEV_1_ESCROW should be 0 before");

    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
    //     from: DEV_0_ESCROW
    //   })), "devCommission for DEV_0_ESCROW should be 0.02 after");
    //   assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
    //     from: DEV_1_ESCROW
    //   })), "devCommission for DEV_1_ESCROW should be 0.02 after");
    // });

    // it("should update devCommission correctly on multiple investments", async () => {
    //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
    //     from: DEV_0_ESCROW
    //   })), "devCommission for DEV_0_ESCROW should be 0 before");
    //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
    //     from: DEV_1_ESCROW
    //   })), "devCommission for DEV_1_ESCROW should be 0 before");

    //   //  1
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   //  2
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   //  3
    //   await onigiri.invest(REFERRAL_0, {
    //     from: INVESTOR_0,
    //     value: ether("1")
    //   });

    //   assert.equal(0, ether("0.06").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
    //     from: DEV_0_ESCROW
    //   })), "devCommission for DEV_0_ESCROW should be 0.06 after");
    //   assert.equal(0, ether("0.06").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
    //     from: DEV_1_ESCROW
    //   })), "devCommission for DEV_1_ESCROW should be 0.06 after");
    // });
  });
});



















/*
// describe("Donations", () => {
//   // it("should update donations correctly", async () => {
//   //   assert.equal(0, ether("0").cmp(await onigiri.donatedTotal.call()), "donatedTotal should 0 before");

//   //   await web3.eth.sendTransaction({
//   //     from: OTHER_ADDR,
//   //     to: onigiri.address,
//   //     value: ether("1")
//   //   });

//   //   assert.equal(0, ether("1").cmp(await onigiri.donatedTotal.call()), "donatedTotal should 1 eth after");
//   // });

//   // it("should update dev fee correctly", async () => {
//   //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW)), "dev 0 fee should 0 before");
//   //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW)), "dev 1 fee should 0 before");

//   //   await web3.eth.sendTransaction({
//   //     from: OTHER_ADDR,
//   //     to: onigiri.address,
//   //     value: ether("1")
//   //   });

//   //   assert.equal(0, ether("0.01").cmp(await onigiri.devCommission.call(DEV_0_ESCROW)), "dev 0 fee should 0.01 after");
//   //   assert.equal(0, ether("0.01").cmp(await onigiri.devCommission.call(DEV_1_ESCROW)), "dev 1 fee should 0.01 after");
//   // });
// });

// describe("Donations from games", () => {
//   // it("should update donations correctly", async () => {
//   //   assert.equal(0, ether("0").cmp(await onigiri.gamesIncomeTotal.call()), "gamesIncomeTotal should 0 before");

//   //   await onigiri.fromGame({
//   //     from: OTHER_ADDR,
//   //     value: ether("1")
//   //   });

//   //   assert.equal(0, ether("1").cmp(await onigiri.gamesIncomeTotal.call()), "gamesIncomeTotal should 1 eth after");
//   // });

//   // it("should update dev fee correctly", async () => {
//   //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW)), "dev 0 fee should 0 before");
//   //   assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW)), "dev 1 fee should 0 before");

//   //   await onigiri.fromGame({
//   //     from: OTHER_ADDR,
//   //     value: ether("1")
//   //   });

//   //   assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_0_ESCROW)), "dev 0 fee should 0.02 after");
//   //   assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_1_ESCROW)), "dev 1 fee should 0.02 after");
//   // });
// });

describe("Invest", () => {
  it("should not allow investment less than 0.025 ether", async () => {
    await shouldFail(onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("0.01")
    }), "should throw if less than minimum investment");
  });

  it("should not send any ptofit on first investment", async () => {
    let balanceBefore = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));
    const INVESTED = ether("0.5");

    let investTX = await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: INVESTED
    });
    let gasUsed = investTX.receipt.gasUsed;
    let gasPrice = (await web3.eth.getTransaction(investTX.tx)).gasPrice;
    let weiUsed = new web3.utils.BN(gasUsed).mul(new web3.utils.BN(gasPrice));

    let balanceAfter = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));
    assert.equal(0, balanceAfter.cmp(balanceBefore.sub(weiUsed).sub(INVESTED)), "balance should be no profit after initial investment");
  });

  it("should send correct ptofit on second investment, 1 hour after first investment", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.calculateProfit.call(INVESTOR_1)), "balance should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });
    await time.increase(time.duration.hours(1));
    let balanceBefore = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));

    const CORRECT_PROFIT = new web3.utils.BN(await onigiri.calculateProfit.call(INVESTOR_0));

    let investTX = await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1.5")
    });
    let gasUsed = investTX.receipt.gasUsed;
    let gasPrice = (await web3.eth.getTransaction(investTX.tx)).gasPrice;
    let weiUsed = new web3.utils.BN(gasUsed).mul(new web3.utils.BN(gasPrice));
    let balanceAfter = new web3.utils.BN(await web3.eth.getBalance(INVESTOR_0));

    assert.equal(0, balanceBefore.add(CORRECT_PROFIT).sub(weiUsed).sub(ether("1.5")).cmp(balanceAfter), "wrong profit was transferred");
  });

  it("should update refferral's balance if provided during investment", async () => {
    assert.equal(0, ether("0").cmp(await onigiri.affiliateCommission.call(REFERRAL_0)), "REFERRAL_0 should be 0 before");

    //  1
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    //  2
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    //  3
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    assert.equal(0, ether("0.03").cmp(await onigiri.affiliateCommission.call(REFERRAL_0)), "REFERRAL_0 should be 0.03 after");
  });

  it("should increase investorsCount, if player is new", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.investorsCount.call()), "should be 0 before");

    // 1
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });
    assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be 1 after");

    //  2
    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("0.5")
    });
    assert.equal(0, new web3.utils.BN(2).cmp(await onigiri.investorsCount.call()), "should be 2 after");
  });

  it("should not increase investorsCount, if player is not new", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.investorsCount.call()), "should be 0 before");

    //  1
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });
    assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be 1 after");

    //  2
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });
    assert.equal(0, new web3.utils.BN(1).cmp(await onigiri.investorsCount.call()), "should be again 1 after");
  });

  it("should update lockbox after single investment", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });
    assert.equal(0, ether("0.84").cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0.84 after");
  });

  it("should update lockbox after multiple investments", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await time.increase(time.duration.minutes(1));
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });
    assert.equal(0, ether("1.68").cmp((await onigiri.investors.call(INVESTOR_0)).lockbox), "lockbox should be 1.68 after");
  });

  it("should update invested after single investment", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });
    assert.equal(0, ether("1").cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 1 after");
  });

  it("should update invested after multiple investments", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await time.increase(time.duration.minutes(1));
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });
    assert.equal(0, ether("2").cmp((await onigiri.investors.call(INVESTOR_0)).invested), "invested should be 2 after");
  });

  it("should update lastInvestmentTime after investment", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).lastInvestmentTime), "lastInvestmentTime should be 0 before");
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.1")
    });
    assert.equal(0, (await time.latest()).cmp((await onigiri.investors.call(INVESTOR_0)).lastInvestmentTime), "lastInvestmentTime should be 0 before");
  });

  it("should clear withdrawn after investment", async () => {
    //  1 - invest
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });

    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("1")
    });

    //  2 - withdraw profit
    await time.increase(time.duration.days(1));
    await onigiri.withdrawProfit({
      from: INVESTOR_0
    });

    assert.equal(-1, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).withdrawn), "withdrawn should be > 0");

    //  3 - invest
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.1")
    });

    assert.equal(0, new web3.utils.BN(0).cmp((await onigiri.investors.call(INVESTOR_0)).withdrawn), "withdrawn should be == 0");
  });

  it("should increase lockboxTotal", async () => {
    assert.equal(0, new web3.utils.BN(0).cmp(await onigiri.lockboxTotal.call()), "should be 0 before");

    //  1
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("0.5")
    });
    assert.equal(0, new web3.utils.BN(ether("0.42")).cmp(await onigiri.lockboxTotal.call()), "should be 0.42 after");

    //  2
    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("1.5")
    });
    assert.equal(0, new web3.utils.BN(ether("1.68")).cmp(await onigiri.lockboxTotal.call()), "should be again 1.68 after");
  });

  it("should update devCommission correctly on single investment", async () => {
    assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
      from: DEV_0_ESCROW
    })), "devCommission for DEV_0_ESCROW should be 0 before");
    assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
      from: DEV_1_ESCROW
    })), "devCommission for DEV_1_ESCROW should be 0 before");

    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
      from: DEV_0_ESCROW
    })), "devCommission for DEV_0_ESCROW should be 0.02 after");
    assert.equal(0, ether("0.02").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
      from: DEV_1_ESCROW
    })), "devCommission for DEV_1_ESCROW should be 0.02 after");
  });

  it("should update devCommission correctly on multiple investments", async () => {
    assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
      from: DEV_0_ESCROW
    })), "devCommission for DEV_0_ESCROW should be 0 before");
    assert.equal(0, ether("0").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
      from: DEV_1_ESCROW
    })), "devCommission for DEV_1_ESCROW should be 0 before");

    //  1
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    //  2
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    //  3
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    assert.equal(0, ether("0.06").cmp(await onigiri.devCommission.call(DEV_0_ESCROW, {
      from: DEV_0_ESCROW
    })), "devCommission for DEV_0_ESCROW should be 0.06 after");
    assert.equal(0, ether("0.06").cmp(await onigiri.devCommission.call(DEV_1_ESCROW, {
      from: DEV_1_ESCROW
    })), "devCommission for DEV_1_ESCROW should be 0.06 after");
  });
});

describe("Reinvest", () => {
  it("should fail if no investment", async () => {
    await shouldFail(onigiri.reinvestProfit({
      from: INVESTOR_0
    }), "no investment, so should fail");
  });

  it("should fail if no profit", async () => {
    //  invest
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await time.increase(time.duration.minutes(40));

    await shouldFail(onigiri.reinvestProfit({
      from: INVESTOR_0
    }), "no profit, so should fail");
  });

  it("should fail if not enough funds", async () => {
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await time.increase(time.duration.weeks(30));
    await shouldFail(onigiri.reinvestProfit({
      from: INVESTOR_0
    }), "not enough funds");
  });

  it("should update with correct lockbox for 1 ETH investment", async () => {
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("2")
    });

    await time.increase(time.duration.weeks(2));
    let profit = new web3.utils.BN(await onigiri.calculateProfit.call(INVESTOR_0));
    let profit_lockbox = profit.div(new web3.utils.BN(100)).mul(new web3.utils.BN(84));

    await onigiri.reinvestProfit({
      from: INVESTOR_0
    });

    let currentLockbox = await onigiri.getLockBox.call(INVESTOR_0);
    let expectedLockbox = ether("0.84").add(profit_lockbox);
    assert.equal(0, currentLockbox.cmp(expectedLockbox), "wrong lockbox after reinvest");
  });

  it("should update with correct lastInvestedTime", async () => {
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("2")
    });

    await time.increase(time.duration.weeks(2));
    await onigiri.reinvestProfit({
      from: INVESTOR_0
    });
    let reinvestTime = await time.latest();

    await time.increase(time.duration.weeks(2));
    assert.equal(0, reinvestTime.cmp(await onigiri.getLastInvestmentTime.call(INVESTOR_0)), "wrong last invest time after reinvest");
  });

  it("should update with correct invested amount", async () => {
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });

    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("2")
    });

    await time.increase(time.duration.weeks(2));
    let profit = new web3.utils.BN(await onigiri.calculateProfit.call(INVESTOR_0));

    await onigiri.reinvestProfit({
      from: INVESTOR_0
    });

    let currentInvested = await onigiri.getInvested.call(INVESTOR_0);
    let expectedInvested = ether("1").add(profit);
    assert.equal(0, currentInvested.cmp(expectedInvested), "wrong invested after reinvest");
  });

  it("should update with correct lockboxTotal", async () => {
    // 1 - invest
    await onigiri.invest(REFERRAL_0, {
      from: INVESTOR_0,
      value: ether("1")
    });
    let lockboxTotal_0 = ether("0.84");
    assert.equal(0, (await onigiri.lockboxTotal.call()).cmp(lockboxTotal_0), "wrong after investment");

    await time.increase(time.duration.hours(2));

    // 1 - reinvest
    let profit = new web3.utils.BN(await onigiri.calculateProfit.call(INVESTOR_0));
    let profit_lockbox = profit.div(new web3.utils.BN(100)).mul(new web3.utils.BN(84));
    await onigiri.reinvestProfit({
      from: INVESTOR_0
    });

    let lockboxTotal_1 = lockboxTotal_0.add(profit_lockbox);
    assert.equal(0, (await onigiri.lockboxTotal.call()).cmp(lockboxTotal_1), "wrong lockbox after reinvest");

    // 3 - invest
    await time.increase(time.duration.hours(2));
    await onigiri.invest(REFERRAL_1, {
      from: INVESTOR_1,
      value: ether("2")
    });
    let lockboxTotal_2 = ether("1.68").add(lockboxTotal_1);
    assert.equal(0, (await onigiri.lockboxTotal.call()).cmp(lockboxTotal_2), "wrong after next investment");

  });
});
*/