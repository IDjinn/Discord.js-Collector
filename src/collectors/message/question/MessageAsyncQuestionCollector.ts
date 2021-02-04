import { Message } from "discord.js";
import { Constants } from "../../../others/Constants";
import { BaseCollector, IMessageCollector, IOptions, IValidOptions } from "../../../structures/BaseCollector";
import { Semaphore } from 'await-semaphore';

export default class MessageAsyncQuestionCollector extends BaseCollector<IValidMessageAsyncQuestionOptions> implements IMessageCollector {
    private messages: Message[] = [];
    private resolveOnCollect?: Function;
    constructor(options: IValidMessageAsyncQuestionOptions) {
        super(options);

        // lazy loading into client object
        this.options.client.collectorManager.addMessageCollector(this);
    }

    public get next(){
        return new Promise(resolve => {
            this.resolveOnCollect = resolve;
        }).then(()=>this.messages.shift());
    }

    // for(var of list) support
    async*[Symbol.asyncIterator]() {
        while (this.isCollecting()) {
            if (this.messages.length > 0) yield this.messages.shift()!;

            await new Promise(resolve => {
                this.resolveOnCollect = resolve;
            })

            if (this.messages.length > 0) yield this.messages.shift()!;
        }
    }

    public dispose() {
        super.dispose();
        this.messages = [];
        this.resolveOnCollect = undefined;
    }

    async onCollect(message: Message) {
        this.messages.push(message);
        super.afterCollect();

        if (this.resolveOnCollect) this.resolveOnCollect();
    }
}

export interface IMessageAsyncQuestionOptions extends IOptions{

}

export interface IValidMessageAsyncQuestionOptions extends IValidOptions{
    
}