const {network} = require("hardhat")
const {verfiy} = require("../utils/verify")
const {developmentChains, networkConfig, VERIFICATION_BLOCK_CONFIRMATIONS} = require("../helper-hardhat-config")

const FUND_AMOUNT = ethers.utils.parseEther("1") // 1 Ether, or 1e18 (10^18) Wei
module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId
    const waitBlockConfirmations = developmentChains.includes(network.name) ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS
    let vrfCoordinatorV2Address, subscriptionId;
    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait();
        subscriptionId = transactionReceipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]['vrfCoordinatorV2'];
        subscriptionId = networkConfig[chainId]['subscriptionId'];
    }
    args = [vrfCoordinatorV2Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["keepersUpdateInterval"],
        networkConfig[chainId]["raffleEntranceFee"],
        networkConfig[chainId]["callbackGasLimit"],
    ]
    const raffle = deploy("Raffle", {
        from: deployer,
        args: args,
        waitConfirmations: waitBlockConfirmations,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verfiy(raffle.address, args)
    }
    log("lottery deployed!")
    log("----------------------------------------------------")
}
module.exports.tags = ["all", "raffle"]