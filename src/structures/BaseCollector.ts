import { MessageReaction } from "discord.js";
import { PartialUser } from "discord.js";
import { Channel, ChannelResolvable, Client, DMChannel, Message, TextChannel, User, UserResolvable } from "discord.js";
import init, { CollectorManager } from "../CollectorManager";
import { Constants } from "../others/Constants";

export abstract class BaseCollector<T extends IValidOptions> {
    protected expiresAt: number;
    protected client: Client;
    protected channel: TextChannel | DMChannel;
    protected collected = 0;
    protected max:number;
    protected options: T;
    constructor(optionsToCheck: IOptions) {
        if (!optionsToCheck) throw new Error(Constants.Errors.GENERIC_MISSING_OPTIONS);

        const channel = optionsToCheck.channel instanceof Channel ? optionsToCheck.channel : optionsToCheck.client instanceof Client ? optionsToCheck.client.channels.resolve(optionsToCheck.channel) : null;
        if(!channel) throw new Error(Constants.Errors.INVALID_CHANNEL_OPTION(optionsToCheck.channel));

        const client = optionsToCheck.client instanceof Client ? optionsToCheck.client : channel.client;
        const users = optionsToCheck.users?.map(x => client.users.resolve(x)).filter(x =>x) as User[];
        if(!users || !users.length) throw new Error(Constants.Errors.INVALID_USERS_OPTION(optionsToCheck.users));

        const validOptions = {
            time: Number(optionsToCheck.time),
            max: Number(optionsToCheck.max),
            client,
            users,
            channel: channel as TextChannel | DMChannel,
        };

        if (isNaN(Number(validOptions.time))) {
            validOptions.time = 30_000;
        }

        if (isNaN(Number(validOptions.max)) || validOptions.max <= 0 || validOptions.max > Number.POSITIVE_INFINITY) {
            validOptions.max = 1;
        }

        if (!validOptions.channel || 
            (!(validOptions.channel instanceof TextChannel)
            && !(validOptions.channel instanceof DMChannel)))
            throw new Error(Constants.Errors.INVALID_CHANNEL_OPTION(validOptions.channel));

        if (!validOptions.users
            || !validOptions.users.length
            || validOptions.users.filter(x => !(x instanceof User)).length)
            throw new Error(Constants.Errors.INVALID_USERS_OPTION(validOptions.users));

        this.options = validOptions as T;
        this.client = this.options.client;
        this.channel = this.options.channel;
        this.max = this.options.max;
        this.expiresAt = Date.now() + this.options.time;

        CollectorManager.init(this.client);
    }

    public async isMach(userToResolve: UserResolvable){
        const user = this.client.users.resolve(userToResolve);
        if(!user) return false;

        if(user.partial) await user.fetch();
        return this.options.users.some(x => x.id == user.id);
    }

    public afterCollect(){
        this.collected++;
    }
    
    public isCollecting(){
        return this.expiresAt > Date.now() &&  this.max > this.collected;
    }

    public isExpired(){
        return this.isCollecting()==false;
    }

    public dispose(){
        this.expiresAt = -1;
    }
}

export interface IValidOptions {
    max: number;
    time: number;
    users: User[];
    channel: TextChannel | DMChannel;
    client: Client;
}

export interface IOptions {
    time?: number;
    max?: number;
    client?: Client;
    channel: ChannelResolvable;
    users: UserResolvable[];
}

export interface IMessageCollector{
    //@ts-ignore
    onCollect(message: Message);
}

export interface IReactionCollector{
    onCollect(messageReaction: MessageReaction, user: User | PartialUser):void ;
}

export type ICollector = IReactionCollector | IMessageCollector;