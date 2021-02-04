import { EmojiResolvable } from "discord.js";
import { MessageReaction, User, PartialUser } from "discord.js";
import { isRegExp } from "util";
import { BaseCollector, IOptions, IReactionCollector, IValidOptions } from "../../../structures/BaseCollector";



export default class ReactionQuestionCollector extends BaseCollector<IValidReactionQuestionOptions> implements IReactionCollector {
    protected args: any[];
    constructor(options: IReactionQuestionOptions, ...args: any[]) {
        super(options);

        const del = options.delete || {};
        if (typeof del.reactionOnCollect === 'boolean') this.options.delete.reactionOnCollect = del.reactionOnCollect;
        else throw 'invalid ' + del.reactionOnCollect
        if (typeof del.reactionsOnEnd === 'boolean') this.options.delete.reactionsOnEnd = del.reactionsOnEnd;
        else throw 'invalid ' + del.reactionsOnEnd

        this.args = args;
    }

    async onCollect(messageReaction: MessageReaction, maybeUser: User | PartialUser) {
        const user = maybeUser.partial ? await maybeUser.fetch() : maybeUser;
        if(this.options.delete.reactionOnCollect){
            await messageReaction.users.remove(user);
        }


    }
}

export interface IReactionQuestionOptions extends IOptions {
    reactions: EmojiResolvable[] | ReactionHooksMap;
    delete?: {
        reactionOnCollect?: boolean;
        reactionsOnEnd?: boolean;
    }
}

export interface IValidReactionQuestionOptions extends IValidOptions {
    reactions: EmojiResolvable[] | ReactionHooksMap;
    delete: {
        reactionOnCollect: boolean;
        reactionsOnEnd: boolean;
    }
}

export type ReactionHooksMap = {
    [x: string]: (reaction: MessageReaction, user: User, ...args: any[]) => {};
}