const {network} = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config")

const BASE_FEE = `${25 * 1e16}` // 0.25 link
const GAS_PRICE_LINK = 1e9; // 0.000000001 link
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    if (developmentChains.includes(network.name)) {
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]
        })
        log("Mocks Deployed!")
        log("----------------------------------------------------------")
    }

}
module.exports.tags = ["all", "mocks"]