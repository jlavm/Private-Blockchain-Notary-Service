const express = require('express')
const Block = require('./block');
const Blockchain = require('./simpleChain');
const bodyParser = require('body-parser');
const path = require('path');

const app = express()
const blockchain = new Blockchain()

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // support encoded bodies

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.param('blockheight', function(req, res, next, blockheight) {
    // check if blockheight exists
    blockchain.getBlockHeight().then((height) => {
        if (blockheight >= height) {
            res.json({
                error: 'Invalid blockheight'
            })
        } else {
            next();
        }
    }).catch((err) => {
        res.json({
            error: err
        })
    });
});

app.get('/block/:blockheight', (req, res) => {
    blockchain.getBlock(req.params.blockheight).then((block) => {
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error Retrieving block #' + req.params.blockheight
        })
    });
})

app.post('/block', (req, res) => {
    var body = req.body.body
    console.log(body)
    if (body === undefined) {
        return res.json({
            error: 'You must specify a body'
        })
    } else if (body.trim() === '') {
        return res.json({
            error: 'Empty body'
        })
    }
    blockchain.addBlock(new Block(body)).then((block) => {
        res.json(block)
    }).catch((err) => {
        res.json({
            error: 'Error occurred while adding new block'
        })
    });
})

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8000, () => console.log('Example app listening on port 8000!'))