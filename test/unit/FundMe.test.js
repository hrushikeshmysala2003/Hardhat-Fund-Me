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
});
