// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

// Import this file to use console.log
import "hardhat/console.sol";

// Import 3P libraries here
import "@openzeppelin/contracts/access/Ownable.sol";

// Using errors is cheaper than storing strings
error Trinity__NotEnoughEnoughSupplied();
error Trinity__InvalidValidator();


contract Trinity is Ownable {
    // Out of Scope:
    // - We assume a validator can verify for any skill
    // - Use SBT instead of NFT
    // - Have a governance vote to add validator

    // Contract work:
    // - Employers pay to enlist to the contract by paying 0.01 ETH
    // - Validators are added by the owner of the contract
    // - Issue NFT for each skill a candidate has by the validator
    // - Candidates are hidden from the public
    // - Payout on end of interview called

    // FE:
    // - Candidate information and indexing
    //   - Skills submission portal
    //   - Use magic for login for candidates?
    // - Validator login
    //   - Ability to get candidates and schedule interview
    //   - Track process
    // - Employee login
    //   - Ability to get candidates and schedule interview
    //   - Track process
    // BE:
    // - Module for tracking interviews
    // - Module for indexing candidates
    // - Module to call endInterview

    // State
    uint256 private immutable i_entranceFee;

    address payable[] private s_employers;
    mapping(address => uint256) private s_employersStake;

    address payable[] private s_validators;
    mapping(address => uint8) private s_validatorsList;
    mapping(address => uint256) private s_validatorsStake;

    // Off-chain events
    event NewValidator(address payable validator);
    event NewEmployer(address employer);
    event SkillCertificateIssued(address candidate, string skill, address validator);


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
        // Off-chain, Update count of candidates in consideration and ensure it's only 1 per 0.01 ETH

        // Keep track of all employers and also keep track of their state
        s_employers.push(payable(msg.sender));
        s_employersStake[payable(msg.sender)] += msg.value;

        // Emit the event for off-chain consumption
        emit NewEmployer(msg.sender);
    }

    function isValidator(address _validator) public view returns (bool) {
        return s_validatorsList[_validator] != 0;
    }

    function addValidator(address validator) public onlyOwner {
        // Track all the validators
        s_validators.push(payable(validator));

        // This is used to check validators
        s_validatorsStake[msg.sender] = 1;

        // TODO: Issue NFT to validators?

        // Emit an event for the new validator
        emit NewValidator(payable(validator));
    }

    // TODO: Limit validators to only certain skills and not all skills
    function issueSkillCertificate(address candidate, string memory skill) public {
        // Ensure that only a valid validator can call this
        if (!isValidator(msg.sender)) {
            revert Trinity__InvalidValidator();
        }

        // FIXME: Issue NFT to candidate
        // NFT will have details of the validator as well.

        // Offchain events
        emit SkillCertificateIssued(candidate, skill, msg.sender);
    }

    // FIXME: Write this function
    function endInterview() public onlyOwner view {
    }
}
