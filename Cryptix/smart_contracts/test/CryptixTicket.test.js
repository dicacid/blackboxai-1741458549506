const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CryptixTicket", function () {
    let CryptixTicket;
    let cryptixTicket;
    let owner;
    let organizer;
    let buyer;
    let addrs;

    beforeEach(async function () {
        // Get the ContractFactory and Signers
        CryptixTicket = await ethers.getContractFactory("CryptixTicket");
        [owner, organizer, buyer, ...addrs] = await ethers.getSigners();

        // Deploy the contract
        cryptixTicket = await CryptixTicket.deploy();
        await cryptixTicket.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await cryptixTicket.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await cryptixTicket.name()).to.equal("CryptixTicket");
            expect(await cryptixTicket.symbol()).to.equal("CTIX");
        });
    });

    describe("Event Creation", function () {
        const eventName = "Test Festival";
        const eventDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
        const basePrice = ethers.utils.parseEther("0.1");
        const maxTickets = 100;

        it("Should create an event successfully", async function () {
            await cryptixTicket.connect(organizer).createEvent(
                eventName,
                eventDate,
                basePrice,
                maxTickets
            );

            const eventId = 0; // First event
            const event = await cryptixTicket.events(eventId);

            expect(event.name).to.equal(eventName);
            expect(event.date).to.equal(eventDate);
            expect(event.basePrice).to.equal(basePrice);
            expect(event.maxTickets).to.equal(maxTickets);
            expect(event.organizer).to.equal(organizer.address);
            expect(event.exists).to.be.true;
        });

        it("Should fail if event date is in the past", async function () {
            const pastDate = Math.floor(Date.now() / 1000) - 86400; // Yesterday
            await expect(
                cryptixTicket.connect(organizer).createEvent(
                    eventName,
                    pastDate,
                    basePrice,
                    maxTickets
                )
            ).to.be.revertedWith("Event date must be in the future");
        });
    });

    describe("Ticket Issuance", function () {
        const eventName = "Test Festival";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const basePrice = ethers.utils.parseEther("0.1");
        const maxTickets = 100;
        let eventId;

        beforeEach(async function () {
            await cryptixTicket.connect(organizer).createEvent(
                eventName,
                eventDate,
                basePrice,
                maxTickets
            );
            eventId = 0;
        });

        it("Should issue a ticket successfully", async function () {
            const isResellable = true;
            const maxResalePrice = ethers.utils.parseEther("0.2");

            await cryptixTicket.connect(buyer).issueTicket(
                eventId,
                buyer.address,
                isResellable,
                maxResalePrice,
                { value: basePrice }
            );

            const tokenId = 0; // First ticket
            const ticket = await cryptixTicket.tickets(tokenId);

            expect(ticket.eventId).to.equal(eventId);
            expect(ticket.originalPrice).to.equal(basePrice);
            expect(ticket.currentPrice).to.equal(basePrice);
            expect(ticket.originalOwner).to.equal(buyer.address);
            expect(ticket.isValid).to.be.true;
            expect(ticket.isResellable).to.equal(isResellable);
            expect(ticket.maxResalePrice).to.equal(maxResalePrice);
        });

        it("Should collect platform fee on primary sale", async function () {
            const initialBalance = await owner.getBalance();
            
            await cryptixTicket.connect(buyer).issueTicket(
                eventId,
                buyer.address,
                true,
                basePrice.mul(2),
                { value: basePrice }
            );

            const finalBalance = await owner.getBalance();
            const platformFee = basePrice.mul(250).div(10000); // 2.5%
            
            expect(finalBalance.sub(initialBalance)).to.equal(platformFee);
        });

        it("Should fail if payment is insufficient", async function () {
            await expect(
                cryptixTicket.connect(buyer).issueTicket(
                    eventId,
                    buyer.address,
                    true,
                    basePrice.mul(2),
                    { value: basePrice.div(2) }
                )
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should fail if event is sold out", async function () {
            // Create event with 1 ticket max
            await cryptixTicket.connect(organizer).createEvent(
                "Small Event",
                eventDate,
                basePrice,
                1
            );
            const smallEventId = 1;

            // Buy the only ticket
            await cryptixTicket.connect(buyer).issueTicket(
                smallEventId,
                buyer.address,
                true,
                basePrice.mul(2),
                { value: basePrice }
            );

            // Try to buy another ticket
            await expect(
                cryptixTicket.connect(addrs[0]).issueTicket(
                    smallEventId,
                    addrs[0].address,
                    true,
                    basePrice.mul(2),
                    { value: basePrice }
                )
            ).to.be.revertedWith("Event is sold out");
        });
    });

    describe("Ticket Transfer", function () {
        let tokenId;
        const eventName = "Test Festival";
        const eventDate = Math.floor(Date.now() / 1000) + 86400;
        const basePrice = ethers.utils.parseEther("0.1");
        const resalePrice = ethers.utils.parseEther("0.15");

        beforeEach(async function () {
            // Create event and issue ticket
            await cryptixTicket.connect(organizer).createEvent(
                eventName,
                eventDate,
                basePrice,
                100
            );
            
            await cryptixTicket.connect(buyer).issueTicket(
                0, // eventId
                buyer.address,
                true, // isResellable
                basePrice.mul(2), // maxResalePrice
                { value: basePrice }
            );
            
            tokenId = 0;
        });

        it("Should transfer ticket successfully", async function () {
            const newOwner = addrs[0];
            
            await cryptixTicket.connect(buyer).transferTicket(
                tokenId,
                newOwner.address,
                resalePrice,
                { value: resalePrice }
            );

            expect(await cryptixTicket.ownerOf(tokenId)).to.equal(newOwner.address);
            
            const ticket = await cryptixTicket.tickets(tokenId);
            expect(ticket.currentPrice).to.equal(resalePrice);
        });

        it("Should collect platform fee on secondary sale", async function () {
            const initialBalance = await owner.getBalance();
            const newOwner = addrs[0];
            
            await cryptixTicket.connect(buyer).transferTicket(
                tokenId,
                newOwner.address,
                resalePrice,
                { value: resalePrice }
            );

            const finalBalance = await owner.getBalance();
            const platformFee = resalePrice.mul(100).div(10000); // 1%
            
            expect(finalBalance.sub(initialBalance)).to.equal(platformFee);
        });

        it("Should fail if ticket is not resellable", async function () {
            // Issue non-resellable ticket
            await cryptixTicket.connect(buyer).issueTicket(
                0, // eventId
                buyer.address,
                false, // isResellable
                basePrice, // maxResalePrice
                { value: basePrice }
            );
            
            const nonResellableTokenId = 1;
            
            await expect(
                cryptixTicket.connect(buyer).transferTicket(
                    nonResellableTokenId,
                    addrs[0].address,
                    resalePrice,
                    { value: resalePrice }
                )
            ).to.be.revertedWith("Ticket is not resellable");
        });

        it("Should fail if price exceeds maximum allowed", async function () {
            const excessivePrice = basePrice.mul(3);
            
            await expect(
                cryptixTicket.connect(buyer).transferTicket(
                    tokenId,
                    addrs[0].address,
                    excessivePrice,
                    { value: excessivePrice }
                )
            ).to.be.revertedWith("Price exceeds maximum allowed");
        });
    });

    describe("Ticket Validation", function () {
        let tokenId;

        beforeEach(async function () {
            // Create event and issue ticket
            await cryptixTicket.connect(organizer).createEvent(
                "Test Festival",
                Math.floor(Date.now() / 1000) + 86400,
                ethers.utils.parseEther("0.1"),
                100
            );
            
            await cryptixTicket.connect(buyer).issueTicket(
                0,
                buyer.address,
                true,
                ethers.utils.parseEther("0.2"),
                { value: ethers.utils.parseEther("0.1") }
            );
            
            tokenId = 0;
        });

        it("Should validate valid tickets", async function () {
            expect(await cryptixTicket.isTicketValid(tokenId)).to.be.true;
        });

        it("Should invalidate blacklisted tickets", async function () {
            await cryptixTicket.connect(owner).blacklistTicket(tokenId);
            expect(await cryptixTicket.isTicketValid(tokenId)).to.be.false;
        });

        it("Should allow organizer to blacklist tickets", async function () {
            await cryptixTicket.connect(organizer).blacklistTicket(tokenId);
            expect(await cryptixTicket.isTicketValid(tokenId)).to.be.false;
        });

        it("Should not allow unauthorized blacklisting", async function () {
            await expect(
                cryptixTicket.connect(addrs[0]).blacklistTicket(tokenId)
            ).to.be.revertedWith("Not authorized");
        });
    });
});
