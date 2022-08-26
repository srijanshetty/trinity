// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

// Import 3P libraries here
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Using errors is cheaper than storing strings
error Trinity__NotEnoughStakeSupplied();
error Trinity__InvalidEmployer();
error Trinity__InvalidValidator();
error Trinity__FlushFailed();

contract Trinity is Ownable, ERC721URIStorage {
    // State for fees, validators and employers
    uint256 private immutable i_entranceFee;

    address payable[] private s_employers;
    mapping(address => uint256) private s_employersStake;

    address payable[] private s_validators;
    mapping(address => uint8) private s_validatorsList;

    // Counters used for SkillNFTs
    using Counters for Counters.Counter;
    Counters.Counter private s_skillNFTIds;

    // Off-chain events
    event ValidatorAdded(address payable indexed validator);
    event EmployerEnlisted(address indexed employer);
    event SkillNFTIssued(
        address indexed candidate,
        address indexed validator,
        string indexed skill
    );

    constructor(uint256 _entranceFee) ERC721("Trinity NFT", "TRINITY") {
        i_entranceFee = _entranceFee;
    }

    // Get the entrance fee for the contract which will used by employers
    // to fetch cnadidates
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    // Check if a given address is a validator or not
    function isValidator(address _validator) public view returns (bool) {
        return s_validatorsList[_validator] != 0;
    }

    // Only the owner can add a validator who is then given the ability to issue skills
    function addValidator(address _validator) public onlyOwner {
        s_validators.push(payable(_validator));

        // This is used to check validators
        s_validatorsList[_validator] = 1;

        // Emit an event for the new validator
        emit ValidatorAdded(payable(_validator));
    }

    // Check if a given address is an employer or not
    function isEmployer(address _employer) public view returns (bool) {
        return s_employersStake[_employer] != 0;
    }

    // Return the amount staked by an employer, only a valid employer can call this function
    function getEmployerStake(address _employer) public view returns (uint256) {
        if (!isEmployer(_employer)) {
            revert Trinity__InvalidEmployer();
        }

        return s_employersStake[_employer];
    }

    // This is the staking function called by employers to stake entranceFee in
    // order for them to be able to find a candidate to be hired
    function enlistEmployer() public payable {
        // revert if the amount sent is lesser than the entrance fee
        if (msg.value < i_entranceFee) {
            revert Trinity__NotEnoughStakeSupplied();
        }

        // Keep track of all employers and also keep track of their state
        if (isEmployer(msg.sender)) {
            // Update the stake and don't readd to employers list
            s_employersStake[msg.sender] += msg.value;
        } else {
            // when called the first time, track the employers
            // in an array
            s_employers.push(payable(msg.sender));
            s_employersStake[msg.sender] = msg.value;
        }

        // Emit the event for off-chain consumption
        emit EmployerEnlisted(msg.sender);
    }

    // TODO: Limit validators to only certain skills and not all skills
    // TODO: The issued NFT should have the details of the validator
    function issueSkillNFT(address _candidate, string memory _skill) public {
        // Ensure that only a valid validator can call this
        if (!isValidator(msg.sender)) {
            revert Trinity__InvalidValidator();
        }

        // Increment the internal counter for tokens
        s_skillNFTIds.increment();
        uint256 newItemId = s_skillNFTIds.current();

        // Mint token, update the URI and return tokenId
        _safeMint(_candidate, newItemId);
        _setTokenURI(newItemId, _skill);

        // Offchain events to indicate that a token has been issued
        emit SkillNFTIssued(_candidate, msg.sender, _skill);
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
}
