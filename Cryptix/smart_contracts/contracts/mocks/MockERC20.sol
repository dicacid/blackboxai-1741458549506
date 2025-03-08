// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev Implementation of the MockERC20 token for testing purposes
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;
    
    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = 18;
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address to, uint256 amount) public returns (bool) {
        _mint(to, amount);
        return true;
    }

    /**
     * @dev Function to burn tokens
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Function to burn tokens from a specific address
     * @param account The address to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burnFrom(address account, uint256 amount) public {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        unchecked {
            _approve(account, msg.sender, currentAllowance - amount);
        }
        _burn(account, amount);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Function to set the number of decimals
     * @param decimalsValue The number of decimals.
     */
    function setDecimals(uint8 decimalsValue) public onlyOwner {
        _decimals = decimalsValue;
    }

    /**
     * @dev Function to transfer tokens with a memo
     * @param recipient The address to transfer to.
     * @param amount The amount to be transferred.
     * @param memo The memo to be emitted in the event.
     */
    function transferWithMemo(
        address recipient,
        uint256 amount,
        string memory memo
    ) public returns (bool) {
        _transfer(msg.sender, recipient, amount);
        emit TransferMemo(msg.sender, recipient, amount, memo);
        return true;
    }

    /**
     * @dev Emitted when tokens are transferred with a memo
     */
    event TransferMemo(
        address indexed from,
        address indexed to,
        uint256 value,
        string memo
    );
}
