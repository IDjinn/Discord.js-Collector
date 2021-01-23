import { IOptions } from "../../structures/BaseCollector";
import MessageQuestionCollector, { IMessageQuestionOptions } from "./question/MessageQuestionCollector";



export default class MessageCollector{

    static createQuestion(options: IMessageQuestionOptions){
        return new MessageQuestionCollector(options);
    }

    static get Question(){
        return MessageQuestionCollector;
    }
}