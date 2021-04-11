const { prompt } = require('enquirer');
const SmartTestament = artifacts.require('SmartTestament');
require('dotenv').config();
let username = process.env.TWITTER_USERNAME;
/*
  This script requests data
*/

module.exports = async (callback) => {
  const smartTestament = await SmartTestament.deployed();
  const networkType = await web3.eth.net.getNetworkType();

  if (networkType !== 'kovan') {
    callback('Only works on Kovan network');
    return;
  }

  if (!username) {
    console.log('No twitter username provided in env var.');
    const answer = await prompt({
      type: 'input',
      name: 'username',
      message: 'Type in twitter username to check?'
    });
    if (!answer.username || answer.username.length < 3) {
      callback('At least 3 characters required');
      return;
    }
    username = answer.username;
  }

  console.log('Getting data on Kovan:');
  console.log('    username = ' + username);

  const result = await smartTestament.getDaysSinceLastTweet(username);

  callback(result.toString());
};
