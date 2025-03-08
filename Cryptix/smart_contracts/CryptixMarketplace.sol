// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CryptixTicket.sol";

/**
 * @title CryptixMarketplace
 * @dev Implementation of the Cryptix ticket marketplace
 */
contract CryptixMarketplace is ReentrancyGuard, Ownable {
    CryptixTicket public ticketContract;
    IERC20 public crxToken;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 timestamp;
    }

    // Mapping from token ID to listing details
    mapping(uint256 => Listing) public listings;
    
    // Mapping for user stakes
    mapping(address => uint256) public userStakes;
    
    // Minimum stake required for premium features
    uint256 public minimumStake = 1000 * 10**18; // 1000 CRX tokens
    
    // Platform fees (in basis points, 100 = 1%)
    uint256 public platformFee = 100; // 1%
    
    // Events
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);

    constructor(address _ticketContract, address _crxToken) {
        ticketContract = CryptixTicket(_ticketContract);
        crxToken = IERC20(_crxToken);
    }

    /**
     * @dev List a ticket for sale
     */
    function listTicket(uint256 tokenId, uint256 price) external nonReentrant {
        require(ticketContract.ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(ticketContract.isTicketValid(tokenId), "Ticket is not valid");
        
        // Get ticket details
        (,,,,,bool isResellable, uint256 maxResalePrice) = ticketContract.getTicketDetails(tokenId);
        require(isResellable, "Ticket is not resellable");
        require(price <= maxResalePrice, "Price exceeds maximum allowed");

        // Ensure marketplace is approved to transfer the ticket
        require(
            ticketContract.getApproved(tokenId) == address(this) ||
            ticketContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true,
            timestamp: block.timestamp
        });

        emit TicketListed(tokenId, msg.sender, price);
    }

    /**
     * @dev Purchase a listed ticket
     */
    function purchaseTicket(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Ticket not listed for sale");
        require(ticketContract.isTicketValid(tokenId), "Ticket is not valid");

        uint256 totalPrice = listing.price;
        uint256 platformFeeAmount = (totalPrice * platformFee) / 10000;
        uint256 sellerAmount = totalPrice - platformFeeAmount;

        // Transfer CRX tokens from buyer
        require(crxToken.transferFrom(msg.sender, address(this), totalPrice), "Token transfer failed");
        
        // Transfer platform fee
        require(crxToken.transfer(owner(), platformFeeAmount), "Platform fee transfer failed");
        
        // Transfer payment to seller
        require(crxToken.transfer(listing.seller, sellerAmount), "Seller payment failed");

        // Transfer ticket ownership
        ticketContract.transferFrom(listing.seller, msg.sender, tokenId);

        // Update listing status
        listings[tokenId].active = false;

        emit TicketSold(tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Cancel a ticket listing
     */
    function cancelListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].active, "Listing not active");

        listings[tokenId].active = false;
        emit ListingCancelled(tokenId, msg.sender);
    }

    /**
     * @dev Stake CRX tokens for premium features
     */
    function stakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens to contract
        require(crxToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update user stake
        userStakes[msg.sender] += amount;
        
        emit StakeDeposited(msg.sender, amount);
    }

    /**
     * @dev Withdraw staked CRX tokens
     */
    function withdrawStake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(userStakes[msg.sender] >= amount, "Insufficient stake");
        
        // Update user stake
        userStakes[msg.sender] -= amount;
        
        // Transfer tokens back to user
        require(crxToken.transfer(msg.sender, amount), "Token transfer failed");
        
        emit StakeWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Check if user has premium access
     */
    function hasPremiumAccess(address user) public view returns (bool) {
        return userStakes[user] >= minimumStake;
    }

    /**
     * @dev Get active listing details
     */
    function getListingDetails(uint256 tokenId)
        external
        view
        returns (
            address seller,
            uint256 price,
            bool active,
            uint256 timestamp
        )
    {
        Listing memory listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active, listing.timestamp);
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }

    /**
     * @dev Update minimum stake requirement
     */
    function updateMinimumStake(uint256 newMinimum) external onlyOwner {
        minimumStake = newMinimum;
    }

    /**
     * @dev Emergency function to recover tokens
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(crxToken), "Cannot recover staked tokens");
        IERC20(token).transfer(owner(), amount);
    }
}
