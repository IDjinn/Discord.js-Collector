const MessageCollectorValidator = require('../messageCollectorValidator');
const { MessageCollectorOptions } = require('../../../util/collectorOptions');
const { Message } = require('discord.js');
const BaseCollector = require('../../../structures/baseCollector');

module.exports = class MessageQuestionCollector extends BaseCollector {
    /**
     * @param {MessageCollectorOptions} options 
     */
    constructor(options) {
        super(options, new MessageCollectorValidator(options));
    }
    
    /**
     * @param {Message} message 
     */
    async onCollect(message){
        return await this.options.onCollect(message);
    }
}