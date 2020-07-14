const { Message, ReactionCollector: DjsReactionCollector, MessageEmbed, EmojiResolvable, CollectorOptions: DjsCollectorOptions, UserResolvable } = require("discord.js");
const { validateOptions } = require('../util/validate');
const editPaginator = async (botMessage, isBack, i, pages) => {
    isBack ? (i > 0 ? --i : pages.length - 1) : (i + 1 < pages.length ? ++i : 0);
    await botMessage.edit({ embed: pages[i] });
}

let result = [];
const findRecursively = (obj, toFind) => {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            findRecursively(obj[key], toFind);
        }
    }

    if (obj && obj[toFind]) {
        if (obj[toFind].length > 0)
            result.push(...obj[toFind]);
        else
            result.push(obj[toFind]);
        return true;
    }
}


module.exports = class ReactionCollector {
    /**
     * @description This method can be used to create easier react menu.
     * @param  {PaginatorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  options.pages - Array with menu pages.
     * @param  {DjsCollectorOptions?} [options.collectorOptions] - Default discord.js collector options
     * @example
     *  //First step, you need make menu pages like that:
     *  const pages = {
     *        '✅': {
     *          embed: {
     *            description: 'Minim magna do quis nulla excepteur dolore aute aute minim amet eu ea.'
     *          }
     *        },
     *        '706597879523049585': {
     *          content: 'Lorem Text ',
     *          embed: {
     *            description: 'Nisi ullamco magna in id ea anim aliquip officia ex excepteur est nulla exercitation.'
     *          }
     *        },
     *        '📢': {
     *          embed: {
     *            description: 'Mollit fugiat aliqua nisi in sunt pariatur laboris eiusmod anim magna ut id occaecat eu.'
     *          }
     *        }
     *    }
     * 
     *   const botMessage = await message.channel.send('Simple Reaction Menu...');
     *   ReactionCollector.menu({
     *       botMessage,
     *       user: message,
     *       pages
     *   });
     * @returns void
     */
    static async menu(options) {
        const { botMessage, user, pages, collectorOptions } = validateOptions(options, 'reactMenu');
        if (!pages || pages.length === 0)
            throw 'Invalid input: pages is null or empty';

        const keys = Object.keys(pages);
        result = [];
        findRecursively(pages, 'reactions');
        const allReactions = result;
        allReactions.push(...keys);
        let currentPage = null;

        await Promise.all(Object.keys(pages).map(r => botMessage.react(r)));
        const filter = (r, u) => u.id === user.id && (allReactions.includes(r.emoji.id) || allReactions.includes(r.emoji.name)) && !user.bot;
        const collector = botMessage.createReactionCollector(filter, collectorOptions);
        collector.on('collect', async (reaction) => {
            const emoji = reaction.emoji.id || reaction.emoji.name;
            currentPage = currentPage && currentPage.pages ? currentPage.pages[emoji] : pages[emoji];
            if (currentPage && currentPage.reactions) {
                await botMessage.reactions.removeAll();
                await currentPage.reactions.map((r) => botMessage.react(r));
            }
            else {
                await reaction.users.remove(user.id);
            }
            let { content, embed } = currentPage || botMessage;
            await botMessage.edit(content, embed);
            //await onReact[reactions.indexOf(emoji)](botMessage);
        });
        collector.on('end', async () => await botMessage.reactions.removeAll());
        return collector;
    }

    /**
     * @description This method can be used to create easier react pagination, with multiple embeds pages.
     * @param  {PaginatorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  {MessageEmbed[]} options.pages - Array with embeds.
     * @param  {EmojiResolvable[]} [options.reactions] - Array with back/skip reactions.
     * @param  {DjsCollectorOptions?} [options.collectorOptions] - Default discord.js collector options
     * @param  {boolean?} [options.deleteReaction] - Default True - The Bot will remove reaction after user react?
     * @param  {boolean?} [options.deleteAllReactionsWhenCollectorEnd] - Default True - The Bot will remove reaction after collector end?
     * @note {Function[]?} options.onReact cannot be set in this method. (yet)
     * @example
     *   const botMessage = await message.channel.send('Simple paginator...');
     *   ReactionCollector.paginator({
     *       botMessage,
     *       user: message,
     *       pages: [
     *           new MessageEmbed({ description: 'First page content...' }),
     *           new MessageEmbed({ description: 'Second page content...' })
     *       ]
     *   });
     * @returns void
     */
    static paginator(options) {
        const { botMessage, user, pages, collectorOptions, reactions, deleteReaction, deleteAllReactionsWhenCollectorEnd } = validateOptions(options, 'reactPaginator');
        if (!pages || pages.length === 0)
            throw 'Invalid input: pages is null or empty';

        let i = 0;
        botMessage.edit({ embed: pages[0] }).then(() => {
            this.question({
                botMessage,
                user,
                reactions,
                collectorOptions,
                deleteReaction,
                deleteAllReactionsWhenCollectorEnd,
                onReact: [
                    async (botMessage) => await editPaginator(botMessage, true, i, pages),
                    async (botMessage) => await editPaginator(botMessage, false, i, pages)
                ]
            });
        });
    }

    /**
     * @description This method can be used in multiples emoji choices.
     * @param  {CollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  {EmojiResolvable[]} [options.reactions] - Array with reactions.
     * @param  {DjsCollectorOptions?} [options.collectorOptions] - Default discord.js collector options
     * @param  {Function[]?} [options.onReact] - Corresponding functions when clicking on each reaction
     * @param  {boolean?} [options.deleteReaction] - The Bot will remove reaction after user react?
     * @param  {boolean?} [options.deleteAllReactionsWhenCollectorEnd] - The Bot will remove reaction after collector end?
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
        return this.__createReactionCollector(validateOptions(options, 'reactQuestion'));
    }

    /**
     * @description This method can be used in async methods, returning only boolean value, more easier to use inside if tratament or two choices.
     * @param  {AsyncCollectorOptions} options
     * @param  {Message} options.botMessage - Message from Bot to create reaction collector.
     * @param  {UserResolvable} options.user - UserResolvable who will react. 
     * @param  {EmojiResolvable[]} [options.reactions] - Array with reactions.
     * @param  {DjsCollectorOptions} [options.collectorOptions] - Default discord.js collector options
     * @param  {boolean} [options.deleteReaction] - The Bot will remove reaction after user react?
     * @param  {boolean} [options.deleteAllReactionsWhenCollectorEnd] - The Bot will remove reaction after collector end?
     * @example 
     * const botMessage = await message.channel.send('Simple yes/no question');
     * if (await ReactionCollector.asyncQuestion({ user: message, botMessage }))
     *     message.channel.send('You\'ve clicked in yes button!');
     * else
     *     message.channel.send('You\'ve clicked in no button!');
     * @returns {Promise<boolean>}
     */
    static async asyncQuestion(options) {
        return this.__createAsyncReactionCollector(validateOptions(options, 'reactAsyncQuestion'));
    }


    /**
     * @param  {CollectorOptions} _options
     * @returns {DjsReactionCollector}
     */
    static __createReactionCollector(_options) {
        try {
            const { botMessage, reactions, user, collectorOptions, onReact, deleteReaction, deleteAllReactionsWhenCollectorEnd } = _options;
            Promise.all(reactions.map(r => botMessage.react(r)));
            const filter = (r, u) => u.id === user.id && (reactions.includes(r.emoji.id) || reactions.includes(r.emoji.name)) && !user.bot;
            const collector = botMessage.createReactionCollector(filter, collectorOptions);
            collector.on('collect', async (reaction) => {
                const emoji = reaction.emoji.id || reaction.emoji.name;
                if (deleteReaction)
                    await reaction.users.remove(user.id);
                await onReact[reactions.indexOf(emoji)](botMessage);
            });
            collector.on('end', async () => { if (deleteAllReactionsWhenCollectorEnd) await botMessage.reactions.removeAll() });
            return collector;
        } catch (e) {
            throw e;
        }
    }

    /**
     * @private
     * @static
     * @param  {AsyncCollectorOptions} _options
     * @returns {Promise<boolean>}
     */
    static async __createAsyncReactionCollector(_options) {
        return new Promise(async (resolve) => {
            const { botMessage, reactions, user, collectorOptions, deleteReaction, deleteAllReactionsWhenCollectorEnd } = _options;
            await Promise.all(reactions.map(r => botMessage.react(r)));
            const filter = (r, u) => u.id === user.id && (reactions.includes(r.emoji.id) || reactions.includes(r.emoji.name)) && !user.bot;
            const caughtReactions = await botMessage.awaitReactions(filter, collectorOptions);
            if (caughtReactions.size > 0) {
                const reactionCollected = caughtReactions.first();
                if (deleteReaction)
                    await reactionCollected.users.remove(user.id);
                if (deleteAllReactionsWhenCollectorEnd)
                    await reactionCollected.message.reactions.removeAll();
                return resolve(reactions.indexOf(reactionCollected.emoji ? (reactionCollected.emoji.name || reactionCollected.emoji.id) : (reactionCollected.name || reactionCollected.id)) === 0);
            }
            return resolve(false);
        });
    }
}