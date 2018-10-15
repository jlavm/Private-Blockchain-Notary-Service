/* ===== Block Class ==============================
|  Class with a constructor for block          |
|  ===============================================*/

class StarElement {
    constructor(decValue, raValue, storyValue, magValue, consValue) {
            this.dec = decValue,
            this.ra = raValue,
            this.story = storyValue,
            this.mag = magValue,
            this.cons = consValue
    }
}

module.exports = StarElement