import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY!;
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying AgentDrop from:", wallet.address);
  
  const artifactPath = path.join(__dirname, "../artifacts/contracts/AgentDrop.sol/AgentDrop.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("AgentDrop deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});