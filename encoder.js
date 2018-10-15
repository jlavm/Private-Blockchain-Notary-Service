const encodeStory = value => {
    return Buffer.from(value).slice(0, 500).toString('hex')
}

const decodeStory = value => {
    return new Buffer(value, 'hex').toString()
}

module.exports = {
    encodeStory,
    decodeStory
}