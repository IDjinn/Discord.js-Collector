require('tslib');
const { Message, ReactionCollectorOptions, ReactionCollector: DjsReactionCollector, CollectorOptions: DjsCollectorOptions, CollectorFilter, User, ReactionEmoji, MessageReaction, UserResolvable, Util, MessageEmbed } = require("discord.js");
const Constants = require("../util/constants");
const { isArray, isBoolean, isNumber, isObject } = require('util');
const editMenu = async (botMessage, isBack, i, pages) => {
    isBack ? (i > 0 ? --i : pages.length - 1) : (i + 1 < pages.length ? ++i : 0);
    await botMessage.edit({ embed: pages[i] });
}

module.exports = class ReactionCollector {
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
    static question(options) {
        return this._createReactionCollector(this.validateOptions(options, 'question'));
    }

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
    static async asyncQuestion(options) {
        return this._createAsyncReactionCollector(this.validateOptions(options, 'asyncQuestion'));
    }

    /**
     * @param  {CollectorOptions | AsyncCollectorOptions} options
     * @description This method verify if collector configuration can be used, avoiding errors.
     * @returns CollectorOptions | AsyncCollectorOptions
     */
    static validateOptions(options, type) {
        if (!options)
            throw 'Missing arguments: options is undefined.';
        if (!options.botMessage || !(options.botMessage instanceof Message))
            throw 'Invalid input: botMessage is undefined or invalid.';

        options.user = options.botMessage.client.users.resolve(options.user);
        if (!(options.user instanceof User))
            throw 'Invalid input: user is undefined or invalid.';
        if (!options.botMessage.guild)
            throw 'Invalid input: botMessage.guild is undefined.';
        if (!options.botMessage.guild || !options.botMessage.guild.me)
            throw 'Invalid input: botMessage.guild.me is undefined.';
        if (!options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('ADD_REACTIONS'))
            throw 'Missing permissions: I cannot react in messages in that channel.';

        if (!options.reactions || !isArray(options.reactions) || !isArray(options.onReact) || options.reactions.length !== options.onReact.length) {
            options.reactions = type !== 'menu' ? Constants.DEFAULT_YES_NO_REACTIONS : Constants.DEFAULT_MENU_REACTIONS;
            options.onReact = [() => { return true; }, () => { return false; }];
        }

        if (!options.collectorOptions || !isObject(options.collectorOptions))
            options.collectorOptions = { time: Constants.DEFAULT_COLLECTOR_TIME, max: Constants.DEFAULT_COLLECTOR_MAX_REACT };

        if (!isNumber(options.collectorOptions.time)) {
            options.collectorOptions.time = parseInt(options.collectorOptions.time);
            if (isNaN(options.collectorOptions.time)) {
                options.collectorOptions.time = Constants.DEFAULT_COLLECTOR_TIME;
            }
        }

        if (!isNumber(options.collectorOptions.max)) {
            options.collectorOptions.max = parseInt(options.collectorOptions.max);
            if (isNaN(options.collectorOptions.max)) {
                options.collectorOptions.max = Constants.DEFAULT_COLLECTOR_MAX_REACT;
            }
        }

        if (options.deleteReaction === undefined)
            options.deleteReaction = true;
        else if (!isBoolean(options.deleteReaction))
            options.deleteReaction = Boolean(options.deleteReaction);

        if (options.deleteAllReactionsWhenCollectorEnd === undefined)
            options.deleteAllReactionsWhenCollectorEnd = true;
        else if (!isBoolean(options.deleteAllReactionsWhenCollectorEnd))
            options.deleteAllReactionsWhenCollectorEnd = Boolean(options.deleteAllReactionsWhenCollectorEnd);

        if (options.deleteReaction && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
            throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete reactions.';

        if (options.deleteAllReactionsWhenCollectorEnd && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
            throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete all reactions when collector end.';

        return options;
    }

    /**
     * @param  {CollectorOptions} _options
     * @returns DjsReactionCollector
     */
    static _createReactionCollector(_options) {
        const { botMessage, reactions, user, collectorOptions, onReact, deleteReaction, deleteAllReactionsWhenCollectorEnd } = _options;
        Promise.all(reactions.map(r => botMessage.react(r)));
        const filter = (r, u) => u.id === user.id && reactions.includes(r.emoji.name) && !user.bot;
        const collector = botMessage.createReactionCollector(filter, collectorOptions);
        collector.on('collect', async (reaction) => {
            const emoji = reaction.emoji.name;
            if (deleteReaction)
                await reaction.users.remove(user.id);
            await onReact[reactions.indexOf(emoji)](botMessage);
        });
        collector.on('end', async () => { if (deleteAllReactionsWhenCollectorEnd) await botMessage.reactions.removeAll() });
        return collector;
    }

    /**
     * @private
     * @static
     * @param  {AsyncCollectorOptions} _options
     * @returns DjsReactionCollector
     */
    static async _createAsyncReactionCollector(_options) {
        return new Promise(async (resolve, reject) => {
            const { botMessage, reactions, user: userResolvable, collectorOptions, deleteReaction, deleteAllReactionsWhenCollectorEnd } = _options;
            const user = botMessage.client.users.resolve(userResolvable);
            await Promise.all(reactions.map(r => botMessage.react(r))).catch(reject);
            const filter = (r, u) => u.id === user.id && reactions.includes(r.emoji.name) && !user.bot;
            const collector = botMessage.createReactionCollector(filter, collectorOptions);
            collector.on('collect', async (reaction) => {
                if (deleteReaction)
                    await reaction.users.remove(user.id);
                return resolve(reactions.indexOf(reaction.emoji.name) === 0 ? true : false);
            });
            collector.on('end', async () => { if (deleteAllReactionsWhenCollectorEnd) await botMessage.reactions.removeAll() });
        });
    }

    /**
     * @param  {MenuOptions} options
     * @note {Function[]?} options.onReact cannot be set in this method. (yet)
     * @returns void
     */
    static async menu(options) {
        const { botMessage, user, pages, collectorOptions, reactions, deleteReaction, deleteAllReactionsWhenCollectorEnd } = this.validateOptions(options);
        if (!pages || pages.length === 0)
            throw 'Invalid input: pages is null or empty';

        let i = 0;
        await botMessage.edit({ embed: pages[0] });
        this.question({
            botMessage,
            user,
            reactions,
            collectorOptions,
            deleteReaction,
            deleteAllReactionsWhenCollectorEnd,
            onReact: [
                async (botMessage) => await editMenu(botMessage, true, i, pages),
                async (botMessage) => await editMenu(botMessage, false, i, pages)
            ]
        });
    }
}