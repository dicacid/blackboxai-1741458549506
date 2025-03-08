// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CryptixTicket
 * @dev Implementation of the Cryptix festival ticketing system
 */
contract CryptixTicket is ERC721, ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Ticket {
        uint256 eventId;
        uint256 originalPrice;
        uint256 currentPrice;
        address originalOwner;
        bool isValid;
        bool isResellable;
        uint256 maxResalePrice; // Price cap for resale
    }

    // Mapping from token ID to Ticket struct
    mapping(uint256 => Ticket) public tickets;
    
    // Mapping from event ID to event details
    mapping(uint256 => EventDetails) public events;
    
    // Event organizer details
    mapping(address => bool) public isOrganizer;
    
    // Blacklisted tickets
    mapping(uint256 => bool) public isBlacklisted;

    struct EventDetails {
        string name;
        uint256 date;
        uint256 basePrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        address organizer;
        bool exists;
    }

    // Platform fee percentages (in basis points, 100 = 1%)
    uint256 public primarySaleFee = 250; // 2.5%
    uint256 public secondarySaleFee = 100; // 1%
    
    // Events
    event TicketIssued(uint256 indexed tokenId, uint256 indexed eventId, address owner);
    event TicketTransferred(uint256 indexed tokenId, address from, address to, uint256 price);
    event TicketBlacklisted(uint256 indexed tokenId);
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor() ERC721("CryptixTicket", "CTIX") {}

    /**
     * @dev Create a new event
     */
    function createEvent(
        string memory name,
        uint256 date,
        uint256 basePrice,
        uint256 maxTickets
    ) external returns (uint256) {
        require(date > block.timestamp, "Event date must be in the future");
        require(basePrice > 0, "Base price must be greater than 0");
        require(maxTickets > 0, "Max tickets must be greater than 0");

        uint256 eventId = _tokenIds.current();
        _tokenIds.increment();

        events[eventId] = EventDetails({
            name: name,
            date: date,
            basePrice: basePrice,
            maxTickets: maxTickets,
            ticketsSold: 0,
            organizer: msg.sender,
            exists: true
        });

        isOrganizer[msg.sender] = true;
        emit EventCreated(eventId, name, msg.sender);
        return eventId;
    }

    /**
     * @dev Issue a new ticket for an event
     */
    function issueTicket(
        uint256 eventId,
        address to,
        bool isResellable,
        uint256 maxResalePrice
    ) external payable returns (uint256) {
        require(events[eventId].exists, "Event does not exist");
        require(events[eventId].ticketsSold < events[eventId].maxTickets, "Event is sold out");
        require(msg.value >= events[eventId].basePrice, "Insufficient payment");

        uint256 tokenId = _tokenIds.current();
        _tokenIds.increment();

        tickets[tokenId] = Ticket({
            eventId: eventId,
            originalPrice: events[eventId].basePrice,
            currentPrice: events[eventId].basePrice,
            originalOwner: to,
            isValid: true,
            isResellable: isResellable,
            maxResalePrice: maxResalePrice
        });

        events[eventId].ticketsSold++;

        // Calculate and transfer platform fee
        uint256 platformFee = (msg.value * primarySaleFee) / 10000;
        payable(owner()).transfer(platformFee);
        
        // Transfer remaining amount to event organizer
        payable(events[eventId].organizer).transfer(msg.value - platformFee);

        _safeMint(to, tokenId);
        emit TicketIssued(tokenId, eventId, to);
        return tokenId;
    }

    /**
     * @dev Transfer a ticket to a new owner
     */
    function transferTicket(
        uint256 tokenId,
        address to,
        uint256 price
    ) external payable nonReentrant {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not ticket owner");
        require(tickets[tokenId].isValid, "Ticket is not valid");
        require(!isBlacklisted[tokenId], "Ticket is blacklisted");
        require(tickets[tokenId].isResellable, "Ticket is not resellable");
        require(price <= tickets[tokenId].maxResalePrice, "Price exceeds maximum allowed");

        // Calculate and transfer platform fee
        uint256 platformFee = (msg.value * secondarySaleFee) / 10000;
        payable(owner()).transfer(platformFee);
        
        // Transfer payment to seller
        payable(msg.sender).transfer(msg.value - platformFee);

        tickets[tokenId].currentPrice = price;
        _transfer(msg.sender, to, tokenId);
        emit TicketTransferred(tokenId, msg.sender, to, price);
    }

    /**
     * @dev Blacklist a ticket
     */
    function blacklistTicket(uint256 tokenId) external {
        require(
            msg.sender == owner() || msg.sender == events[tickets[tokenId].eventId].organizer,
            "Not authorized"
        );
        require(tickets[tokenId].isValid, "Ticket is already invalid");

        isBlacklisted[tokenId] = true;
        tickets[tokenId].isValid = false;
        emit TicketBlacklisted(tokenId);
    }

    /**
     * @dev Check if a ticket is valid
     */
    function isTicketValid(uint256 tokenId) external view returns (bool) {
        return tickets[tokenId].isValid && !isBlacklisted[tokenId];
    }

    /**
     * @dev Get ticket details
     */
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
        )
    {
        Ticket memory ticket = tickets[tokenId];
        return (
            ticket.eventId,
            ticket.originalPrice,
            ticket.currentPrice,
            ticket.originalOwner,
            ticket.isValid,
            ticket.isResellable,
            ticket.maxResalePrice
        );
    }

    /**
     * @dev Update platform fees
     */
    function updatePlatformFees(uint256 newPrimarySaleFee, uint256 newSecondarySaleFee)
        external
        onlyOwner
    {
        require(newPrimarySaleFee <= 1000, "Primary sale fee too high"); // Max 10%
        require(newSecondarySaleFee <= 1000, "Secondary sale fee too high"); // Max 10%
        primarySaleFee = newPrimarySaleFee;
        secondarySaleFee = newSecondarySaleFee;
    }
}
