import { Client, Message, MessageReaction, PartialUser, Structures, User, Util } from "discord.js";
import { BaseCollector, ICollector, IMessageCollector, IReactionCollector } from "./structures/BaseCollector";
import 'tslib';

/**
 * The Collector Manager
 */
export class CollectorManager {
    /**
     * Init collector manager
     * @param client - discord client
     */
    public static init(client: Client) {
        return new CollectorManager(client);
    }
    /**
     * Array with all message collectors runing
     */
    public readonly messageCollectors: IMessageCollector[] = [];
    /**
     * Array with all reactions collectors runing
     */
    public readonly reactionsCollectors: IReactionCollector[] = [];
    /**
     * Start collector manager with discord client
     * @param client - Discord.js client
     */
    constructor(public readonly client: Client) {
        // lazy loading into client object
        this.client.collectorManager = this;

        this.client.on('message', msg => this.onMessage(msg));
        this.client.on('messageReactionAdd', (msgReaction, user) => this.onReaction(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.onReaction(msgReaction, user));
    }

    private onMessage(message: Message) {
        return new Promise(async () => {
            for (let i = 0; i < this.messageCollectors.length; i++) {
                const collector = this.messageCollectors[i];
                if (collector.isExpired()) continue;

                if (await collector.isMach(message)) collector.onCollect(message);
            }
        });
    }

    private onReaction(msgReaction: MessageReaction, user: User | PartialUser) {
        return new Promise(async () => {
            for (let i = 0; i < this.reactionsCollectors.length; i++) {
                const collector = this.reactionsCollectors[i];
                if (collector.isExpired()) continue;

                if (await collector.isMach(user.id)) collector.onCollect(msgReaction, user);
            }
        });
    }

    public addMessageCollector(collector: IMessageCollector) {
        this.messageCollectors.push(collector);
        setTimeout(collector.dispose, collector.basicOptions.time);
    }

    public removeMessageCollector(collector: IMessageCollector) {
        const index = this.messageCollectors.indexOf(collector);
        if (index >= 0)
            this.messageCollectors.splice(index, 1);
    }

    public addReactionCollector(collector: IReactionCollector) {
        this.reactionsCollectors.push(collector);
        setTimeout(collector.dispose, collector.basicOptions.time);
    }

    public removeReactionCollector(collector: IReactionCollector) {
        const index = this.reactionsCollectors.indexOf(collector);
        if (index >= 0)
            this.reactionsCollectors.splice(index, 1);
    }
}


declare module "discord.js" {
    export interface Client {
        collectorManager: CollectorManager;
    }
}

export default CollectorManager.init;