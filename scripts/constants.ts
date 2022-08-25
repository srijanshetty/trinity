import { ethers } from 'hardhat';

type networkConfigType = {
  [key: string]: {
    ethFee: string;
    contract: string;
  };
};

const NETWORK_CONFIG: networkConfigType = {
  "42": {
    ethFee: "0.01",
    contract: String(process.env.KOVAN_CONTRACT),
  },
};

export default NETWORK_CONFIG;
