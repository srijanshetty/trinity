import { expect } from "chai";
import { ethers } from "hardhat";

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage of Hardhat Network's snapshot functionality.
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

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
    const trinity = await Trinity.deploy(10);

    await trinity.deployed();

    // Fixtures can return anything you consider useful for your tests
    return { Trinity, trinity, owner, addr1, addr2 };
  }

  describe("Entrance Fees", async function() {
    it("getEntranceFee should return correct entrance fee", async function () {
      const { trinity } = await loadFixture(deployTokenFixture);

      expect(await trinity.getEntranceFee()).to.equal(10);
      expect(await trinity.getEntranceFee()).to.not.equal(12);
    });
  });

  describe("Validators", async function() {
    it("isValidator should return false for an invalid validator", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const validator = addr1.address;

      // First check a given address is a validator or not
      expect(await trinity.isValidator(validator)).to.equal(false);
    });

    it("isValidator should return true for an valid validator", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);
      const validator = addr1.address;

      // Add a validator using the owner and test if it's correctly
      // returned as a validator
      const setValidatorTransaction = await trinity.addValidator(validator);
      await setValidatorTransaction.wait();

      expect(await trinity.isValidator(validator)).to.equal(true);
    });

    
    it("addValidator should emit Validator events", async function () {
      const { trinity, addr1 } = await loadFixture(deployTokenFixture);

      // Ensure that events are emitted when we add a validator
      await expect(trinity.addValidator(addr1.address))
        .to.emit(trinity, "ValidatorAdded")
        .withArgs(addr1.address);
    });

    it("only deployer should be able to add validators", async function () {
      const { trinity, addr1, addr2 } = await loadFixture(deployTokenFixture);

      // Try to add a validator using addr1 which is not the owner of the 
      // contract to test if onlyOwner works properly or not
      await expect(
        trinity.connect(addr1).addValidator(addr2.address)
      ).to.be.revertedWith("caller is not the owner");
    });
  });
});
