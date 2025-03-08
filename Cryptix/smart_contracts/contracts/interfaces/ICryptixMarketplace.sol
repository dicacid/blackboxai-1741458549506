// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ICryptixMarketplace
 * @dev Interface for the CryptixMarketplace contract
 */
interface ICryptixMarketplace {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
        uint256 timestamp;
    }

    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);

    function listTicket(uint256 tokenId, uint256 price) external;

    function purchaseTicket(uint256 tokenId) external;

    function cancelListing(uint256 tokenId) external;

    function stakeTokens(uint256 amount) external;

    function withdrawStake(uint256 amount) external;

    function hasPremiumAccess(address user) external view returns (bool);

    function getListingDetails(uint256 tokenId)
        external
        view
        returns (
            address seller,
            uint256 price,
            bool active,
            uint256 timestamp
        );

    function updatePlatformFee(uint256 newFee) external;

    function updateMinimumStake(uint256 newMinimum) external;

    function recoverTokens(address token, uint256 amount) external;

    function userStakes(address user) external view returns (uint256);

    function platformFee() external view returns (uint256);

    function minimumStake() external view returns (uint256);

    function ticketContract() external view returns (address);

    function crxToken() external view returns (address);
}
