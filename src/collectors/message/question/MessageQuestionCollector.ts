import { Message } from "discord.js";
import { Constants } from "../../../others/Constants";
import { BaseCollector, IMessageCollector, IOptions, IValidOptions } from "../../../structures/BaseCollector";


export default class MessageQuestionCollector extends BaseCollector implements IMessageCollector {
    private onCollectFx: Function;
    constructor(options: IMessageQuestionOptions) {
        super(MessageQuestionCollector.validate(options));

        this.onCollectFx = options.onMessage;
        // lazy loading into client object
        this.basicOptions.client.collectorManager.addMessageCollector(this);
    }

    protected static validate(options: IMessageQuestionOptions): IValidOptions {
        const validOptions = super.validate(options);
        if (!options.onMessage || typeof options.onMessage !== 'function') throw new Error(Constants.Errors.INVALID_ONMESSAGE_HOOK(options.onMessage));
        return validOptions;
    }

    onCollect(message: Message) {
        this.onCollectFx(message);
        super.afterCollect();
    }
}

export interface IMessageQuestionOptions extends IOptions {
    //@ts-ignore
    onMessage: Function;
}
