# Chainlink External Adapter for Smart Testament

Based on https://github.com/thodges-gh/CL-EA-NodeJS-Template.git

See README in parent directory for more information.

External adapter returns **number of days** since given user's last activity in social media.

This is just a proof of concept using Twitter API.


## Input Params

- `username`: Twitter screen name

## Output

```json
{
 "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
 "data": {
  "tweet": {
    "created_at": "Thu Mar 11 10:07:27 +0000 2021",
    "id": 1369953106395555555,
    "id_str": "1369953106395555555",
    "text": "Last tweet's text",
//  (...),
    "user": {
//    (...)
    }
  },
  "result": 45
 },
 "statusCode": 200
}
```

## Required environment vars
Set variables using `export ...` or via `.env` file in `/twitter_adapter` directory of the repository.
- `EA_PORT`: service will listen on this TCP port, defaults to 8080
- `TWITTER_BEARER_TOKEN`: Twitter API token used for authentication. TODO: replace with app keys, get individual OAuth tokens for each dapp user

## Install Locally

Install dependencies:

```bash
npm install
```

### Test

Run the local tests:

```bash
npm test
```

Natively run the application (defaults to port 8080):

### Run

```bash
npm start
```

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "username": "jack" } }'
```
