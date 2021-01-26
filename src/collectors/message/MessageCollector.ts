import { IOptions } from "../../structures/BaseCollector";
import MessageAsyncQuestionCollector from "./question/MessageAsyncQuestionCollector";
import MessageQuestionCollector, { IMessageQuestionOptions } from "./question/MessageQuestionCollector";



export default class MessageCollector{

    static createQuestion(options: IMessageQuestionOptions){
        return new MessageQuestionCollector(options);
    }

    static get Question(){
        return MessageQuestionCollector;
    }

    static createAsyncQuestion(options: IOptions){
        return new MessageAsyncQuestionCollector(options);
    }
    
    static get AsyncQuestion(){
        return MessageAsyncQuestionCollector;
    }
}