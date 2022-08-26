import { expect } from "chai";
import { ethers } from "hardhat";

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage of Hardhat Network's snapshot functionality.
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const ENTRANCE_FEE = ethers.utils.parseEther("0.001");

describe("Trinity", function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const Trinity = await ethers.getContractFactory("Trinity");
    const [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Trinity.deploy() and await
    // its deployed() method, which happens onces its transaction has been
    // mined.
    const trinity = await Trinity.deploy(ENTRANCE_FEE);

    await trinity.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { Trinity, trinity, owner, addr1, addr2 };
  }

  describe("Entrance Fees", async function() {
    it("getEntranceFee should return correct entrance fee", async function () {
      const { trinity } = await loadFixture(deployTokenFixture);

      expect(await trinity.getEntranceFee()).to.equal(ENTRANCE_FEE);
      expect(await trinity.getEntranceFee()).to.not.equal(ENTRANCE_FEE.add(ENTRANCE_FEE));
    });
  });

  describe("isValidator", async function() {
    it("should return false for an invalid validator", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const validator = addr1.address;

      // First check a given address is a validator or not
      expect(await trinity.isValidator(validator)).to.equal(false);
    });

    it("should return true for an valid validator", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const validator = addr1.address;

      // Add a validator using the owner and test if it's correctly
      // returned as a validator
      const setValidatorTransaction = await trinity.addValidator(validator);
      await setValidatorTransaction.wait();

      expect(await trinity.isValidator(validator)).to.equal(true);
    });
  });
    
  describe("addValidator", async function() {
    it("should emit Validator events", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Ensure that events are emitted when we add a validator
      await expect(trinity.addValidator(addr1.address))
        .to.emit(trinity, "ValidatorAdded")
        .withArgs(addr1.address);
    });

    it("should be called only via deployer", async function () {
      const { trinity, addr1, addr2 } = await loadFixture(deployTokenFixture);

      // Try to add a validator using addr1 which is not the owner of the 
      // contract to test if onlyOwner works properly or not
      await expect(
        trinity.connect(addr1).addValidator(addr2.address)
      ).to.be.revertedWith("caller is not the owner");
    });
  });

  describe("isEmployer", async function() {
    it("should return false for an invalid employer", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const employer = addr1.address;

      // First check a given address is a validator or not
      expect(await trinity.isEmployer(employer)).to.equal(false);
    });

    it("isEmployer should return true for an valid employer", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const validator = addr1.address;

      // Run an enlistEmployeeTx and see if the employer gets added
      const enlistEmployeeTx = await trinity.connect(addr1).enlistEmployer({
        value: ENTRANCE_FEE,
      });
      await enlistEmployeeTx.wait();

      expect(await trinity.isEmployer(validator)).to.equal(true);
    });
  });

  describe("enlistEmployer", async function() {
    it("should enlist an Employee", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Enlist an employee with the minimum fees and check if transaction
      // works
      const enlistEmployeeTx = await trinity.connect(addr1).enlistEmployer({
        value: ENTRANCE_FEE,
      });
      await enlistEmployeeTx.wait();

      expect(await trinity.isEmployer(addr1.address)).to.equal(true);
    });

    it("should fail if ENTRANCE_FEE is not correct", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Ensure that events are emitted when someone enlists themselves as an employee
      await expect(trinity.connect(addr1).enlistEmployer({ value: 0 }))
        .to.be.revertedWith("Trinity__NotEnoughStakeSupplied");
    });

    it("should emit Employee events", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Ensure that events are emitted when someone enlists themselves as an employee
      await expect(trinity.connect(addr1).enlistEmployer({ value: ENTRANCE_FEE }))
        .to.emit(trinity, "EmployerEnlisted")
        .withArgs(addr1.address);
    });
  });

  describe("getEmployerStake", async function() {
    it("should return the correct staked amount", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const value = ENTRANCE_FEE.add(ENTRANCE_FEE);

      // First connect the contract to a new address
      const connectedTrinity = trinity.connect(addr1);

      // Stake an amount while enlisting and check if the amount is correct
      const enlistEmployeeTx = await connectedTrinity.enlistEmployer({
        value,
      });
      await enlistEmployeeTx.wait();

      // The same amount needs to be returned
      expect(await connectedTrinity.getEmployerStake(addr1.address)).to.equal(value);
    });
  });

  describe("issueSkillNFT", function() {
    it("should be called only via a validator", async function () {
      const { trinity, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const metadata = "https://opensea-creatures-api.herokuapp.com/api/creature/1" //Random metadata url

      // Try to add a validator using addr1 which is not the owner of the 
      // contract to test if onlyOwner works properly or not
      await expect(
        trinity.connect(addr1).issueSkillNFT(addr2.address, metadata)
      ).to.be.revertedWith("Trinity__InvalidValidator");
    });

    it("should the contract be able to mint an NFT", async function () {
      const { trinity, owner, addr1 } = await loadFixture(deployTokenFixture);

      const metadata = "https://opensea-creatures-api.herokuapp.com/api/creature/1" //Random metadata url

      // Add owner as a validator to issue skill NFTs
      const setValidatorTx = await trinity.addValidator(owner.address);
      await setValidatorTx.wait();

      // Issue a skill NFT to addr1
      const issueSkillNFTTx = await trinity.issueSkillNFT(addr1.address, metadata); // Minting the token
      const tx = await issueSkillNFTTx.wait() // Waiting for the token to be minted

      // Ensure that the transaction goes through
      expect(tx).to.not.be.null;

      if (!tx || !tx.events || !tx.events[0]) {
        return;
      }

      // Check if the token has the correct metadata
      const event = tx.events[0];
      const tokenId = event?.args?.[2]?.toNumber() ?? 0; // Getting the tokenID
      const tokenURI = await trinity.tokenURI(tokenId) // Using the tokenURI from ERC721 to retrieve de metadata
      expect(tokenURI).to.be.equal(metadata); // Comparing and testing
    });

    it("should the contract be able to mint an NFT and emit events", async function () {
      const { trinity, owner, addr1 } = await loadFixture(deployTokenFixture);

      const metadata = "https://opensea-creatures-api.herokuapp.com/api/creature/1" //Random metadata url

      // Add owner as a validator to issue skill NFTs
      const setValidatorTx = await trinity.addValidator(owner.address);
      await setValidatorTx.wait();

      // Issue a skill NFT to addr1
      await expect(trinity.issueSkillNFT(addr1.address, metadata))
        .to.emit(trinity, "SkillNFTIssued")
        .withArgs(addr1.address, owner.address, metadata);
    });
  });

  describe("killSwitch", async function() {
    it("should be called only via deployer", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Try to killSwitch using addr1 which is not the owner of the 
      // contract to test if onlyOwner works properly or not
      await expect(
        trinity.connect(addr1).killSwitch()
      ).to.be.revertedWith("caller is not the owner");
    });

    it("should flush the balances back to the owner", async function () {
      const { trinity, owner, addr1 } = await loadFixture(deployTokenFixture);
      const value = ENTRANCE_FEE.add(ENTRANCE_FEE);

      // cache the original owner balance
      const originalOwnerBalance = await owner.getBalance();

      // First connect the contract to a new address
      const connectedTrinity = trinity.connect(addr1);

      // Stake an amount while enlisting and check if the amount is correct
      const enlistEmployeeTx = await connectedTrinity.enlistEmployer({
        value,
      });
      await enlistEmployeeTx.wait();

      // Stake an amount while enlisting and check if the amount is correct
      const killSwitchTx = await trinity.killSwitch();
      await killSwitchTx.wait();

      // Ensure that the amount of balance the owner has post transaction
      // has increased
      const newOwnerBalance = await owner.getBalance();
      expect(newOwnerBalance.gt(originalOwnerBalance)).to.be.equal(true);
    });

    it("should reset all employers", async function () {
      const { trinity, owner, addr1 } = await loadFixture(deployTokenFixture);
      const value = ENTRANCE_FEE.add(ENTRANCE_FEE);

      // First connect the contract to a new address
      const connectedTrinity = trinity.connect(addr1);

      // Stake an amount while enlisting and check if the amount is correct
      const enlistEmployeeTx = await connectedTrinity.enlistEmployer({
        value,
      });
      await enlistEmployeeTx.wait();

      // Stake an amount while enlisting and check if the amount is correct
      const killSwitchTx = await trinity.killSwitch();
      await killSwitchTx.wait();

      // Employers no longer will be an employer post flush
      expect(await trinity.isEmployer(addr1.address)).to.equal(false);
    });
  });
});
