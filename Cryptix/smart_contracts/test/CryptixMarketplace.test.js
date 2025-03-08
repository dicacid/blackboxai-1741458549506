const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CryptixMarketplace", function () {
    let CryptixTicket;
    let CryptixMarketplace;
    let MockCRXToken;
    let ticket;
    let marketplace;
    let crxToken;
    let owner;
    let seller;
    let buyer;
    let addrs;

    const LISTING_PRICE = ethers.utils.parseEther("0.1");
    const TICKET_PRICE = ethers.utils.parseEther("0.1");
    const MINIMUM_STAKE = ethers.utils.parseEther("1000");

    beforeEach(async function () {
        // Get the ContractFactory and Signers
        CryptixTicket = await ethers.getContractFactory("CryptixTicket");
        CryptixMarketplace = await ethers.getContractFactory("CryptixMarketplace");
        
        // Deploy mock CRX token for testing
        const MockCRXToken = await ethers.getContractFactory("MockERC20");
        [owner, seller, buyer, ...addrs] = await ethers.getSigners();

        // Deploy contracts
        crxToken = await MockCRXToken.deploy("CRX Token", "CRX", ethers.utils.parseEther("1000000"));
        ticket = await CryptixTicket.deploy();
        marketplace = await CryptixMarketplace.deploy(ticket.address, crxToken.address);

        await crxToken.deployed();
        await ticket.deployed();
        await marketplace.deployed();

        // Mint some CRX tokens for testing
        await crxToken.mint(buyer.address, ethers.utils.parseEther("2000"));
        await crxToken.mint(seller.address, ethers.utils.parseEther("2000"));

        // Create an event and issue a ticket for testing
        await ticket.connect(owner).createEvent(
            "Test Festival",
            Math.floor(Date.now() / 1000) + 86400,
            TICKET_PRICE,
            100
        );

        await ticket.connect(seller).issueTicket(
            0, // eventId
            seller.address,
            true, // isResellable
            TICKET_PRICE.mul(2), // maxResalePrice
            { value: TICKET_PRICE }
        );

        // Approve marketplace to handle tickets and tokens
        await ticket.connect(seller).setApprovalForAll(marketplace.address, true);
        await crxToken.connect(buyer).approve(marketplace.address, ethers.constants.MaxUint256);
    });

    describe("Deployment", function () {
        it("Should set the correct ticket contract address", async function () {
            expect(await marketplace.ticketContract()).to.equal(ticket.address);
        });

        it("Should set the correct CRX token address", async function () {
            expect(await marketplace.crxToken()).to.equal(crxToken.address);
        });
    });

    describe("Listing Management", function () {
        it("Should create a listing successfully", async function () {
            await marketplace.connect(seller).listTicket(0, LISTING_PRICE);
            
            const listing = await marketplace.getListingDetails(0);
            expect(listing.seller).to.equal(seller.address);
            expect(listing.price).to.equal(LISTING_PRICE);
            expect(listing.active).to.be.true;
        });

        it("Should fail if lister is not ticket owner", async function () {
            await expect(
                marketplace.connect(buyer).listTicket(0, LISTING_PRICE)
            ).to.be.revertedWith("Not ticket owner");
        });

        it("Should fail if price exceeds maximum allowed", async function () {
            await expect(
                marketplace.connect(seller).listTicket(0, TICKET_PRICE.mul(3))
            ).to.be.revertedWith("Price exceeds maximum allowed");
        });

        it("Should allow cancelling a listing", async function () {
            await marketplace.connect(seller).listTicket(0, LISTING_PRICE);
            await marketplace.connect(seller).cancelListing(0);
            
            const listing = await marketplace.getListingDetails(0);
            expect(listing.active).to.be.false;
        });
    });

    describe("Ticket Purchase", function () {
        beforeEach(async function () {
            await marketplace.connect(seller).listTicket(0, LISTING_PRICE);
        });

        it("Should complete purchase successfully", async function () {
            await marketplace.connect(buyer).purchaseTicket(0);
            
            expect(await ticket.ownerOf(0)).to.equal(buyer.address);
            
            const listing = await marketplace.getListingDetails(0);
            expect(listing.active).to.be.false;
        });

        it("Should transfer correct amounts of CRX tokens", async function () {
            const initialSellerBalance = await crxToken.balanceOf(seller.address);
            const initialBuyerBalance = await crxToken.balanceOf(buyer.address);
            const platformFee = LISTING_PRICE.mul(100).div(10000); // 1%
            
            await marketplace.connect(buyer).purchaseTicket(0);
            
            expect(await crxToken.balanceOf(seller.address))
                .to.equal(initialSellerBalance.add(LISTING_PRICE.sub(platformFee)));
            expect(await crxToken.balanceOf(buyer.address))
                .to.equal(initialBuyerBalance.sub(LISTING_PRICE));
        });

        it("Should fail if listing is not active", async function () {
            await marketplace.connect(seller).cancelListing(0);
            await expect(
                marketplace.connect(buyer).purchaseTicket(0)
            ).to.be.revertedWith("Ticket not listed for sale");
        });

        it("Should fail if buyer has insufficient CRX balance", async function () {
            await crxToken.connect(buyer).transfer(owner.address, await crxToken.balanceOf(buyer.address));
            await expect(
                marketplace.connect(buyer).purchaseTicket(0)
            ).to.be.revertedWith("Token transfer failed");
        });
    });

    describe("Staking", function () {
        const stakeAmount = MINIMUM_STAKE;

        it("Should allow staking CRX tokens", async function () {
            await marketplace.connect(buyer).stakeTokens(stakeAmount);
            expect(await marketplace.userStakes(buyer.address)).to.equal(stakeAmount);
        });

        it("Should grant premium access after staking minimum amount", async function () {
            await marketplace.connect(buyer).stakeTokens(stakeAmount);
            expect(await marketplace.hasPremiumAccess(buyer.address)).to.be.true;
        });

        it("Should allow withdrawing staked tokens", async function () {
            await marketplace.connect(buyer).stakeTokens(stakeAmount);
            await marketplace.connect(buyer).withdrawStake(stakeAmount);
            expect(await marketplace.userStakes(buyer.address)).to.equal(0);
        });

        it("Should fail if withdrawal amount exceeds staked amount", async function () {
            await marketplace.connect(buyer).stakeTokens(stakeAmount);
            await expect(
                marketplace.connect(buyer).withdrawStake(stakeAmount.mul(2))
            ).to.be.revertedWith("Insufficient stake");
        });
    });

    describe("Platform Fees", function () {
        it("Should allow owner to update platform fee", async function () {
            const newFee = 200; // 2%
            await marketplace.connect(owner).updatePlatformFee(newFee);
            expect(await marketplace.platformFee()).to.equal(newFee);
        });

        it("Should fail if non-owner tries to update platform fee", async function () {
            await expect(
                marketplace.connect(buyer).updatePlatformFee(200)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should fail if new fee is too high", async function () {
            await expect(
                marketplace.connect(owner).updatePlatformFee(1100) // 11%
            ).to.be.revertedWith("Fee too high");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to recover tokens", async function () {
            const amount = ethers.utils.parseEther("100");
            await crxToken.transfer(marketplace.address, amount);
            
            const initialBalance = await crxToken.balanceOf(owner.address);
            await marketplace.connect(owner).recoverTokens(crxToken.address, amount);
            
            expect(await crxToken.balanceOf(owner.address))
                .to.equal(initialBalance.add(amount));
        });

        it("Should not allow recovering staked tokens", async function () {
            await marketplace.connect(buyer).stakeTokens(MINIMUM_STAKE);
            await expect(
                marketplace.connect(owner).recoverTokens(crxToken.address, MINIMUM_STAKE)
            ).to.be.revertedWith("Cannot recover staked tokens");
        });
    });
});
