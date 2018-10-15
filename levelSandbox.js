/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Get count from levelDB
function getLevelDBDataCount() {
    return new Promise(function(resolve, reject) {
        let i = 0;
        db.createReadStream()
            .on('data', function() {
                i++;
            })
            .on('error', function() {
                reject("BlockHeight Could not retrieve chain length");
            })
            .on('close', function() {
                resolve(i);
            });
    });
}

// Get data from levelDB with key
function getLevelDBData(key) {
    return new Promise((resolve, reject) => {
        db.get(key, function(err, value) {
            if (err) {
                console.log('getLevelData Not found!', err);
                reject(err);
            };
            resolve(JSON.parse(value))
        })
    });
}

// Add data to levelDB with value
function addDataToLevelDB(height, newBlock) {
    return new Promise(function(resolve, reject) {
        let i = 0;
        db.createReadStream().on('data', function(data) {
            i++;
        }).on('error', function(err) {
            reject('Unable to read data stream!', err);
        }).on('close', function() {
            addLevelDBData(height, JSON.stringify(newBlock)).then((result) => {
                console.log("Block added");
                resolve(result)
            }).catch(error => {
                console.log("addBlock Error" + error);
                reject('Unable to addBlock!', error);
            });
        });
    });
}

// Add data to levelDB with key/value pair
function addLevelDBData(key, value) {
    return new Promise((resolve, reject) => {
        db.put(key, value, function(err) {
            if (err) {
                console.log('Block ' + key + ' submission failed', err);
                reject(err);
            };
            resolve(value);
        });
    });
}


module.exports = {
    getLevelDBDataCount,
    getLevelDBData,
    addDataToLevelDB,
    addLevelDBData
};