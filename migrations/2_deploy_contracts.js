const DonationTransparency = artifacts.require("DonationTransparency");

module.exports = function (deployer) {
  deployer.deploy(DonationTransparency);
};
