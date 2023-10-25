// import

// main function

// calling of main function

// module.exports = async (hre) => {}  same as
const { ethers, network } = require("hardhat");
const { verify } = require("../utils/verify");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //   const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];

  //   if chainId is X use address Y
  // if chainId is Z use address A

  //   if the contact doesnt exist, we deploy a minimal version of
  // for our local testing

  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.target;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // well what happens when we want to change chains
  // when going for localhost or hardhat network we want to use a mock

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: false,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  console.log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
  log("----------------------------------------");
};

module.exports.tags = ["all", "fundme"];
