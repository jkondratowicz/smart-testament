const SmartTestament = artifacts.require('SmartTestament');
require('dotenv').config();
const username = process.env.TWITTER_USERNAME || 'toonczyk';
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

  if (!username) {
    console.log('No twitter username provided');
    return;
  }

  console.log('Getting data on Kovan:');
  console.log('    username = ' + username);

  const tx = await smartTestament.getDaysSinceLastTweet(username);

  callback(tx.tx);
};
