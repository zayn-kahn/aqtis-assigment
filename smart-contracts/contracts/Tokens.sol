//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FUDToken is ERC20 {
    string constant private s_name = "FUD Token";
    string constant private s_symbol = "FUD";
    uint256 immutable s_max_supply = 1_500_000 * 10 ** decimals();

    constructor (address _minter) ERC20(s_name, s_symbol) {
        _mint(_minter, s_max_supply);
    }
    
    function name() public pure override returns (string memory) {
        return s_name;
    }
    
    function symbol() public pure override returns (string memory) {
        return s_symbol;
    }
    
    function maxSupply() public view returns (uint) {
        return s_max_supply;
    }
}

contract WINToken is ERC20, Ownable {
    string constant private s_name = "WIN Token";
    string constant private s_symbol = "WIN";

    constructor () ERC20(s_name, s_symbol) {}

    function name() public pure override returns (string memory) {
        return s_name;
    }
    
    function symbol() public pure override returns (string memory) {
        return s_symbol;
    }

    function mint(address account, uint256 amount) public onlyOwner returns(bool) {
        _mint(account, amount);
        return true;
    }
}



