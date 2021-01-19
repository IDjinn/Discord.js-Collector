const CollectorValidator = require('../../structures/collectorValidator');
const { Client } = require('discord.js');


module.exports = class MessageCollectorValidator extends CollectorValidator {
    /**
     * @param {MessageCollectorOptions} options 
     */
    constructor(options) {
        super(options);
    }
}