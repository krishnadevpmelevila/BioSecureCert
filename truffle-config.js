module.exports = {
  networks: {
    // Development network (Ganache)
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545,       // Standard Ethereum port (default: none)
      network_id: "*",  // Any network (default: none)
    },
    // Ropsten network (testnet)
    // ropsten: {
    //   provider: () => new HDWalletProvider(
    //     process.env.MNEMONIC,
    //     `http://127.0.0.1:7545${process.env.INFURA_API_KEY}`
    //   ),
    //   network_id: 3,       // Ropsten's id
    //   gas: 5500000,        // Ropsten has a lower block limit than mainnet
    //   confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
    //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
    //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    // },
    // Add other networks as needed
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {       // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        },
      }
    }
  }
};
