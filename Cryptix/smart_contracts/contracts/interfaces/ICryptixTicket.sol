// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ICryptixTicket
 * @dev Interface for the CryptixTicket contract
 */
interface ICryptixTicket {
    struct Ticket {
        uint256 eventId;
        uint256 originalPrice;
        uint256 currentPrice;
        address originalOwner;
        bool isValid;
        bool isResellable;
        uint256 maxResalePrice;
    }

    struct EventDetails {
        string name;
        uint256 date;
        uint256 basePrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        address organizer;
        bool exists;
    }

    event TicketIssued(uint256 indexed tokenId, uint256 indexed eventId, address owner);
    event TicketTransferred(uint256 indexed tokenId, address from, address to, uint256 price);
    event TicketBlacklisted(uint256 indexed tokenId);
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    function createEvent(
        string memory name,
        uint256 date,
        uint256 basePrice,
        uint256 maxTickets
    ) external returns (uint256);

    function issueTicket(
        uint256 eventId,
        address to,
        bool isResellable,
        uint256 maxResalePrice
    ) external payable returns (uint256);

    function transferTicket(
        uint256 tokenId,
        address to,
        uint256 price
    ) external payable;

    function blacklistTicket(uint256 tokenId) external;

    function isTicketValid(uint256 tokenId) external view returns (bool);

    function getTicketDetails(uint256 tokenId)
        external
        view
        returns (
            uint256 eventId,
            uint256 originalPrice,
            uint256 currentPrice,
            address originalOwner,
            bool isValid,
            bool isResellable,
            uint256 maxResalePrice
        );

    function updatePlatformFees(uint256 newPrimarySaleFee, uint256 newSecondarySaleFee)
        external;

    function ownerOf(uint256 tokenId) external view returns (address);

    function getApproved(uint256 tokenId) external view returns (address);

    function isApprovedForAll(address owner, address operator) external view returns (bool);

    function transferFrom(address from, address to, uint256 tokenId) external;
}
