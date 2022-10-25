const {ethers} = require("hardhat")
const networkConfig = {
    default: {
        name: "hardhat",
    },
    31337: {
        name: "localhost",
        subscriptionId: "588", // 本地部署随便取一个名字
        gasLane: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        keepersUpdateInterval: "30", // 最小等待时间
        raffleEntranceFee: ethers.utils.parseEther("0.01"), // 最小入场费
        callbackGasLimit: "500000", // 获取随机数的回调函数
    }
}
const developmentChains = ["hardhat", "localhost"]
module.exports = {
    networkConfig,
    developmentChains,
}