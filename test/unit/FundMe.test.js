const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
describe("FundMe", function () {
  let fundme;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.parseEther("1");
  beforeEach(async function () {
    // deploy our fundme contract
    // using hardhat-deploy
    // const accounts = ethers.getSigners();
    // const accountOne = accounts[0];
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundme = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundme.getPriceFeed();
      console.log(response);
      //   console.log(mockV3Aggregator);
      //   console.log(mockV3Aggregator.target);
      assert.equal(response, mockV3Aggregator.target);
    });
  });

  describe("fund", async function () {
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundme.fund()).to.be.revertedWith(
        "You neet to spend more ETH"
      );
    });

    it("updated the amount funded data structure", async function () {
      await fundme.fund({ value: sendValue });
      const response = await fundme.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Adds funder to array of funders", async function () {
      await fundme.fund({ value: sendValue });
      const funder = await fundme.funders(0);
      assert.equal(funder, deployer);
    });
  });

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundme.fund({ value: sendValue });
    });

    it("withdraw eth from single funder", async function () {
      // arrange
      const startingFundMeBalance = await ethers.provider.getBalance(
        fundme.target
      );
      const startingDeployerBalance = await ethers.provider.getBalance(
        deployer
      );
      // Act
      const transactionResponse = await fundme.withdraw();
      const transactionReceipt = await transactionResponse.wait();
      //   console.log(transactionReceipt);
      const { gasUsed, gasPrice } = transactionReceipt;
      const gasCost = gasUsed * gasPrice;
      const endingFundMeBalance = await ethers.provider.getBalance(
        fundme.target
      );
      const endingdeployerBalance = await ethers.provider.getBalance(deployer);
      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance + startingFundMeBalance,
        endingdeployerBalance + gasCost
      );
    });
  });

  it("allows us to withdraw with multiple funders", async function () {
    // Arrange
    const accounts = await ethers.getSigners();
    for (let i = 1; i < 6; i++) {
      const fundMeConnectContract = await fundme.connect(accounts[i]);
      await fundMeConnectContract.fund({ value: sendValue });
    }
    const startingFundMeBalance = await ethers.provider.getBalance(
      fundme.target
    );
    const startingDeployerBalance = await ethers.provider.getBalance(deployer);
    // Act
    const transactionResponse = await fundme.withdraw();
    const transactionReceipt = await transactionResponse.wait();
    const { gasUsed, gasPrice } = transactionReceipt;
    const gasCost = gasUsed * gasPrice;

    // Assert
    const endingFundMeBalance = await ethers.provider.getBalance(fundme.target);
    const endingdeployerBalance = await ethers.provider.getBalance(deployer);
    // Assert
    assert.equal(endingFundMeBalance, 0);
    assert.equal(
      startingDeployerBalance + startingFundMeBalance,
      endingdeployerBalance + gasCost
    );

    // Make sure that the funders are reset properly
    await expect(fundme.funders(0)).to.be.reverted;

    for (let i = 1; i < 6; i++) {
      assert.equal(await fundme.addressToAmountFunded(accounts[i].address), 0);
    }
  });

  it("Only allows the owner to withdraw", async function () {
    const accounts = await ethers.getSigners();
    const attacker = accounts[1];
    const attackerConnectedContract = await fundme.connect(attacker);
    await expect(attackerConnectedContract.withdraw()).to.be.reverted;
  });
});
