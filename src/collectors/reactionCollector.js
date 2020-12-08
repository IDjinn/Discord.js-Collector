const {
    Message,
    MessageEmbed,
    EmojiResolvable,
    UserResolvable,
} = require('discord.js');
const Discord = require('discord.js');
const { validateOptions } = require('../util/validate');
const { findRecursively } = require('../util/find');

/**
 * Reaction Controller class
 */
class Controller {
    /**
     * Reaction Controller constructor
     * @param {Message} botMessage - Message where reaction collector is working.
     * @param {Discord.ReactionCollector} collector - Collector from botMessage.
     * @param {Object} pages - All reaction collector pages.
     * @return {Controller}
     */
    constructor(botMessage, collector, pages) {
        this._botMessage = botMessage;
        this._collector = collector;
        this._pages = pages;
        this._lastPage = null;
        this._currentPage = null;
    }

    /**
     * Stop all collectors funcion
     * @param {string?} [reason='user'] - The reason this collector is ending
     * @return {void}
     */
    stop(reason = 'user') {
        if (this.messagesCollector) this.messagesCollector.stop(reason);
        return this._collector.stop(reason);
    }

    /**
     * Reset collectors timer
     * @param {Object} [options] -
     * @param {number} [options.time] - How long to run the collector for in milliseconds.
     * @param {number} [options.idle] -How long to stop the collector after inactivity in milliseconds.
     * @return {void}
     */
    resetTimer(options) {
        if (this.messagesCollector) this.messagesCollector.resetTimer(options);
        this.collector.resetTimer(options);
    }

    /**
     * Go to other page
     * @param {string|number} pageId - Specific ID to other page.
     * @throws {string} Invalid action if page id given doesn't exists.
     * @return {Promise<void>}
     */
    async goTo(pageId) {
        const pages = [];
        findRecursively({
            obj: this.pages,
            key: 'id',
            value: pageId,
            type: 'object',
            result: pages,
        });
        const page = pages.shift();
        if (!page) return Promise.reject(new Error(`Invalid action: Couldn't go to page '${pageId}', this page doens't exists.`));

        this.currentPage = page;
        await this.update();
    }

    /**
     * Back to last page
     * @throws {string} - Invalid action if tou cannot back without a last page valid.
     * @return {Promise<void>}
     */
    async back() {
        if (!this.canBack) {
            return Promise.reject(
                new Error(
                    'Invalid action: Cannot back without last page valid.',
                ),
            );
        }

        const aux = this.currentPage;
        this.currentPage = this.lastPage;
        this.lastPage = aux;
        return this.update();
    }

    /**
     * Update botMessage when page was changed.
     * @param {boolean} [onlyMessage=false] - Do you need update only message, without reactions? Default false.
     * @return {Promise<void>}
     */
    async update(onlyMessage = false) {
        if (onlyMessage) return this.botMessage.edit(this.currentPage);

        await this.botMessage.edit(this.currentPage);
        await this.botMessage.reactions.removeAll();
        if (this.currentPage.clearReactions) {
            await this.botMessage.reactions.removeAll();
        } else if (this.currentPage.reactions) {
            await Promise.all(
                this.currentPage.reactions.map((r) => this.botMessage.react(r)),
            );
        }

        if (this.currentPage.backEmoji) await this.botMessage.react(this.currentPage.backEmoji);
    }

    /**
     * Bot message of reaction collector.
     * @type {Message}
     * @readonly
     */
    get botMessage() {
        return this._botMessage;
    }

    /**
     * Last page visualized by user.
     * @type {Object?}
     * @readonly
     */
    get lastPage() {
        return this._lastPage;
    }

    set messagesCollector(value) {
        this._messagesCollector = value;
    }

    /**
     * Discord.js message collector, if pages have funcion to catch messages.
     * @type {Discord.MessageCollector?}
     * @readonly
     */
    get messagesCollector() {
        return this._messagesCollector;
    }

    /**
     * Discord.js reaction collector
     * @type {Discord.ReactionCollector}
     * @readonly
     */
    get collector() {
        return this._collector;
    }

    /**
     * Current page.
     * @type {Object}
     * @readonly
     */
    get currentPage() {
        return this._currentPage;
    }

    set currentPage(value) {
        this.lastPage = this.currentPage || value;
        this._currentPage = value;
    }

    set lastPage(value) {
        this._lastPage = value;
    }

    /**
     * All pages Object
     * @type {Object}
     * @readonly
     */
    get pages() {
        return this._pages;
    }

    /**
     * Can use funcion back()?
     * @type {boolean}
     * @readonly
     */
    get canBack() {
        return this.lastPage != null;
    }
}

/**
 * Reaction Collector class
 */
class ReactionCollector {
    /**
     * Create a reaction menu. See example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-collector/menu.js}
     * @param {Object} options - Options to create a reaction menu.
     * @param {Message} options.botMessage - Bot message where collector will start work.
     * @param {Object} options.pages - Reaction menu pages.
     * @param {UserResolvable} options.user - User who can react this menu.
     * @param {Discord.ReactionCollectorOptions} [options.collectorOptions] - Options to create discord.js reaction collector options.
     * @param {...*} [args] - Arguments given when onReact or onMessage function was triggered.
     * @return {Controller}
     */
    static async menu(options, ...args) {
        const {
            botMessage, user, pages, collectorOptions,
        } = validateOptions(
            options,
            'reactMenu',
        );

        const keys = Object.keys(pages);
        const allReactions = findRecursively({
            obj: pages,
            key: 'reactions',
            result: keys,
            type: 'array',
        });
        findRecursively({
            obj: pages,
            key: 'backEmoji',
            result: allReactions,
            type: 'value',
        });
        const needCollectMessages = findRecursively({ obj: pages, key: 'onMessage' }).length > 0;

        const filter = (r, u) => u.id === user.id
            && (allReactions.includes(r.emoji.id)
                || allReactions.includes(r.emoji.name))
            && !user.bot;
        const collector = botMessage.createReactionCollector(
            filter,
            collectorOptions,
        );
        const controller = new Controller(botMessage, collector, pages);
        collector.on('collect', async (reaction) => {
            const emoji = reaction.emoji.id || reaction.emoji.name;
            if (
                controller.currentPage
                    && emoji === controller.currentPage.backEmoji
                    && controller.canBack
            ) {
                controller.back();
                return;
            }

            controller.currentPage = controller.currentPage && controller.currentPage.pages
                ? controller.currentPage.pages[emoji]
                : pages[emoji];
            if (controller.currentPage) {
                if (typeof controller.currentPage.onReact === 'function') {
                    await controller.currentPage.onReact(
                        controller,
                        reaction,
                        ...args,
                    );
                }
            }
            await controller.update();
            await reaction.users.remove(user.id);
        });
        await Promise.all(Object.keys(pages).map((r) => botMessage.react(r)));
        collector.on('end', async () => botMessage.reactions.removeAll());

        if (needCollectMessages) {
            const messagesCollector = botMessage.channel.createMessageCollector(
                (message) => message.author.id === user.id,
                collectorOptions,
            );
            controller.messagesCollector = messagesCollector;
            messagesCollector.on('collect', async (message) => {
                if (message.deletable) await message.delete();
                if (
                    controller.currentPage && typeof controller.currentPage.onMessage === 'function'
                ) {
                    await controller.currentPage.onMessage(
                        controller,
                        message,
                        ...args,
                    );
                }
            });

            collector.on('end', () => messagesCollector.stop());
        }
        return controller;
    }

    /**
     * @description This method can be used to create easier react pagination, with multiple embeds pages.
     * @sumary {Function[]?} options.onReact cannot be set in this method. (yet)
     * See full example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-collector/paginator.js}
     * @param  {PaginatorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react.
     * @param  {MessageEmbed[]} options.pages - Array with embeds.
     * @param  {EmojiResolvable[]} [options.reactions] - Array with back/skip reactions.
     * @param  {Discord.ReactionCollectorOptions?} [options.collectorOptions] - Default discord.js reaction collector options
     * @param  {boolean?} [options.deleteReaction=true] - The Bot will remove reaction after user react?
     * @param  {boolean?} [options.deleteAllOnEnd=true] - The Bot will remove reaction after collector end?
     * @example
     *   const botMessage = await message.channel.send('Simple paginator...');
     *   ReactionCollector.paginator({
     *       botMessage,
     *       user: message.author,
     *       pages: [
     *           new MessageEmbed({ description: 'First page content...' }),
     *           new MessageEmbed({ description: 'Second page content...' })
     *       ]
     *   });
     * @returns void
     */
    static async paginator(options) {
        const {
            botMessage,
            user,
            pages,
            collectorOptions,
            reactionsMap,
            deleteReaction,
            deleteAllOnEnd,
        } = validateOptions(options, 'reactPaginator');
        if (!pages || pages.length === 0) return Promise.reject(new Error('Invalid input: pages is null or empty'));

        pages.index = 0;
        await botMessage.edit({ embed: pages[pages.index] });
        const collector = this.__createReactionCollector(
            {
                botMessage,
                user,
                reactionsMap,
                collectorOptions,
                deleteReaction,
                deleteAllOnEnd,
            },
            botMessage,
            pages,
        );
        return collector;
    }

    /**
     * @description This method can be used in multiples emoji choices.
     * @param  {CollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react.
     * @param  {EmojiResolvable[]} [options.reactions=['✅','❌']] - Object with reactions and functions.
     * @param  {Discord.ReactionCollectorOptions?} [options.collectorOptions] - Default discord.js reaction collector options
     * @param  {boolean?} [options.deleteReaction=true] - The Bot will remove reaction after user react?
     * @param  {boolean?} [options.deleteAllOnEnd=true] - The Bot will remove reaction after collector end?
     * @param {...*} [args] - All args given at trigger onReact() funcion.
     * See example in {@link https://github.com/IDjinn/Discord.js-Collector/tree/master/examples/reaction-collector/question.js}
     * @note onReact(reation, ...args) = When user react, will trigger this function
     * @returns Discord.ReactionCollector
     */
    static question(options, ...args) {
        return this.__createReactionCollector(
            validateOptions(options, 'reactQuestion'),
            ...args,
        );
    }

    /**
     * @description This method can be used in async methods, returning only boolean value, more easier to use inside if tratament or two choices.
     * @summary See full example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-collector/yesNoQuestion.js}
     * @param  {AsyncCollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react.
     * @param  {EmojiResolvable[]} [options.reactions=['✅','❌']] - Array with 2 emojis, first one is "Yes" and second one is "No".
     * @param  {Discord.ReactionCollectorOptions} [options.collectorOptions] - Default discord.js reaction collector options
     * @param  {boolean} [options.deleteReaction=true] - The Bot will remove reaction after user react?
     * @param  {boolean} [options.deleteAllOnEnd=true] - The Bot will remove reaction after collector end?
     * @returns {Promise<boolean>}
     *
     * @example
     * const botMessage = await message.channel.send('Simple yes/no question');
     * if (await ReactionCollector.yesNoQuestion({ user: message.author, botMessage }))
     *     message.channel.send('You\'ve clicked in yes button!');
     * else
     *     message.channel.send('You\'ve clicked in no button!');
     */
    static async yesNoQuestion(options) {
        return this.__createYesNoReactionCollector(
            validateOptions(options, 'yesNoQuestion'),
        );
    }

    /**
     * @description Internal methods, do not use.
     * @private
     * @param  {CollectorOptions} _options
     * @returns {Discord.ReactionCollector}
     */
    static async __createReactionCollector(_options, ...args) {
        const {
            botMessage,
            reactionsMap,
            user,
            collectorOptions,
            deleteReaction,
            deleteAllOnEnd,
        } = _options;
        const reactions = Object.keys(reactionsMap) || reactionsMap;
        await Promise.all(reactions.map((r) => botMessage.react(r)));
        const filter = (r, u) => u.id === user.id
                && (reactions.includes(r.emoji.id)
                    || reactions.includes(r.emoji.name))
                && !user.bot;
        const collector = botMessage.createReactionCollector(
            filter,
            collectorOptions,
        );
        collector.on('collect', async (reaction) => {
            const emoji = reaction.emoji.id || reaction.emoji.name;
            if (deleteReaction) await reaction.users.remove(user.id);
            if (typeof reactionsMap[emoji] === 'function') reactionsMap[emoji](reaction, collector, ...args);
        });
        if (deleteAllOnEnd) {
            collector.on(
                'end',
                async () => botMessage.reactions.removeAll(),
            );
        }
        return collector;
    }

    /**
     * @description Internal methods, do not use.
     * @private
     * @param  {AsyncCollectorOptions} _options
     * @returns {Promise<boolean>}
     */
    static async __createYesNoReactionCollector(_options) {
        return new Promise(async (resolve) => {
            const {
                botMessage,
                reactionsMap,
                user,
                collectorOptions,
                deleteReaction,
                deleteAllOnEnd,
            } = _options;
            const reactions = Object.keys(reactionsMap) || reactionsMap;
            await Promise.all(reactions.map((r) => botMessage.react(r)));
            const filter = (r, u) => u.id === user.id
                && (reactions.includes(r.emoji.id)
                    || reactions.includes(r.emoji.name))
                && !user.bot;
            const caughtReactions = await botMessage.awaitReactions(
                filter,
                collectorOptions,
            );
            if (caughtReactions.size > 0) {
                const reactionCollected = caughtReactions.first();
                if (deleteAllOnEnd) await reactionCollected.message.reactions.removeAll();
                else if (deleteReaction) await reactionCollected.users.remove(user.id);
                return resolve(
                    reactions.indexOf(
                        reactionCollected.emoji
                            ? reactionCollected.emoji.name
                                  || reactionCollected.emoji.id
                            : reactionCollected.name || reactionCollected.id,
                    ) === 0,
                );
            }
            return resolve(false);
        });
    }
}

module.exports = {
    Controller,
    ReactionCollector,
};
