import { ChannelResolvable, Client, DMChannel, Guild, Message, TextChannel, User, UserResolvable } from "discord.js";
import BaseCollector from "../collectors/BaseCollector";


export module CollectorTypes{

    export interface IMessageCollector{
        onCollect(message: Message);
    }
    
    export interface IReactionCollector{
        onCollect(message: Message);
    }

    export interface IValidOptions {
        time: number;
        client: Client;
        channel: TextChannel | DMChannel;
        guild: Guild;
        users: User[];
        max: number;
        deleteBotMessage: boolean;
    }

    export interface IValidMessageQuestionOptions extends IValidOptions, IMessageCollector{
        deleteMessages: boolean;
    }

    export type IOptions = {
        time?: number;
        max?: number;
        deleteBotMessage?: boolean;
        channel: ChannelResolvable;
        users: UserResolvable[];
    }

    export interface IMessageQuestionOptions extends IMessageCollector, IOptions {
        deleteMessages?: boolean;
    }

}