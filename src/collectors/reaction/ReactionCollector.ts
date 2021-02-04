import { IOptions } from "../../structures/BaseCollector";
import ReactionQuestionCollector, { IReactionQuestionOptions } from "./question/ReactionQuestionCollector";

export default class ReactionCollector{
    public static get ReactionCollector(){
        return ReactionCollector;
    }

    public static createMenu(options: IOptions){
        
    }

    public static get Question(){
        return ReactionQuestionCollector;
    }

    public static createQuestion(options: IReactionQuestionOptions, ...args: any[]){
        return new ReactionQuestionCollector(options, ...args);
    }
}