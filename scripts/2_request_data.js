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
      message:
        'Type in twitter username to check. Leave empty to get all with deposits',
    });
    if (!answer.username || answer.username.length === 0) {
      console.log(
        'No username provided, will request for each username that had a corresponding deposit'
      );
    }
    username = answer.username;
  }

  let tx;
  console.log('requesting data on Kovan:');
  if (username) {
    console.log('    username = ' + username);
    tx = await smartTestament.requestDaysSinceLastTweetForUsername(username);
  } else {
    console.log('    all registered');
    tx = await smartTestament.requestDaysSinceLastTweet(username);
  }

  callback(tx.tx);
};
