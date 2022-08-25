// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

// Import 3P libraries here
import "@openzeppelin/contracts/access/Ownable.sol";

// Using errors is cheaper than storing strings
error Trinity__NotEnoughStakeSupplied();
error Trinity__InvalidEmployer();
error Trinity__InvalidValidator();
error Trinity__FlushFailed();

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

    // Off-chain events
    event ValidatorAdded(address payable indexed validator);
    event EmployerEnlisted(address indexed employer);
    event SkillCertificateIssued(address indexed candidate, string indexed skill, address indexed validator);


    constructor(uint256 _entranceFee) {
        i_entranceFee = _entranceFee;
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function isValidator(address _validator) public view returns (bool) {
        return s_validatorsList[_validator] != 0;
    }

    function addValidator(address _validator) public onlyOwner {
        s_validators.push(payable(_validator));

        // This is used to check validators
        s_validatorsList[_validator] = 1;

        // TODO: Issue NFT to validators?

        // Emit an event for the new validator
        emit ValidatorAdded(payable(_validator));
    }

    // Check if a given address is an employer or not
    function isEmployer(address _employer) public view returns (bool) {
        return s_employersStake[_employer] != 0;
    }

    // Return the amount staked by an employer, only a valid employer
    // can call this function
    function getEmployerStake(address _employer) public view returns (uint256) {
        if (!isEmployer(_employer)) {
            revert Trinity__InvalidEmployer();
        }

        return s_employersStake[_employer];
    }

    function enlistEmployer() public payable {
        if (msg.value < i_entranceFee) {
            revert Trinity__NotEnoughStakeSupplied();
        }

        // TODO: Should we also keep track of candidates they have?
        // Off-chain, Update count of candidates in consideration and ensure it's only 1 per 0.01 ETH

        // Keep track of all employers and also keep track of their state
        s_employers.push(payable(msg.sender));
        s_employersStake[payable(msg.sender)] += msg.value;

        // Emit the event for off-chain consumption
        emit EmployerEnlisted(msg.sender);
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

    // TODO: The owner should be a multisign or a DAO which
    // controls all the funds
    // Transfer all the stake amount to the owner to be redistributed
    function killSwitch() onlyOwner public {
        address payable receiver = payable(owner());

        // Transfer all the staked amount in the contract to the
        // owner of the contract
        bool success = receiver.send(address(this).balance);
        if (!success) {
            revert Trinity__FlushFailed();
        }

        // Zero out all the stakes of the employers and remove
        // all employers from the list
        for (uint256 i = 0; i < s_employers.length; i++) {
            s_employersStake[s_employers[i]] = 0;
        }
        s_employers = new address payable[](0);
    }

    // FIXME: Write this function
    function endInterview() public onlyOwner view {
        // This function will just throw an error
        // It will be called by the validator when the interview is over
    }
}
