import { IOptions } from "../../structures/BaseCollector";
import MessageAsyncQuestionCollector, { IValidMessageAsyncQuestionOptions } from "./question/MessageAsyncQuestionCollector";
import MessageQuestionCollector, { IMessageQuestionOptions } from "./question/MessageQuestionCollector";



export default class MessageCollector{
    public static createQuestion(options: IMessageQuestionOptions){
        return new MessageQuestionCollector(options);
    }

    public static get Question(){
        return MessageQuestionCollector;
    }

    public static createAsyncQuestion(options: IValidMessageAsyncQuestionOptions){
        return new MessageAsyncQuestionCollector(options);
    }
    
    public static get AsyncQuestion(){
        return MessageAsyncQuestionCollector;
    }
}