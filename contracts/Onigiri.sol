pragma solidity ^0.4.25;

import "./SafeMath.sol";

contract Onigiri {
    using SafeMath for uint256;

    struct InvestorInfo {
        uint256 invested;
        uint256 lockbox;
        uint256 withdrawn;
        uint256 lastInvestmentTime;
    }
    
    mapping (address => InvestorInfo) public investors;
    mapping (address => uint256) public affiliateCommission;
    mapping (address => uint256) public devCommission;

    uint256 public investorsCount;
    uint256 public lockboxTotal;
    uint256 public withdrawnProfitTotal;
    uint256 public affiliateCommissionWithdrawnTotal;
    
    uint256 public donatedTotal;    //  track donate function only. Fallback function is not tracked.
    uint256 public gamesIncomeTotal;
    
    address private constant dev_0_master = address(0x414af136eca69c4f3e2a7ee25b9bb98e5b6e8c1c57);  //  TODO: Ronald master
    address private constant dev_1_master = address(0x418a3880ae446488a1ed024f8c1fee4876c8b920a7);  //  TODO: Ivan master
    address private dev_0_escrow = address(0x416ef669ba1352471706ebbbc065be32bebcc71136);           //  TODO: Ronald escrow
    address private dev_1_escrow = address(0x41f6bbe2c6a123c57639fd483c299aaae895635b9f);           //  TODO: Ivan escrow

    uint256 public constant minInvest = 0xEE6B280;  //250 * (10 ** 6);
    uint256 public constant whaleLimitLockbox = 0x3A352944000;  //  4 000 000 * (10 ** 6)
    uint256 public constant whaleLimitInvest = 0x5D21DBA000;  //  400 000 * (10 ** 6)

    event Invested(address indexed investor, uint256 indexed amount);
    event Reinvested(address indexed investor, uint256 indexed amount);
    event WithdrawnAffiliateCommission(address indexed affiliate, uint256 indexed amount);
    event WithdrawnProfit(address indexed investor, uint256 amount);
    event WithdrawnLockBoxPartially(address indexed investor, uint256 indexed amount);
    event WithdrawnLockbox(address indexed investor, uint256 indexed amount);


    /**
     * PUBLIC
     */

     /**
     * @dev Donation for Onigiry ecosystem.
     * @notice Can not be tracked, becauseof Tron limitations     
     */
    function() external payable {
    }

    /**
     * @dev Accepts donations.
     * TESTED
     */

    function donate() external payable {
        //  2% - to developers
        uint256 devFee = msg.value.div(100);
        devCommission[dev_0_escrow] = devCommission[dev_0_escrow].add(devFee);
        devCommission[dev_1_escrow] = devCommission[dev_1_escrow].add(devFee);
        
        donatedTotal = donatedTotal.add(msg.value);
    }

    /**
     * @dev Accepts income from games for Onigiry ecosystem.
     * TESTED
     */
    function fromGame() external payable {
        //  4% - to developers
        uint256 devFee = msg.value.div(100).mul(2);
        devCommission[dev_0_escrow] = devCommission[dev_0_escrow].add(devFee);
        devCommission[dev_1_escrow] = devCommission[dev_1_escrow].add(devFee);
        
        gamesIncomeTotal = gamesIncomeTotal.add(msg.value);
    }

    /**
     * @dev Returns invested amount for investor.
     * @param _address Investor address.
     * @return invested amount.
     * TESTED     
     */
    function getInvested(address _address) public view returns(uint256) {
        return investors[_address].invested;
    }

    /**
     * @dev Returns lockbox amount for investor.
     * @param _address Investor address.
     * @return lockbox amount.
     * TESTED     
     */
    function getLockBox(address _address) public view returns(uint256) {
        return investors[_address].lockbox;
    }

    /**
     * @dev Returns withdrawn amount for investor.
     * @param _address Investor address.
     * @return withdrawn amount.
     * TESTED
     */
    function getWithdrawn(address _address) public view returns(uint256) {
        return investors[_address].withdrawn;
    }

    /**
     * @dev Returns last investment time amount for investor.
     * @param _address Investor address.
     * @return last investment time.
     * TESTED
     */
    function getLastInvestmentTime(address _address) public view returns(uint256) {
        return investors[_address].lastInvestmentTime;
    }

    /**
     * @dev Gets balance for current contract.
     * @return balance for current contract.
     * TESTED
     */
    function getBalance() public view returns(uint256){
        return address(this).balance;
    }

    /**
     * @dev Calculates sum for lockboxes and dev fees.
     * @return Amount of guaranteed balance by constract.
     * TESTED
     */
    function guaranteedBalance() public view returns(uint256) {
        return lockboxTotal.add(devCommission[dev_0_escrow]).add(devCommission[dev_1_escrow]);
    }

    /**
     * @dev User invests funds.
     * @param _affiliate affiliate address.
     * TODO: TESTED
     */
    function invest(address _affiliate) public payable {
        require(msg.value >= minInvest, "min 250 TRX");
        if(lockboxTotal <= whaleLimitLockbox) {
            require(msg.value <= whaleLimitInvest, "max invest whaleLimitLockbox TRX");
        }

        if(calculateProfit(msg.sender) > 0){
            withdrawProfit();
        }

        //  1% - to affiliateCommission
        if(_affiliate != msg.sender && _affiliate != address(0)) {
            uint256 commission = msg.value.div(100);
            affiliateCommission[_affiliate] = affiliateCommission[_affiliate].add(commission);
        }

        if(getLastInvestmentTime(msg.sender) == 0) {
            investorsCount = investorsCount.add(1);
        }

        uint256 lockboxAmount = msg.value.div(100).mul(84);
        investors[msg.sender].lockbox = investors[msg.sender].lockbox.add(lockboxAmount);
        investors[msg.sender].invested = investors[msg.sender].invested.add(msg.value);
        investors[msg.sender].lastInvestmentTime = now;
        delete investors[msg.sender].withdrawn;
        
        lockboxTotal = lockboxTotal.add(lockboxAmount);
        
        //  4% - to developers
        uint256 devFee = msg.value.div(100).mul(2);
        devCommission[dev_0_escrow] = devCommission[dev_0_escrow].add(devFee);
        devCommission[dev_1_escrow] = devCommission[dev_1_escrow].add(devFee);

        emit Invested(msg.sender, msg.value);
    }

    /**
     * @dev Updates escrow address for developer.
     * @param _address Address of escrow to be used.
     * TESTED
     */
    function updateDevEscrow(address _address) public {
        require(msg.sender == dev_0_master || msg.sender == dev_1_master, "not dev");
        (msg.sender == dev_0_master) ? dev_0_escrow = _address : dev_1_escrow = _address;
    }

    /**
     * @dev Allows developer to withdraw commission.
     * TESTED
     */
    function withdrawDevCommission() public {
        uint256 commission = devCommission[msg.sender];
        require(commission > 0, "no dev commission");
        require(address(this).balance.sub(commission) >= lockboxTotal, "not enough funds");

        delete devCommission[msg.sender];
        msg.sender.transfer(commission);
    }
    
    /**
     * @dev Withdraws affiliate commission for current address.
     * TESTED
     */
    function withdrawAffiliateCommission() public {
        uint256 commission = affiliateCommission[msg.sender];
        require(commission > 0, "no commission");
        require(address(this).balance.sub(commission) >= guaranteedBalance(), "not enough funds");

        delete affiliateCommission[msg.sender];
        affiliateCommissionWithdrawnTotal = affiliateCommissionWithdrawnTotal.add(commission);

        msg.sender.transfer(commission);

        emit WithdrawnAffiliateCommission(msg.sender, commission);
    }

    /**
     * @dev Withdraws profit.
     * TESTED
     */
    function withdrawProfit() public {
        uint256 profit = calculateProfit(msg.sender);
        require(profit > 0, "No profit");
        require(address(this).balance.sub(profit) >= guaranteedBalance(), "Not enough funds");
        
        investors[msg.sender].withdrawn = investors[msg.sender].withdrawn.add(profit);
        withdrawnProfitTotal = withdrawnProfitTotal.add(profit);
        investors[msg.sender].lastInvestmentTime = now;
        
        //  2% - to developers
        uint256 devFee = profit.div(100);
        devCommission[dev_0_escrow] = devCommission[dev_0_escrow].add(devFee);
        devCommission[dev_1_escrow] = devCommission[dev_1_escrow].add(devFee);
        
        //  3% - stay in contract
        msg.sender.transfer(profit.div(100).mul(95));

        emit WithdrawnProfit(msg.sender, profit);
    }

    /**
     * @dev Allows investor to withdraw lockbox funds, close deposit and clear all data.
     * @notice Pending profit stays in contract.
     * TESTED
     */
    function withdrawLockBoxAndClose() public {
        uint256 lockboxAmount = getLockBox(msg.sender);
        require(lockboxAmount > 0, "no investments");

        delete investors[msg.sender];
        investorsCount = investorsCount.sub(1);
        lockboxTotal = lockboxTotal.sub(lockboxAmount);

        msg.sender.transfer(lockboxAmount);

        emit WithdrawnLockbox(msg.sender, lockboxAmount);
    }

    /**
     * @dev Allows investor to withdraw part of lockbox funds.
     * @param _amount Amount to withdraw.
     * TESTED
     */
    function withdrawLockBoxPartially(uint256 _amount) public {
        require(_amount > 0, "No amount");

        uint256 lockboxAmount = getLockBox(msg.sender);
        require(lockboxAmount > 0, "No investments");
        require(_amount <= lockboxAmount, "Not enough lockBox");

        if (_amount == lockboxAmount) {
            withdrawLockBoxAndClose();
            return;
        }

        investors[msg.sender].lockbox = investors[msg.sender].lockbox.sub(_amount);
        lockboxTotal = lockboxTotal.sub(_amount);
        msg.sender.transfer(_amount);

        emit WithdrawnLockBoxPartially(msg.sender, _amount);
    }
    
    /**
     * @dev Reinvests pending profit.
     * Tested
     */
    function reinvestProfit() public {
        uint256 profit = calculateProfit(msg.sender);
        require(profit > 0, "no profit");
        require(address(this).balance.sub(profit) >= guaranteedBalance(), "not enough funds");
        
        uint256 lockboxFromProfit = profit.div(100).mul(84);
        investors[msg.sender].lockbox = investors[msg.sender].lockbox.add(lockboxFromProfit);
        investors[msg.sender].invested = investors[msg.sender].invested.add(profit);
        investors[msg.sender].lastInvestmentTime = now;
        delete investors[msg.sender].withdrawn;

        lockboxTotal = lockboxTotal.add(lockboxFromProfit);

        emit Reinvested(msg.sender, profit);
    }

    /**
     * @dev Calculates pending profit for provided customer.
     * @param _investor Address of investor.
     * @return pending profit.
     * TESTED
     */
    function calculateProfit(address _investor) public view returns(uint256){
        uint256 hourDifference = now.sub(investors[_investor].lastInvestmentTime).div(3600);
        uint256 rate = percentRateInternal(investors[_investor].lockbox);
        uint256 calculatedPercent = hourDifference.mul(rate);
        uint256 profitTotal = investors[_investor].lockbox.div(100000).mul(calculatedPercent);
        return profitTotal.sub(investors[_investor].withdrawn);
    }

    /**
     * @dev Calculates rate for lockbox balance for msg.sender.
     * @param _balance Balance to calculate percentage. Value in Sun.
     * @return rate for lockbox balance.
     * TESTED
     */
    function percentRateInternal(uint256 _balance) private pure returns(uint256) {
        /**
            ~ 7500              - 0.6%
            7501 - 380,000      - 0.72% 
            380,001 - 750,000   - 0.84%
            750,001 - 1,885,000 - 0.96% 
            1,885,001 ~         - 1.08%       
        */
        uint256 step_1 = toSun(7501);
        uint256 step_2 = toSun(380001);
        uint256 step_3 = toSun(750001);
        uint256 step_4 = toSun(1885001);

        uint256 dailyPercent_0 = 25;   //  0.6%
        uint256 dailyPercent_1 = 30;   //  0.72%
        uint256 dailyPercent_2 = 35;   //  0.84%
        uint256 dailyPercent_3 = 40;   //  0.96%
        uint256 dailyPercent_4 = 45;   //  1.08%

        if (_balance >= step_4) {
            return dailyPercent_4;
        } else if (_balance >= step_3 && _balance < step_4) {
            return dailyPercent_3;
        } else if (_balance >= step_2 && _balance < step_3) {
            return dailyPercent_2;
        } else if (_balance >= step_1 && _balance < step_2) {
            return dailyPercent_1;
        }

        return dailyPercent_0;
    }

    /**
     * @dev Calculates rate for lockbox balance for msg.sender. User for public
     * @param _balance Balance to calculate percentage. Value in Sun.
     * @return rate for lockbox balance.
     * TESTED
     */
    function percentRatePublic(uint256 _balance) public pure returns(uint256) {
        require(_balance > 0, "balance is 0");
        /**
            ~ 7500              - 0.6%
            7501 - 380,000      - 0.72% 
            380,001 - 750,000   - 0.84%
            750,001 - 1,885,000 - 0.96% 
            1,885,001 ~         - 1.08%       
        */
        uint256 step_1 = toSun(7501);
        uint256 step_2 = toSun(380001);
        uint256 step_3 = toSun(750001);
        uint256 step_4 = toSun(1885001);

        uint256 dailyPercent_0 = 60;   //  0.6%
        uint256 dailyPercent_1 = 72;   //  0.72%
        uint256 dailyPercent_2 = 84;   //  0.84%
        uint256 dailyPercent_3 = 96;   //  0.96%
        uint256 dailyPercent_4 = 108;  //  1.08%

        if (_balance >= step_4) {
            return dailyPercent_4;
        } else if (_balance >= step_3 && _balance < step_4) {
            return dailyPercent_3;
        } else if (_balance >= step_2 && _balance < step_3) {
            return dailyPercent_2;
        } else if (_balance >= step_1 && _balance < step_2) {
            return dailyPercent_1;
        }

        return dailyPercent_0;
    }

    /**
     * PRIVATE
     */

    /**
     * @dev Converts TRX to Sun.
     * @param _trx TRX amount
     * @return Sun amount
    */
    function toSun(uint256 _trx) private pure returns (uint256 _res) {
        _res = _trx.mul(10**6);
    }
}