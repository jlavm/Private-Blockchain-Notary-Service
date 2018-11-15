const express = require('express')
const Block = require('./block');
const Blockchain = require('./simpleChain');
const bodyParser = require('body-parser');
const path = require('path');
const Star = require('./star');
const {
    encodeStory,
    decodeStory
} = require('./encoder');
const bitcoinMessage = require('bitcoinjs-message');

const app = express()
const blockchain = new Blockchain()
const mempool = {}

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})


app.get('/block/chain', (req, res) => {
    blockchain.getBlockChain().then((block) => {
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error Retrieving chain'
        })
    });
})

app.get('/block/:blockheight', (req, res) => {
    blockchain.getBlock(req.params.blockheight).then((block) => {
        block.body.star.storyDecoded = decodeStory(block.body.star.story)
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error Retrieving block #' + req.params.blockheight
        })
    });
})

app.get('/stars/hash::hash', (req, res) => {
    var hashRequested = req.params.hash;
    blockchain.getBlockChain().then((chain) => {
        var chainFiltered = chain.filter(block => block.hash === hashRequested);
        if (chainFiltered.length > 0) {
            chainFiltered[0].body.star.storyDecoded = decodeStory(chainFiltered[0].body.star.story);
            res.json(chainFiltered[0]);
        } else {
            return res.json({
                error: 'Unable to find a registered star with hash:' + hashRequested
            })
        }
    }).catch((err) => {
        res.json({
            error: 'Error Retrieving BlockChain'
        })
    });
})

app.get('/stars/address::address', (req, res) => {
    var addressRequested = req.params.address;
    blockchain.getBlockChain().then((chain) => {
        var chainFiltered = chain.filter(block => block.body.address === addressRequested);
        if (chainFiltered.length > 0) {
            chainFiltered.map(s => {
                s.body.star.storyDecoded = decodeStory(s.body.star.story)
                return s
            })
            res.json(chainFiltered);
        } else {
            return res.json({
                error: 'Unable to find a registered star with address:' + addressRequested
            })
        }
    }).catch((err) => {
        res.json({
            error: 'Error Retrieving BlockChain'
        })
    });
})

app.post('/block', (req, res) => {
    var addressRequested = req.body.address;
    var starRequested = req.body.star;

    if (addressRequested === undefined || addressRequested.trim() === '') {
        return res.send(`Argument address not valid!`)
    }

    if(!mempool.hasOwnProperty(addressRequested)){
        return res.json({ error: 'Address not registered!' })
    }

    if(!mempool[addressRequested].valid){
        return res.json({ error: 'Address has not validated!' })
    }

    var startFieldsError = "Invalid fields: ";
    var startError = false;

    if (starRequested.dec === undefined || starRequested.dec.trim() === '') {
        startFieldsError = startFieldsError + 'declination, ';
        startError = true;
    }
    if (starRequested.ra === undefined || starRequested.ra.trim() === '') {
        startFieldsError = startFieldsError + 'right ascension, ';
        startError = true;
    }
    if (starRequested.story === undefined || starRequested.story.trim() === '') {
        startFieldsError = startFieldsError + 'story, ';
        startError = true;
    }

    if (startError == true) {
        return res.json({
            error: startFieldsError
        })
    }

    if (Buffer.byteLength(starRequested.story, 'ascii') > 500) {
        return res.json({ error: 'Story length not valid!' })
    }

    starRequested.story = encodeStory(starRequested.story);
    var body = new Star(addressRequested, starRequested);

    blockchain.addBlock(new Block(body)).then((block) => {
        delete mempool[addressRequested]
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error occurred while adding new block'
        })
    });
})

app.post('/requestValidation', (req, res) => {
    const addressRequested = req.body.address;

    if (addressRequested === undefined || addressRequested.trim() === '') {
        return res.send(`Argument address not valid!`)
    }

    const requestTimeStamp = new Date().getTime();
    const message = `${addressRequested}:${requestTimeStamp}:starRegistry`;
    var validationTimeWindow = 300;
    var response = {
        address: addressRequested,
        message: message,
        validationTimeWindow: validationTimeWindow,
        requestTimeStamp: requestTimeStamp
    }

    if (mempool.hasOwnProperty(addressRequested)) {
        var validationMemPoolTimeWindow = mempool[addressRequested].validationTimeWindow;
        var messageMemPool = mempool[addressRequested].message;
        var requestTimeStampMemPool = mempool[addressRequested].requestTimeStamp;
        return res.json({
            address: addressRequested,
            message: messageMemPool,
            validationTimeWindow: validationMemPoolTimeWindow,
            requestTimeStamp: requestTimeStampMemPool
        })
    }

    //add to the registry
    mempool[addressRequested] = {
        message,
        requestTimeStamp,
        validationTimeWindow,
        valid: false
    }

    res.json(response)

    const interval = setInterval(() => {
        mempool[addressRequested] && mempool[addressRequested].validationTimeWindow--
        if (!mempool.hasOwnProperty(addressRequested) || mempool[addressRequested].validationTimeWindow <= 0) {
            delete mempool[addressRequested]
            clearInterval(interval)
        }
    }, 1000)
})

app.post('/message-signature/validate', (req, res) => {
    const addressRequested = req.body.address;
    const signatureRequested = req.body.signature;
    let signatureVerified;

    if (addressRequested === undefined || addressRequested.trim() === '' || signatureRequested === undefined || signatureRequested.trim() === '') {
        return res.send(`Parameters not valid!`);
    }

    if (!mempool.hasOwnProperty(addressRequested)) {
        return res.send(`Address not valid. Please be sure to make first a request validation with this address!`);
    }

    if (mempool[addressRequested].validationTimeWindow > 0) {
        var validationMemPoolTimeWindow = mempool[addressRequested].validationTimeWindow;
        var messageMemPool = mempool[addressRequested].message;
        var requestTimeStampMemPool = mempool[addressRequested].requestTimeStamp;

        signatureVerified = bitcoinMessage.verify(messageMemPool, addressRequested, signatureRequested);

        if (signatureVerified === true) {
            mempool[addressRequested].valid = true;
        }
        return res.json({
            registerStar: signatureVerified,
            status: {
                address: addressRequested,
                message: messageMemPool,
                validationWindow: validationMemPoolTimeWindow,
                requestTimeStamp: requestTimeStampMemPool,
                messageSignature: signatureVerified ? 'valid' : 'invalid'
            }
        })
    } else {
        return res.send(`timed out reached!`);
    }
})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.all('*', function(req, res) {
    res.redirect("/");
});

app.listen(8000, () => console.log('Example app listening on port 8000!'))