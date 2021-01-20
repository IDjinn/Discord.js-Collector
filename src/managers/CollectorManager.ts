import { Client, Constants } from "discord.js";
import BaseCollector from "../collectors/BaseCollector";
import MessageQuestionCollector from "../collectors/messages/MessageQuestionCollector";
import { CollectorTypes } from "../types/CollectorTypes";

export default class CollectorManager {
    private static instance = new CollectorManager();
    private client?: Client;
    private messagesCollectors = new Set<BaseCollector>();
    private reactionsCollectors = new Set<BaseCollector>();

    public init(client) {
        this.client = client;
        this.client.on(Constants.Events.MESSAGE_CREATE, message => this.onEvent(Constants.Events.MESSAGE_CREATE, message));
    
        setInterval(this.garbadgeCollector.bind(this), 500);
    }

    private async onEvent(event, ...args) {
        switch (event) {
            case Constants.Events.MESSAGE_CREATE:
                for (const collector of this.messagesCollectors) {
                    if (collector.isExpired()) continue;
                    if (collector.isNotMatch(args[0])) continue;

                    collector.collect(...args);
                }
                break;

        }
    }

    public setupMessageCollector(collector: BaseCollector) {
        if (collector.isExpired()) return;
        this.messagesCollectors.add(collector);
    }

    public setupReactionCollector(collector: BaseCollector) {
        if (collector.isExpired()) return;
        this.reactionsCollectors.add(collector);
    }

    private garbadgeCollector(){
        for (const collector of this.getCollectors()) {
            if(collector.isExpired()){
                this.messagesCollectors.delete(collector);
                this.reactionsCollectors.delete(collector);
            }
        }
    }

    private getCollectors(){
        return new Set(...[this.messagesCollectors, this.messagesCollectors]);
    }

    public static getInstance() {
        return this.instance;
    }

    public getClient(){
        return this.client;
    }
}