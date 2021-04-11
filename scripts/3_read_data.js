const SmartTestament = artifacts.require('SmartTestament');
require('dotenv').config();
/*
  This script requests data
*/

module.exports = async (callback) => {
  const smartTestament = await SmartTestament.deployed();
  const networkType = await web3.eth.net.getNetworkType();

  if (networkType !== 'kovan') {
    console.log('Only works on Kovan network');
    return;
  }

  console.log('Reading data from Kovan');

  const data = await smartTestament.data.call();
  callback(data);
};
