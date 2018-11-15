const encodeStory = value => {
    return Buffer.from(value, 'ascii').toString('hex')
}

const decodeStory = value => {
    return new Buffer(value, 'hex').toString()
}

module.exports = {
    encodeStory,
    decodeStory
}