const { Collection,Client } = require("discord.js")

module.exports = class CollectorManager {
    constructor(client) {
        /**
         * @type {Collection<string, object[]>}
         */
        __collectors = new Collection();
        /**
         * @type {Client}
         */
        this.client = client;

        client.on('message',message => {});
        client.on('messageReactionAdd',handleMessageEvent.bind(this));
    }
    
}