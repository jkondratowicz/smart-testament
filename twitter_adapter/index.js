const moment = require('moment');

require('dotenv').config();
const { Requester, Validator } = require('@chainlink/external-adapter');

const customParams = {
  username: ['username'],
};

const createRequest = (input, callback) => {
  const validator = new Validator(input, customParams);
  const jobRunID = validator.validated.id;
  const username = validator.validated.data.username;
  const url = `https://api.twitter.com/1.1/statuses/user_timeline.json?include_rts=1&count=1&screen_name=${username}`;

  const config = {
    method: 'GET',
    url,
    headers: {
      Authorization: 'Bearer ' + process.env.TWITTER_BEARER_TOKEN,
    },
  };

  Requester.request(config)
    .then((response) => {
      if (!Array.isArray(response.data) || response.data.length === 0) {
        response.data = {
          result: 100 * 365,
        };
      } else {
        const tweet = response.data[0];
        response.data = {
          tweet,
          result: moment().diff(moment(new Date(tweet['created_at'])), 'days'),
        };
      }
      callback(response.status, Requester.success(jobRunID, response));
    })
    .catch((error) => {
      callback(500, Requester.errored(jobRunID, error));
    });
};

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
