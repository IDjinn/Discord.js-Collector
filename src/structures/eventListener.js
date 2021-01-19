const {Client} = require('discord.js');

module.exports = class EventListener {
    constructor(type) {
        /** 
         * This event type/name
         * @type {string}
         */
        this.type = type;
    }

    /**
     * Bind this event listener with discord client
     * @param {Client} client 
     */
    bind(client) {
        this.client = client;
        this.on(type, execute);
    }

    /**
     * Discord gateway event trigger
     * @param  {...any} args 
     */
    execute(...args) {
        // Just for typing...
    }
}