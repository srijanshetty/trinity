type networkConfigType = {
  [key: string]: {
    fee: string;
    contract: string;
  };
};

const NETWORK_CONFIG: networkConfigType = {
  "42": {
    fee: "0.01",
    contract: String(process.env.KOVAN_CONTRACT),
  },
  "31337": {
    fee: "0.01",
    contract: String(process.env.LOCAL_CONTRACT),
  },
  "80001": {
    fee: "0.01",
    contract: String(process.env.MUMBAI_CONTRACT),
  },
  "137": {
    fee: "0.01",
    contract: String(process.env.POLYGON_MAINNET_CONTRACT),
  }
};

export default NETWORK_CONFIG;
