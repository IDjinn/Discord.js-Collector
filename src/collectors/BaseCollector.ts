import { Client, UserResolvable } from "discord.js";
import { CollectorTypes } from "../types/CollectorTypes";


export default abstract class BaseCollector{
    private client: Client;
    private expires: number;
    private collected = [];
    constructor(private options:CollectorTypes.IValidOptions){
        this.client = options.client;
        this.expires = Date.now() + options.time;
    }

    public collect(...args){
        return this.collected[args.length > 1 ? {...args} : args[0]];
    }

    public isNotMatch(userResolvable: UserResolvable){
        return this.options.users.every(user => user.id !== this.client.users.resolveID(userResolvable));
    }

    public isExpired(){
        return this.collected.length >= this.options.max || Date.now() > this.expires;
    }
}