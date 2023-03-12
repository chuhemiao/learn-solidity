require('@nomicfoundation/hardhat-toolbox');

// hard test
const ALCHEMY_API_KEY = 'J5W27rAU5wD4O0CUuQS880Jc-wyIIGY0';

//注意:永远不要把真正的以太放入测试帐户
const GOERLI_PRIVATE_KEY = 'op key';

module.exports = {
  solidity: '0.8.18', // solidity的编译版本
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};
