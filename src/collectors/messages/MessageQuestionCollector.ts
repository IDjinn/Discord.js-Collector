import { Message } from "discord.js";
import { CollectorTypes } from "../../types/CollectorTypes";
import BaseCollector from "../BaseCollector";



export default class MessageQuestionCollector extends BaseCollector implements CollectorTypes.IMessageCollector{
    constructor(protected options: CollectorTypes.IMessageQuestionOptions){
        super(options);
    }
    onCollect(message: Message) {
        throw new Error("Method not implemented.");
    }
}