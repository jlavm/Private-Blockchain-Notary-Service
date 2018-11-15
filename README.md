# Private Blockchain Notary Service

This project implements a Star Registry service that allows users to claim ownership of their favorite star in the night sky.

## Node framework

The framework selected is Express.js

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

1. Node installed

### Installing

1. Clone this repo
2. cd command to project root folder
3. Install dependencies

```
npm install
```

## Running project

1. Run command

```
npm start
```

and now you can check the project running in the browser typing:

```
localhost:8000
```

## Endpoints

### GET: /block/[HEIGHT]

```
localhost:8000/block/0
```
```
curl "http://localhost:8000/block/0"
```

### GET: /stars/address:[ADDRESS]

```
localhost:8000/stars/address::142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ
```

```
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
```

### GET: /stars/hash:[HASH]

```
localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f
```

```
curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
```

### POST: /requestValidation

```
localhost:8000/requestValidation
```

With body:

```
{
  "address": "1JHoNc4exPSTgwduGPAjMkPYC7egxVehs8"
}
```

With curl:

```
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'
```

### POST: /message-signature/validate

```
localhost:8000//message-signature/validate
```

With body:

```
{
  "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
  "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
}
```

With curl:

```
curl -X POST \
  http://localhost:8000/api/message-signature/validate \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
    "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL", "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
}'
```

### POST: /block

```
localhost:8000/block
```

With body:

```
{
  "address": "1JHoNc4exPSTgwduGPAjMkPYC7egxVehtt",
  "star": {
    "dec": "30h",
    "ra": "30h 30m 30.0s",
    "story": "Found star using https://www.google.com/sky/",
    "constellation": "",
    "mag": ""
  }
}
```

With curl:

```
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}'
```