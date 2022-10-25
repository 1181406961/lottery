const {ethers} = require("hardhat")
const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        keepersUpdateInterval: "30", // 最小等待时间
        raffleEntranceFee: ethers.utils.parseEther("0.01"), // 最小入场费
        callbackGasLimit: "500000", // 获取随机数的回调函数 gas
    },
    5: {
        name: "goerli",
        subscriptionId: 5079,
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
        keepersUpdateInterval: "30", // 最小等待时间
        callbackGasLimit: "500000", // 获取随机数的回调函数 gas
        raffleEntranceFee: ethers.utils.parseEther("0.01"), // 最小入场费
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    }
}
const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6
module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS
}