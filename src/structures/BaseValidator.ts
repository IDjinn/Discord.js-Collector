import { Channel, ChannelResolvable, Client, User, UserResolvable } from "discord.js";
import CollectorManager from "../managers/CollectorManager";
import { CollectorTypes } from "../types/CollectorTypes";
import CheckIf from "../util/Check";


export default class BaseValidator {
    protected client: Client;
    protected max: number;
    protected deleteBotMessage: boolean;
    protected channel: Channel;
    protected users: User[];
    constructor(protected options: CollectorTypes.IOptions) {
        this.client = this.resolveClient();

        if (!this.client) throw `i cant find bot Client, please init collector with that or give a valid Channel or User in options`;

    }

    protected resolve() {
        if (CheckIf.isNumberInRange(this.options.max, 0)) this.max = this.options.max;
        if (CheckIf.isBool(this.options.deleteBotMessage)) this.deleteBotMessage = this.options.deleteBotMessage;
       const channel = this.client.channels.resolve(this.options.channel);
       if(!channel) throw ''
       if(['voice', 'category', 'group', ''].includes(channel.type))
       
        for (let index = 0; index < array.length; index++) {
            const element = array[index];
            
        }
    }

    private resolveClient() {
        let client = CollectorManager.getInstance().getClient();
        if (client) return client;

        if (this.options.channel instanceof Channel) return this.options.channel.client;
        for (let i = 0; i < this.options.users.length; i++) {
            const user = this.options.users[i];
            if (user instanceof User) return user.client;
        }

        return null;
    }
}