import { Message } from "discord.js";
import { Constants } from "../../../others/Constants";
import { BaseCollector, IMessageCollector, IOptions, IValidOptions } from "../../../structures/BaseCollector";


export default class MessageQuestionCollector extends BaseCollector implements IMessageCollector {
    constructor(options: IMessageQuestionOptions) {
        super(MessageQuestionCollector.validate(options));

        // lazy loading into client object
        options.client!.collectorManager!.addMessageCollector(this);
        this.onCollect = options.onMessage;
    }

    protected static validate(options: IMessageQuestionOptions): IValidOptions {
        const validOptions = super.validate(options);
        if (!options.onMessage || typeof options.onMessage !== 'function') throw new Error(Constants.Errors.INVALID_ONMESSAGE_HOOK(options.onMessage));
        return validOptions;
    }

    onCollect(message: Message) {}
}

export interface IMessageQuestionOptions extends IOptions {
    //@ts-ignore
    onMessage(message: Message);
}
