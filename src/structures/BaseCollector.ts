import { MessageReaction } from "discord.js";
import { PartialUser } from "discord.js";
import { Channel, ChannelResolvable, Client, DMChannel, Message, TextChannel, User, UserResolvable } from "discord.js";
import init, { CollectorManager } from "../CollectorManager";
import { Constants } from "../others/Constants";

export abstract class BaseCollector {
    protected expiresAt: number;
    protected client: Client;
    protected channel: TextChannel | DMChannel;
    protected collected = 0;
    protected max:number;
    constructor(public readonly basicOptions: IValidOptions) {
        if (!basicOptions) throw new Error(Constants.Errors.GENERIC_MISSING_OPTIONS);

        this.client = basicOptions.client;
        this.channel = basicOptions.channel;
        this.max = basicOptions.max;
        this.expiresAt = Date.now() + this.basicOptions.time;

        CollectorManager.init(this.client);
    }

    protected static validate(options: IOptions): IValidOptions {
        const channel = options.channel instanceof Channel ? options.channel : options.client instanceof Client ? options.client.channels.resolve(options.channel) : null;
        if(!channel) throw new Error(Constants.Errors.INVALID_CHANNEL_OPTION(options.channel));

        const client = options.client instanceof Client ? options.client : channel.client;
        const users = options.users?.map(x => client.users.resolve(x)).filter(x =>x) as User[];
        if(!users || !users.length) throw new Error(Constants.Errors.INVALID_USERS_OPTION(options.users));

        const validOptions: IValidOptions = {
            time: Number(options.time),
            max: Number(options.max),
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

        return validOptions;
    }

    public async isMach(userToResolve: UserResolvable){
        const user = this.client.users.resolve(userToResolve);
        if(!user) return false;

        if(user.partial) await user.fetch();
        return this.basicOptions.users.some(x => x.id == user.id);
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

export interface IMessageCollector extends BaseCollector{
    //@ts-ignore
    onCollect(message: Message);
}

export interface IReactionCollector extends BaseCollector{
    onCollect(messageReaction: MessageReaction, user: User | PartialUser):void ;
}

export type ICollector = IReactionCollector | IMessageCollector;