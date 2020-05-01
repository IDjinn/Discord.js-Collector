import { Message, ReactionCollectorOptions, ReactionCollector as DjsReactionCollector, UserResolvable, MessageEmbed } from "discord.js";
export default class ReactionCollector {
    /**
     * @description This method can be used in multiples emoji choices.
     * @param  {CollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  {string[]?} options.reactions - Array with reactions (using unicode or emoji id)
     * @param  {DjsCollectorOptions?} options.collectorOptions - Default discord.js collector options
     * @param  {Function[]?} options.onReact - Corresponding functions when clicking on each reaction
     * @param  {boolean?} options.deleteReaction - The Bot will remove reaction after user react?
     * @example 
     * const botMessage = await message.channel.send('Simple yes/no question');
     * ReactionCollector.question({
     *     user: message,
     *     botMessage,
     *     onReact: [
     *         (botMessage) => message.channel.send("You've clicked in yes button!"),
     *         (botMessage) => message.channel.send("You've clicked in no button!")
     *     ]
     * });
     * @note onReact(botMessage?: Message) - onReact functions can use botMessage argument.
     * @returns DjsReactionCollector
     */
    static question(options: CollectorOptions): DjsReactionCollector;
    /**
     * @description This method can be used in async methods, returning only boolean value, more easier to use inside if tratament or two choices.
     * @param  {AsyncCollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  {string[]?} options.reactions - Array with reactions (using unicode or emoji id)
     * @param  {DjsCollectorOptions?} options.collectorOptions - Default discord.js collector options
     * @param  {boolean?} options.deleteReaction - The Bot will remove reaction after user react?
     * @example 
     * const botMessage = await message.channel.send('Simple yes/no question');
     * if (await ReactionCollector.asyncQuestion({ user: message, botMessage }))
     *     message.channel.send('You\'ve clicked in yes button!');
     * else
     *     message.channel.send('You\'ve clicked in no button!');
     * @returns Promise<boolean>
     */
    static asyncQuestion(options: AsyncCollectorOptions): Promise<boolean>;
    /**
     * @param  {CollectorOptions | AsyncCollectorOptions} options
     * @description This method verify if collector configuration can be used, avoiding errors.
     * @returns CollectorOptions | AsyncCollectorOptions
     */
    private static setDefaultCollectorOptions;
    /**
     * @param  {CollectorOptions} _options
     * @returns DjsReactionCollector
     */
    private static _createReactionCollector;
    /**
     * @private
     * @static
     * @param  {AsyncCollectorOptions} _options
     * @returns DjsReactionCollector
     */
    private static _createAsyncReactionCollector;
    /**
     * @param  {MenuOptions} options
     * @note {Function[]?} options.onReact cannot be set in this method. (yet)
     * @returns void
     */
    static menu(options: MenuOptions): Promise<void>;
}
export interface CollectorOptions {
    botMessage: Message;
    user: UserResolvable;
    reactions?: string[];
    collectorOptions?: ReactionCollectorOptions;
    onReact?: Function[];
    deleteReaction?: boolean;
    deleteAllReactionsWhenCollectorEnd: boolean;
}
export interface AsyncCollectorOptions {
    botMessage: Message;
    user: UserResolvable;
    reactions?: string[];
    collectorOptions?: ReactionCollectorOptions;
    deleteReaction?: boolean;
    deleteAllReactionsWhenCollectorEnd: boolean;
}
export interface MenuOptions {
    botMessage: Message;
    user: UserResolvable;
    pages: MessageEmbed[];
    reactions?: string[];
    collectorOptions?: ReactionCollectorOptions;
    deleteAllReactionsWhenCollectorEnd: boolean;
}
