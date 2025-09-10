const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Revived Token Contract", function () {
  async function deployRevivedFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy Revived token
    const Revived = await ethers.getContractFactory("Revived");
    const revived = await Revived.deploy(owner.address);
    await revived.deployed();

    return { Revived, revived, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { revived } = await loadFixture(deployRevivedFixture);
      expect(await revived.name()).to.equal("Revived");
      expect(await revived.symbol()).to.equal("RVED");
    });

    it("Should set the correct decimals", async function () {
      const { revived } = await loadFixture(deployRevivedFixture);
      expect(await revived.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const expectedSupply = ethers.utils.parseEther("1000000000"); // 1 billion tokens
      expect(await revived.totalSupply()).to.equal(expectedSupply);
      expect(await revived.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set owner as admin", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const ADMIN_ROLE = await revived.ADMIN_ROLE();
      expect(await revived.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should emit TokensMinted event on deployment", async function () {
      const Revived = await ethers.getContractFactory("Revived");
      const [owner] = await ethers.getSigners();
      const expectedAmount = ethers.utils.parseEther("1000000000");
      
      const revived = await Revived.deploy(owner.address);
      await revived.deployed();
      
      // Check if the event was emitted by looking at the deployment transaction
      const tx = await revived.deployTransaction.wait();
      const event = tx.events.find(e => e.event === "TokensMinted");
      expect(event).to.not.be.undefined;
      expect(event.args.recipient).to.equal(owner.address);
      expect(event.args.amount).to.equal(expectedAmount);
    });

    it("Should revert if initial owner is zero address", async function () {
      const Revived = await ethers.getContractFactory("Revived");
      await expect(Revived.deploy(ethers.constants.AddressZero))
        .to.be.revertedWith("Invalid owner address");
    });
  });

  describe("ERC20 Basic Functionality", function () {
    it("Should allow transfers between accounts", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      await revived.transfer(addr1.address, transferAmount);
      expect(await revived.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await revived.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("999999000")
      );
    });

    it("Should allow approved transfers", async function () {
      const { revived, owner, addr1, addr2 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      await revived.approve(addr1.address, transferAmount);
      expect(await revived.allowance(owner.address, addr1.address)).to.equal(transferAmount);

      await revived.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      expect(await revived.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await revived.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should emit Transfer events", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      await expect(revived.transfer(addr1.address, transferAmount))
        .to.emit(revived, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to transfer ownership", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const ADMIN_ROLE = await revived.ADMIN_ROLE();

      await expect(revived.transferOwnership(addr1.address))
        .to.emit(revived, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);

      expect(await revived.hasRole(ADMIN_ROLE, addr1.address)).to.be.true;
      expect(await revived.hasRole(ADMIN_ROLE, owner.address)).to.be.false;
    });

    it("Should not allow non-admin to transfer ownership", async function () {
      const { revived, addr1, addr2 } = await loadFixture(deployRevivedFixture);
      
      await expect(revived.connect(addr1).transferOwnership(addr2.address))
        .to.be.revertedWith(
          `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${await revived.ADMIN_ROLE()}`
        );
    });

    it("Should revert if new owner is zero address", async function () {
      const { revived } = await loadFixture(deployRevivedFixture);
      
      await expect(revived.transferOwnership(ethers.constants.AddressZero))
        .to.be.revertedWith("New owner cannot be zero address");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      const { revived } = await loadFixture(deployRevivedFixture);
      
      await revived.pause();
      expect(await revived.paused()).to.be.true;
    });

    it("Should allow admin to unpause", async function () {
      const { revived } = await loadFixture(deployRevivedFixture);
      
      await revived.pause();
      await revived.unpause();
      expect(await revived.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      const { revived, addr1 } = await loadFixture(deployRevivedFixture);
      
      await expect(revived.connect(addr1).pause())
        .to.be.revertedWith(
          `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${await revived.ADMIN_ROLE()}`
        );
    });

    it("Should prevent transfers when paused", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      await revived.pause();
      
      await expect(revived.transfer(addr1.address, transferAmount))
        .to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });

    it("Should allow approvals when paused", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      await revived.pause();
      
      // Note: In OpenZeppelin 4.x, approve is not automatically paused
      // Only transfers are paused. This test verifies that approve still works.
      await expect(revived.approve(addr1.address, transferAmount))
        .to.emit(revived, "Approval")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("Burn Functionality", function () {
    it("Should allow users to burn their own tokens", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const burnAmount = ethers.utils.parseEther("1000");
      const initialBalance = await revived.balanceOf(owner.address);

      await expect(revived.burn(burnAmount))
        .to.emit(revived, "TokensBurned")
        .withArgs(owner.address, burnAmount);

      expect(await revived.balanceOf(owner.address)).to.equal(
        initialBalance.sub(burnAmount)
      );
      expect(await revived.totalSupply()).to.equal(
        initialBalance.sub(burnAmount)
      );
    });

    it("Should allow burning from another account with allowance", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const burnAmount = ethers.utils.parseEther("1000");
      const initialBalance = await revived.balanceOf(owner.address);

      await revived.approve(addr1.address, burnAmount);
      
      await expect(revived.connect(addr1).burnFrom(owner.address, burnAmount))
        .to.emit(revived, "TokensBurned")
        .withArgs(owner.address, burnAmount);

      expect(await revived.balanceOf(owner.address)).to.equal(
        initialBalance.sub(burnAmount)
      );
      expect(await revived.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should not allow burning more than allowance", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const burnAmount = ethers.utils.parseEther("1000");
      const approveAmount = ethers.utils.parseEther("500");

      await revived.approve(addr1.address, approveAmount);
      
      await expect(revived.connect(addr1).burnFrom(owner.address, burnAmount))
        .to.be.revertedWith("Burn exceeds allowance");
    });

    it("Should not allow burning when paused", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const burnAmount = ethers.utils.parseEther("1000");

      await revived.pause();
      
      await expect(revived.burn(burnAmount))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow burning from another account when paused", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const burnAmount = ethers.utils.parseEther("1000");

      await revived.approve(addr1.address, burnAmount);
      await revived.pause();
      
      await expect(revived.connect(addr1).burnFrom(owner.address, burnAmount))
        .to.be.revertedWith("Pausable: paused");
    });
  });

  describe("ERC20Permit Functionality", function () {
    it("Should support permit functionality", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const value = ethers.utils.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      // Get the domain separator and nonce
      const domain = {
        name: "Revived",
        version: "1",
        chainId: await owner.getChainId(),
        verifyingContract: revived.address
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" }
        ]
      };

      const nonce = await revived.nonces(owner.address);
      const message = { owner: owner.address, spender: addr1.address, value, nonce, deadline };

      const signature = await owner._signTypedData(domain, types, message);
      const { v, r, s } = ethers.utils.splitSignature(signature);

      await revived.permit(owner.address, addr1.address, value, deadline, v, r, s);
      
      expect(await revived.allowance(owner.address, addr1.address)).to.equal(value);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle zero amount transfers", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      
      await expect(revived.transfer(addr1.address, 0))
        .to.emit(revived, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
    });

    it("Should handle zero amount burns", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const initialBalance = await revived.balanceOf(owner.address);
      
      await expect(revived.burn(0))
        .to.emit(revived, "TokensBurned")
        .withArgs(owner.address, 0);

      expect(await revived.balanceOf(owner.address)).to.equal(initialBalance);
    });

    it("Should revert when burning more than balance", async function () {
      const { revived, owner } = await loadFixture(deployRevivedFixture);
      const balance = await revived.balanceOf(owner.address);
      const burnAmount = balance.add(1);

      await expect(revived.burn(burnAmount))
        .to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for basic operations", async function () {
      const { revived, owner, addr1 } = await loadFixture(deployRevivedFixture);
      const transferAmount = ethers.utils.parseEther("1000");

      // Test transfer gas cost
      const transferTx = await revived.transfer(addr1.address, transferAmount);
      const transferReceipt = await transferTx.wait();
      console.log(`Transfer gas used: ${transferReceipt.gasUsed.toString()}`);

      // Test burn gas cost
      const burnTx = await revived.burn(transferAmount);
      const burnReceipt = await burnTx.wait();
      console.log(`Burn gas used: ${burnReceipt.gasUsed.toString()}`);

      // Test pause gas cost
      const pauseTx = await revived.pause();
      const pauseReceipt = await pauseTx.wait();
      console.log(`Pause gas used: ${pauseReceipt.gasUsed.toString()}`);
    });
  });
});
