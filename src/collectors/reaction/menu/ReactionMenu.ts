import { MessageReaction, User, PartialUser } from "discord.js";
import { BaseCollector, IOptions, IReactionCollector } from "../../../structures/BaseCollector";



export default class ReactionMenu extends BaseCollector<any> implements IReactionCollector{
    constructor(options: IReactionMenuOptions){
        super(options);
    }

   async onCollect(messageReaction: MessageReaction, maybeUser: User | PartialUser) {
        const user = maybeUser.partial ? await maybeUser.fetch() : maybeUser;
    }
}

export interface IReactionMenuOptions extends IOptions{
    
}