const SmartTestament = artifacts.require('SmartTestament');
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken');
const { Oracle } = require('@chainlink/contracts/truffle/v0.6/Oracle');

module.exports = async (deployer, network, [defaultAccount]) => {
  // Local (development) networks need their own deployment of the LINK
  // token and the Oracle contract
  if (!network.startsWith('kovan')) {
    LinkToken.setProvider(deployer.provider);
    Oracle.setProvider(deployer.provider);
    try {
      await deployer.deploy(LinkToken, { from: defaultAccount });
      await deployer.deploy(Oracle, LinkToken.address, {
        from: defaultAccount,
      });
      const smartTestament = await deployer.deploy(
        SmartTestament,
        LinkToken.address
      );
      await smartTestament.setOracleParams(
        Oracle.address,
        web3.utils.toHex('818de5fad1514b3cb5f356c8200e265d'),
        web3.utils.toWei('0.1', 'ether')
      );
    } catch (err) {
      console.error(err);
    }
  } else {
    // For kovan networks, use the 0 address to allow the ChainlinkRegistry
    // contract automatically retrieve the correct address for you
    await deployer.deploy(
      SmartTestament,
      '0x0000000000000000000000000000000000000000'
    );
  }
};
