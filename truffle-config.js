module.exports = {
  networks: {
    anvil: {
      host: "127.0.0.1",     // 本地 Anvil 節點
      port: 8545,            // Anvil 預設 port
      network_id: "*"        // 匹配任何 network id
    }
  },
  compilers: {
    solc: {
      version: "0.8.20"      // 或你需要的版本
    }
  }
};
