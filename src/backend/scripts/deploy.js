const { ethers, artifacts } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  const feePercent = parseInt(process.env.FEE_PERCENT || "0"); // Read the fee percentage from the environment variable

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories
  const NFT = await ethers.getContractFactory("NFT");
  const Marketplace = await ethers.getContractFactory("Marketplace");

  // Deploy contracts
  const nft = await NFT.deploy();
  const marketplace = await Marketplace.deploy(feePercent);

  await nft.deployed();
  await marketplace.deployed();

  console.log("NFT contract address:", nft.address);
  console.log("Marketplace contract address:", marketplace.address);

  saveFrontendFiles(nft, "NFT");
  saveFrontendFiles(marketplace, "Marketplace");
}

function saveFrontendFiles(contract, name) {
  const contractsDir = __dirname + "/../frontend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
