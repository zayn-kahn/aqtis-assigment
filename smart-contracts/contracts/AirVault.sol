// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./Tokens.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AirVault is Ownable {
    FUDToken private s_fud_token;
    WINToken private s_win_token;
    uint256 constant private s_max_win_distribution_per_tx = 100;
    mapping(address => uint256) private s_balances;

    error AirVault__FUDTokenNotSet();
    error AirVault__WinTokenNotSet();
    error AirVault__MisMatchedArray();
    error AirVault__HasNotMadeDeposit();
    error AirVault__ZeroAmountNotAllowed();
    error AirVault__MaxAllowedPerTxReached(uint allowed, uint requested);
    
    event AirVault__Deposit(address indexed _address, uint256 _amount);
    event AirVault__Withdraw(address indexed _address, uint256 _amount);

    modifier isReady() {
        if (address(s_fud_token) == address(0)) {
            revert AirVault__FUDTokenNotSet();
        }
        if (address(s_win_token) == address(0)) {
            revert AirVault__WinTokenNotSet();
        }
        _;
    }


    constructor () {}

    function setFUDToken(address fud_token) public onlyOwner {
        s_fud_token = FUDToken(fud_token);
    }

    function fudToken() public view returns (address) {
        return address(s_fud_token);
    }

    function setWINToken(address win_token) public onlyOwner {
        s_win_token = WINToken(win_token);
    }

    function winToken() public view returns (address) {
        return address(s_win_token);
    }

	function deposit(uint256 amount) public isReady returns(bool){
        if (amount == 0) {
            revert AirVault__ZeroAmountNotAllowed();
        }
        emit AirVault__Deposit(msg.sender, amount);
        s_balances[msg.sender] += amount;
        return s_fud_token.transferFrom(msg.sender, address(this), amount);
    }

	function  withdraw(uint256 amount) public isReady returns(bool){
        if (amount == 0) {
            revert AirVault__ZeroAmountNotAllowed();
        }
        emit AirVault__Withdraw(msg.sender, amount);
        s_balances[msg.sender] -= amount;
        return s_fud_token.transfer(msg.sender, amount);
    }
	
	function lockedBalanceOf(address account) public view returns(uint256 balance){
        balance = s_balances[account];
        if (balance == 0) {
            revert AirVault__HasNotMadeDeposit();
        }
        return balance;
    }

    function distributeWinTokens(address[] memory _winners, uint256[] memory _amounts) public isReady onlyOwner {
        uint total = _winners.length;
        if (total != _amounts.length) {
            revert AirVault__MisMatchedArray();
        }
        if (total > s_max_win_distribution_per_tx) {
            revert AirVault__MaxAllowedPerTxReached(s_max_win_distribution_per_tx, total);
        }
        for (uint i = 0; i < total; i++) {
            require(s_win_token.mint(_winners[i], _amounts[i]), 'mint failed');
        }
    }
}
