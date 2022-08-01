// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

// Import this file to use console.log
import "hardhat/console.sol";

// Import 3P libraries here
import "@openzeppelin/contracts/access/Ownable.sol";

// Using errors is cheaper than storing strings
error Trinity__NotEnoughEnoughSupplied();
error Trinity__InvalidVerifier();


contract Trinity is Ownable {
    // Employers pay to enlist to the contract by paying 0.01 ETH
    // Verifiers are added by the owner of the contract
    // Candidates are hidden from the public
    // Issue SBTs for each skill a candidate has by the verifier

    // Out of Scope:
    // - We assume a verifier can verify for any skill

    // TODO:
    // 1. How do we know a candidate is hired?
    // - Do we allow verifiers to track the candidates they have hired or off-chain?

    // State
    uint256 private immutable i_entranceFee;

    address payable[] private s_employers;
    mapping(address => uint256) private s_employersStake;

    address payable[] private s_verifiers;
    mapping(address => uint8) private s_verifiersList;

    // Off-chain events
    event NewVerifier(address payable verifier);
    event NewEmployer(address employer);
    event SkillCertificateIssued(address candidate, string skill, address verifier);


    constructor(uint256 _entranceFee) {
        i_entranceFee = _entranceFee;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function enlistEmployer() public payable {
        if (msg.value < i_entranceFee) {
            revert Trinity__NotEnoughEnoughSupplied();
        }

        // TODO: Should we also keep track of candidates they have?
        // Update count of candidates in consideration and ensure it's only 1 per 0.01 ETH

        // Keep track of all employers and also keep track of their state
        s_employers.push(payable(msg.sender));
        s_employersStake[payable(msg.sender)] += msg.value;

        // Emit the event for off-chain consumption
        emit NewEmployer(msg.sender);
    }

    function isVerifier(address _verifier) public view returns (bool) {
        return s_verifiersList[_verifier] != 0;
    }

    // Out of Scope:
    // We allow verifiers to verify for all skills
    function issueSkillCertificate(address candidate, string memory skill) public {
        // Ensure that only a valid verifier can call this
        if (!isVerifier(msg.sender)) {
            revert Trinity__InvalidVerifier();
        }

        // Issue SBT to candidate
        // SBT will have details of the verifier as well.

        // Offchain events
        emit SkillCertificateIssued(candidate, skill, msg.sender);
    }

    function addVerifier(address verifier) public onlyOwner {
        // Track all the verifiers
        s_verifiers.push(payable(verifier));

        // This is used to check verifiers
        s_verifiersList[msg.sender] = 1;

        // Emit an event for the new verifier
        emit NewVerifier(payable(verifier));
    }
}
