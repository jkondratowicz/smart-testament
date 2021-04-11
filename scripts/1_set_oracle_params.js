const SmartTestament = artifacts.require('SmartTestament');
require('dotenv').config();
const oracleAddress = process.env.ORACLE_ADDRESS;
const jobId = process.env.JOB_ID;
/*
  This script assigns the oracle data to the contract
*/

module.exports = async (callback) => {
  const smartTestament = await SmartTestament.deployed();
  const networkType = await web3.eth.net.getNetworkType();

  if (networkType !== 'kovan') {
    console.log('Only works on Kovan network');
    return;
  }

  console.log('Setting params on Kovan:');
  console.log('    oracleAddress = ' + oracleAddress);
  console.log('    jobId         = ' + jobId);

  const tx = await smartTestament.setOracleParams(
    oracleAddress,
    web3.utils.toHex(jobId)
  );

  callback(tx.tx);
};
