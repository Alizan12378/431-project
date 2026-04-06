// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DonationTransparency {
    struct Donation {
        address donor;
        uint256 amount;
        string purpose;
        uint256 timestamp;
    }

    Donation[] public donations;

    event DonationMade(address indexed donor, uint256 amount, string purpose, uint256 timestamp);

    function donate(string memory _purpose) public payable {
        require(msg.value > 0, "Donation must be greater than 0");

        donations.push(Donation({
            donor: msg.sender,
            amount: msg.value,
            purpose: _purpose,
            timestamp: block.timestamp
        }));

        emit DonationMade(msg.sender, msg.value, _purpose, block.timestamp);
    }

    function getDonationCount() public view returns (uint256) {
        return donations.length;
    }

    function getDonation(uint256 _index) public view returns (address, uint256, string memory, uint256) {
        require(_index < donations.length, "Invalid index");
        Donation memory d = donations[_index];
        return (d.donor, d.amount, d.purpose, d.timestamp);
    }
}