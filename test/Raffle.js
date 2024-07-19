const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Raffle contract", function () {
  async function deployRaffleFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy MockVRFCoordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
    const mockVRFCoordinator = await MockVRFCoordinator.deploy();
    await mockVRFCoordinator.deployed();

    // Deploy Raffle with the address of the mock VRFCoordinator and a subscription ID
    const Raffle = await ethers.getContractFactory("Raffle");
    const raffle = await Raffle.deploy(mockVRFCoordinator.address, 1, 5); // Replace with actual subscription ID
    await raffle.deployed();

    return { Raffle, raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
        const { raffle, owner } = await loadFixture(deployRaffleFixture);
        expect(await raffle.owner()).to.equal(owner.address);
    });
  });

  describe("Participants Management", function () {
    it("Should add participants", async function () {
        const { raffle, owner, addr1, addr2 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address]);
        const participants1 = await raffle.participants(0);
        const participants2 = await raffle.participants(1);

        expect(participants1).to.include(addr1.address);
        expect(participants2).to.include(addr2.address);
    });

    it("Should emit ParticipantsAdded event", async function () {
        const { raffle, owner, addr1, addr2 } = await loadFixture(deployRaffleFixture);

        await expect(raffle.addParticipants([addr1.address, addr2.address]))
            .to.emit(raffle, "ParticipantsAdded")
            .withArgs([addr1.address, addr2.address]);
    });

    it("Should not add empty participants list", async function () {
        const { raffle } = await loadFixture(deployRaffleFixture);

        await expect(raffle.addParticipants([])).to.be.revertedWith("Participants list cannot be empty");
    });
  });

  describe("Randomness Request", function () {
    it("Should request a random number", async function () {
        const { raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address, addr3.address]);
        await raffle.setNumWinners(2); // Set the number of winners to 2
        await expect(raffle.requestRandomNumber()).to.emit(raffle, "RandomnessRequested");

        const requestId = await raffle.requestId();
        expect(requestId).to.not.equal(0);
    });
  });

  describe("Winner Selection", function () {
    it("Should select winners", async function () {
        const { raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address, addr3.address]);
        await raffle.setNumWinners(2);
        await raffle.requestRandomNumber();

        // Mock fulfillRandomWords function
        await mockVRFCoordinator.fulfillRandomWords(await raffle.requestId(), [123456]);

        await raffle.selectWinners();

        const winners = await raffle.getWinners();
        expect(winners.length).to.equal(2);
    });

    it("Should emit WinnersSelected event", async function () {
        const { raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address, addr3.address]);
        await raffle.setNumWinners(2);
        await raffle.requestRandomNumber();

        // Mock fulfillRandomWords function
        await mockVRFCoordinator.fulfillRandomWords(await raffle.requestId(), [123456]);

        await expect(raffle.selectWinners())
            .to.emit(raffle, "WinnersSelected");
    });

    it("Should revert if winners already selected", async function () {
        const { raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address, addr3.address]);
        await raffle.setNumWinners(2);
        await raffle.requestRandomNumber();

        // Mock fulfillRandomWords function
        await mockVRFCoordinator.fulfillRandomWords(await raffle.requestId(), [123456]);

        await raffle.selectWinners();
        await expect(raffle.selectWinners()).to.be.revertedWith("Winners already selected");
    });

    it("Should revert if random word not defined", async function () {
        const { raffle } = await loadFixture(deployRaffleFixture);

        await expect(raffle.selectWinners()).to.be.revertedWith("Random Word not defined");
    });

    it("Should revert if not enough participants", async function () {
        const { raffle } = await loadFixture(deployRaffleFixture);

        await raffle.setNumWinners(3); // Set the number of winners to 3
        await expect(raffle.requestRandomNumber()).to.be.revertedWith("Not enough participants");
    });

    it("Should not repeat winners", async function () {
        const { raffle, mockVRFCoordinator, owner, addr1, addr2, addr3 } = await loadFixture(deployRaffleFixture);

        await raffle.addParticipants([addr1.address, addr2.address, addr3.address, owner.address]);
        await raffle.setNumWinners(4);
        await raffle.requestRandomNumber();

        // Mock fulfillRandomWords function
        await mockVRFCoordinator.fulfillRandomWords(await raffle.requestId(), [123456]);

        await raffle.selectWinners();

        const winners = await raffle.getWinners();
        expect(winners.length).to.equal(4);

        for (let i = 0; i < winners.length; i++) {
            for (let j = i + 1; j < winners.length; j++) {
                expect(winners[i]).to.not.equal(winners[j]);
            }
        }
    });
  });
});
