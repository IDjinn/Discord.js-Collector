const { Constants, Collection, Message } = require("discord.js");
const BaseCollector = require("../structures/baseCollector");
const EventListener = require('../structures/eventListener');

module.exports = class MessageListener extends EventListener {
    constructor() {
        super(Constants.Events.MESSAGE_CREATE);
        /**
         * @type {Collection<number, BaseCollector>}
         */
        this.collectors = new Collection();
    }

    /**
     * @param {Message} message 
     */
    execute(message) {
        for (let i = 0; i < this.collectors.size; i++) {
            const collector = this.collectors.get(i);
            if (!collector.isCollecting()) continue;

            if (collector.match(message.client, message))
                collector.onCollect(message);
        }
    }

    /**
     * @param {BaseCollector} collector - collector to register
     * 
     * @return {number} - index of collector in list
     */
    register(collector) {
        if(!collector.isReady()) throw 'init before start collect';

        const index = this.collectors.size;
        this.collectors.set(index, collector);
        return index;
    }

    /**
     * @param {number} index - index to unRegister
     * 
     * @return {BaseCollector?} - index of collector in list
     */
    unRegister(index) {
        const collector = this.collectors.get(index);
        this.collectors.delete(index);
        return collector;
    }
}