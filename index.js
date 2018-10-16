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
const starRegistry = {}

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
    var starAddress = req.body.address;
    var star = req.body.star;

    /*if(!starRegistry.hasOwnProperty(starAddress)){
        return res.json({ error: 'Address not valid.' })
    }*/

    var startFieldsError = "Invalid fields: ";
    var startError = false;

    if (star.dec === undefined || star.dec.trim() === '') {
        startFieldsError = startFieldsError + 'declination, ';
        startError = true;
    }
    if (star.ra === undefined || star.ra.trim() === '') {
        startFieldsError = startFieldsError + 'right ascension, ';
        startError = true;
    }
    if (star.story === undefined || star.story.trim() === '') {
        startFieldsError = startFieldsError + 'story, ';
        startError = true;
    }

    if (startError == true) {
        return res.json({
            error: startFieldsError
        })
    }

    star.story = encodeStory(star.story)
    var body = new Star(starAddress, star);

    blockchain.addBlock(new Block(body)).then((block) => {
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error occurred while adding new block'
        })
    });
})

app.post('/requestValidation', (req, res) => {
    var addressRequested = req.body.address;

    if (addressRequested === undefined || addressRequested.trim() === '') { 
        return res.send(`Address not valid!`)
    }
    var validationTimeWindow = 300;
    var requestTimeStamp = new Date().getTime();
    var message = `${addressRequested}:${requestTimeStamp}:starRegistry`;
    var response = { addressRequested, message, validationTimeWindow, requestTimeStamp: requestTimeStamp }

    if (starRegistry.hasOwnProperty(addressRequested)) {
        validationTimeWindow = starRegistry[addressRequested].validationTimeWindow;
        return res.json({ addressRequested, message, validationTimeWindow, requestTimeStamp: requestTimeStamp })
    }

    //add to the registry
    starRegistry[addressRequested] = { message, requestTimeStamp, validationTimeWindow }

    res.json(response)

    const interval = setInterval(() => {
        starRegistry[addressRequested] && starRegistry[addressRequested].validationTimeWindow--
        // check if starRegistry has star registeration request or not
        // if there is a registeration request
        // then check whether the validationWindow is timed out or not
        if (!starRegistry.hasOwnProperty(addressRequested) || starRegistry[addressRequested].validationTimeWindow <= 0) {
            delete starRegistry[addressRequested]
            clearInterval(interval)
        }
    }, 1000)
})

app.post('/message-signature/validate', (req, res) => {
    res.json({
        error: 'Not Implemented'
    })
})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.all('*', function(req, res) {
    res.redirect("/");
});

app.listen(8000, () => console.log('Example app listening on port 8000!'))