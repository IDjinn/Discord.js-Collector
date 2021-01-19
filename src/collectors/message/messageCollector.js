const MessageQuestionCollector = require("./question/messageQuestionCollector");
const { MessageCollectorOptions } = require('../../util/collectorOptions');
const BaseCollector = require("../../structures/baseCollector");

module.exports = class MessageCollector {
    /**
     * @param {MessageCollectorOptions} options 
     */
    static createQuestion(options) {
        return new MessageQuestionCollector(options);
    }

    static get Question() {
        return MessageQuestionCollector;
    }
}