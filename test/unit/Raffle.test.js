const {assert, expect} = require("chai");
const {network, deployments, ethers} = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");

async function prepareSelectWinner(raffle, raffleEntranceFee, interval) {
    await raffle.enterRaffle({value: raffleEntranceFee});
    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
    await network.provider.request({method: "evm_mine", params: []});

}

describe("Raffle Unit Tests", () => {
    let player, raffle, vrfCoordinatorV2Mock, raffleEntranceFee, interval, accounts,raffleContract;
    beforeEach(async () => {
        accounts = await ethers.getSigners()
        player = accounts[1];
        await deployments.fixture(["mocks", "raffle"]);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        raffleContract = await ethers.getContract("Raffle");
        raffle = raffleContract.connect(player);
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
    })
    describe("constructor", () => {
        it("initializes the raffle correctly", async () => {
            let raffleStatus = await raffle.getRaffleState()
            assert.equal(raffleStatus.toString(), "0")
            assert.equal(interval, networkConfig[network.config.chainId]["keepersUpdateInterval"])
        })
    })
    describe("enterRaffle", () => {
        it("reverts when you don't pay enough", async () => {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__SendMoreToEnterRaffle")
        })
        it("emits event on enter", async () => {
            await expect(raffle.enterRaffle({value: raffleEntranceFee})
            ).to.emit(raffle, "RaffleEnter").withArgs(player.address);
        })

        it("doesn't allow entrance when raffle is calculating", async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
            await raffle.performUpkeep([]);
            await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith(
                "Raffle__RaffleNotOpen");
        })
    })
    describe("checkUpkeep", () => {
        it("returns false if pepople haven't set any ETH", async () => {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.request({method: "evm_mine", params: []});
            let {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(upkeepNeeded, false);
        })
        it("returns false if raffle isn't open", async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
            await raffle.performUpkeep([]);
            let raffleStatus = await raffle.getRaffleState();
            let {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(raffleStatus.toString(), "1")
            assert.equal(upkeepNeeded, false);
        })
        it("returns false if enough time hasn't passed", async () => {
            await raffle.enterRaffle({value: raffleEntranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]);
            await network.provider.request({method: "evm_mine", params: []});
            let {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(upkeepNeeded, false);
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
            let {upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(upkeepNeeded, true);
        })
    })
    describe("performUpkeep", () => {
        it("can only run if checkupkeep is true", async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
            let trx = await raffle.performUpkeep([]);
            assert(trx);
        })
        it("reverts if checkup is false", async () => {
            await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded");
        })
        it("updates the raffle state and emits a requestId", async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
            let trxResponse = await raffle.performUpkeep([]);
            let trxReceipt = await trxResponse.wait();
            let raffleStatus = await raffle.getRaffleState();
            assert.equal(raffleStatus.toString(), "1");
            assert(trxReceipt.events[1].args.requestId > 0);

        })
    })
    describe("fulfillRandomWords", () => {
        beforeEach(async () => {
            await prepareSelectWinner(raffle, raffleEntranceFee, interval);
        })

        it("picks a winner, resets, and sends money", async () => {
            const additionalEntrances = 3
            const startingIndex = 2
            for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
                raffle = raffleContract.connect(accounts[i]);
                await raffle.enterRaffle({value: raffleEntranceFee});
            }
            const startingTimeStamp = await raffle.getLastTimeStamp();
            await new Promise(async (resolve, reject) => {
                 raffle.once("WinnerPicked", async () => {
                    try {
                        const endingTimeStamp = await raffle.getLastTimeStamp();
                        const recentWinner = await raffle.getRecentWinner();
                        const winnerBalance = await accounts[2].getBalance()
                        assert(endingTimeStamp > startingTimeStamp);
                        // 这里由于是mock，产生的winner始终是固定的
                        assert.equal(recentWinner.toString(),accounts[2].address);
                        assert.equal(winnerBalance.toString(),
                            startingBalance.add(
                                raffleEntranceFee.mul(additionalEntrances)
                                // 初始化时player往里面放入了资金一次,所以多了一次
                            ).add(raffleEntranceFee).toString())
                        resolve();
                    } catch (e) {
                        reject(e);
                    }

                });
                const tx = await raffle.performUpkeep([]);
                const txReceipt = await tx.wait(1);
                const startingBalance = await accounts[2].getBalance()
                await vrfCoordinatorV2Mock.fulfillRandomWords(
                    txReceipt.events[1].args.requestId,
                    raffle.address
                )
            })
        })
    })
})