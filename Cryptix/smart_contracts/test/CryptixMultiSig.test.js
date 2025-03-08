const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CryptixMultiSig", function () {
    let CryptixMultiSig;
    let multiSig;
    let owner1;
    let owner2;
    let owner3;
    let nonOwner;
    let owners;
    let requiredConfirmations;

    beforeEach(async function () {
        [owner1, owner2, owner3, nonOwner] = await ethers.getSigners();
        owners = [owner1.address, owner2.address, owner3.address];
        requiredConfirmations = 2;

        CryptixMultiSig = await ethers.getContractFactory("CryptixMultiSig");
        multiSig = await CryptixMultiSig.deploy(owners, requiredConfirmations);
        await multiSig.deployed();

        // Send some ETH to the multisig
        await owner1.sendTransaction({
            to: multiSig.address,
            value: ethers.utils.parseEther("1.0")
        });
    });

    describe("Deployment", function () {
        it("Should set the correct owners", async function () {
            const contractOwners = await multiSig.getOwners();
            expect(contractOwners).to.have.members(owners);
        });

        it("Should set the correct number of required confirmations", async function () {
            expect(await multiSig.numConfirmationsRequired()).to.equal(requiredConfirmations);
        });

        it("Should fail if deployed with invalid parameters", async function () {
            await expect(
                CryptixMultiSig.deploy([], 1)
            ).to.be.revertedWith("Owners required");

            await expect(
                CryptixMultiSig.deploy([owner1.address], 2)
            ).to.be.revertedWith("Invalid number of required confirmations");

            await expect(
                CryptixMultiSig.deploy([owner1.address, owner1.address], 1)
            ).to.be.revertedWith("Owner not unique");

            await expect(
                CryptixMultiSig.deploy([owner1.address, ethers.constants.AddressZero], 1)
            ).to.be.revertedWith("Invalid owner");
        });
    });

    describe("Transaction Submission", function () {
        let to;
        let value;
        let data;

        beforeEach(async function () {
            to = nonOwner.address;
            value = ethers.utils.parseEther("0.1");
            data = "0x";
        });

        it("Should allow owner to submit transaction", async function () {
            await multiSig.connect(owner1).submitTransaction(to, value, data);
            
            const tx = await multiSig.getTransaction(0);
            expect(tx.to).to.equal(to);
            expect(tx.value).to.equal(value);
            expect(tx.data).to.equal(data);
            expect(tx.executed).to.be.false;
            expect(tx.numConfirmations).to.equal(0);
        });

        it("Should fail if non-owner tries to submit transaction", async function () {
            await expect(
                multiSig.connect(nonOwner).submitTransaction(to, value, data)
            ).to.be.revertedWith("Not an owner");
        });

        it("Should emit TransactionSubmitted event", async function () {
            await expect(multiSig.connect(owner1).submitTransaction(to, value, data))
                .to.emit(multiSig, "TransactionSubmitted")
                .withArgs(0, to, value, data);
        });
    });

    describe("Transaction Confirmation", function () {
        beforeEach(async function () {
            await multiSig.connect(owner1).submitTransaction(
                nonOwner.address,
                ethers.utils.parseEther("0.1"),
                "0x"
            );
        });

        it("Should allow owner to confirm transaction", async function () {
            await multiSig.connect(owner2).confirmTransaction(0);
            expect(await multiSig.isConfirmed(0, owner2.address)).to.be.true;
        });

        it("Should increment confirmation count", async function () {
            await multiSig.connect(owner2).confirmTransaction(0);
            const tx = await multiSig.getTransaction(0);
            expect(tx.numConfirmations).to.equal(1);
        });

        it("Should not allow double confirmation", async function () {
            await multiSig.connect(owner2).confirmTransaction(0);
            await expect(
                multiSig.connect(owner2).confirmTransaction(0)
            ).to.be.revertedWith("Transaction already confirmed");
        });

        it("Should fail if non-owner tries to confirm", async function () {
            await expect(
                multiSig.connect(nonOwner).confirmTransaction(0)
            ).to.be.revertedWith("Not an owner");
        });
    });

    describe("Transaction Execution", function () {
        beforeEach(async function () {
            await multiSig.connect(owner1).submitTransaction(
                nonOwner.address,
                ethers.utils.parseEther("0.1"),
                "0x"
            );
        });

        it("Should execute transaction after sufficient confirmations", async function () {
            await multiSig.connect(owner1).confirmTransaction(0);
            await multiSig.connect(owner2).confirmTransaction(0);

            const initialBalance = await nonOwner.getBalance();
            await multiSig.connect(owner1).executeTransaction(0);
            const finalBalance = await nonOwner.getBalance();

            expect(finalBalance.sub(initialBalance)).to.equal(ethers.utils.parseEther("0.1"));
        });

        it("Should fail if insufficient confirmations", async function () {
            await multiSig.connect(owner1).confirmTransaction(0);
            await expect(
                multiSig.connect(owner1).executeTransaction(0)
            ).to.be.revertedWith("Insufficient confirmations");
        });

        it("Should not execute transaction twice", async function () {
            await multiSig.connect(owner1).confirmTransaction(0);
            await multiSig.connect(owner2).confirmTransaction(0);
            await multiSig.connect(owner1).executeTransaction(0);

            await expect(
                multiSig.connect(owner1).executeTransaction(0)
            ).to.be.revertedWith("Transaction already executed");
        });
    });

    describe("Confirmation Revocation", function () {
        beforeEach(async function () {
            await multiSig.connect(owner1).submitTransaction(
                nonOwner.address,
                ethers.utils.parseEther("0.1"),
                "0x"
            );
            await multiSig.connect(owner1).confirmTransaction(0);
        });

        it("Should allow owner to revoke confirmation", async function () {
            await multiSig.connect(owner1).revokeConfirmation(0);
            expect(await multiSig.isConfirmed(0, owner1.address)).to.be.false;
        });

        it("Should decrement confirmation count", async function () {
            await multiSig.connect(owner1).revokeConfirmation(0);
            const tx = await multiSig.getTransaction(0);
            expect(tx.numConfirmations).to.equal(0);
        });

        it("Should fail if transaction already executed", async function () {
            await multiSig.connect(owner2).confirmTransaction(0);
            await multiSig.connect(owner1).executeTransaction(0);

            await expect(
                multiSig.connect(owner1).revokeConfirmation(0)
            ).to.be.revertedWith("Transaction already executed");
        });
    });

    describe("Owner Management", function () {
        it("Should add new owner", async function () {
            await multiSig.connect(owner1).addOwner(nonOwner.address);
            expect(await multiSig.isOwner(nonOwner.address)).to.be.true;
        });

        it("Should remove owner", async function () {
            await multiSig.connect(owner1).removeOwner(owner3.address);
            expect(await multiSig.isOwner(owner3.address)).to.be.false;
        });

        it("Should fail to remove owner if it would violate minimum confirmations", async function () {
            await expect(
                multiSig.connect(owner1).removeOwner(owner2.address)
            ).to.be.revertedWith("Cannot remove owner");
        });

        it("Should change required confirmations", async function () {
            await multiSig.connect(owner1).changeRequirement(3);
            expect(await multiSig.numConfirmationsRequired()).to.equal(3);
        });

        it("Should fail to change required confirmations to invalid value", async function () {
            await expect(
                multiSig.connect(owner1).changeRequirement(4)
            ).to.be.revertedWith("Invalid required number of owners");
        });
    });
});
