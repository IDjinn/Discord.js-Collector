import { Message } from "discord.js";
import { Constants } from "../../../others/Constants";
import { BaseCollector, IMessageCollector, IOptions, IValidOptions } from "../../../structures/BaseCollector";


export default class MessageQuestionCollector extends BaseCollector<IValidMessageQuestionOptions> implements IMessageCollector {
    private onCollectFx: Function;
    constructor(options: IMessageQuestionOptions) {
        super(options);

        if (!options.onMessage || typeof options.onMessage !== 'function') throw new Error(Constants.Errors.INVALID_ONMESSAGE_HOOK(options.onMessage));
        this.onCollectFx = options.onMessage;
        // lazy loading into client object
        this.options.client.collectorManager.addMessageCollector(this);
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

export interface IValidMessageQuestionOptions extends IValidOptions {
    //@ts-ignore
    onMessage: Function;
}