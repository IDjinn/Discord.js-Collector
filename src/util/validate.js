const { Message, User, ClientUser } = require("discord.js");
const Constants = require('./constants');
const { isArray, isBoolean, isNumber, isObject } = require('util');

/**
 * @description This method verify if collector configuration can be used, avoiding errors.
 * @param  {CollectorOptions | AsyncCollectorOptions} options
 * @param {COLLECTOR_TYPE} type
 * @returns {CollectorOptions | AsyncCollectorOptions} options  
*/
module.exports.validateOptions = (options, type) => {
    if (!options)
        throw 'Missing arguments: options is undefined.';
    if (!options.botMessage || !options.botMessage.client)
        throw 'Invalid input: botMessage is undefined or invalid.';

    const client = options.botMessage.client;
    if (typeof client.users.resolve == 'function')
        options.user = client.users.resolve(options.user);
    else
        options.user = client.resolver.resolveUser(options.user);
    if (!options.user)
        throw 'Invalid input: user is undefined or invalid.';

    if (options.botMessage.channel.type == 'text') {
        if (!options.botMessage.guild)
            throw 'Invalid input: botMessage.guild is undefined.';

        if (options.botMessage.guild.me) {
            if (!options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('ADD_REACTIONS'))
                throw 'Missing permissions: I cannot react in messages in that channel.';
        }
    }

    switch (type) {
        case 'reactQuestion':
        case 'reactAsyncQuestion':
        case 'reactPaginator':
            if (options.reactions && (!isArray(options.reactions) || options.reactions.filter(emoji => !client.emojis.resolveIdentifier(emoji)).length > 0))
                throw 'Invalid input: reactions is invalid type.';
            if (options.onReact && (!isArray(options.onReact) || options.onReact.filter(fx => typeof fx !== 'function').length > 0))
                throw 'Invalid input: onReact is invalid type.';

            if (!options.reactions)
                options.reactions = (type !== 'reactPaginator') ? Constants.DEFAULT_YES_NO_REACTIONS : Constants.DEFAULT_PAGINATOR_REACTIONS;

            if (!options.onReact)
                options.onReact = [Constants.DEFAULT_RETURN_FUNCTION, Constants.DEFAULT_RETURN_FUNCTION];

            if (options.botMessage.channel.type == 'dm')
                options.deleteReaction = false;
            else if (type === 'reactMenu')
                options.deleteReaction = true;
            else if (options.deleteReaction === undefined)
                options.deleteReaction = true;
            else if (!isBoolean(options.deleteReaction))
                options.deleteReaction = Boolean(options.deleteReaction);

            if (options.botMessage.channel.type == 'dm')
                options.deleteAllReactionsWhenCollectorEnd = false;
            else if (type === 'reactMenu')
                options.deleteAllReactionsWhenCollectorEnd = true;
            else if (options.deleteAllReactionsWhenCollectorEnd === undefined)
                options.deleteAllReactionsWhenCollectorEnd = true;
            else if (!isBoolean(options.deleteAllReactionsWhenCollectorEnd))
                options.deleteAllReactionsWhenCollectorEnd = Boolean(options.deleteAllReactionsWhenCollectorEnd);

            if (options.botMessage.channel.type == 'text') {
                if (!options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('ADD_REACTIONS'))
                    throw 'Missing permissions: I cannot react in messages in that channel.';

                if (options.deleteReaction && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
                    throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete reactions.';

                if (options.deleteAllReactionsWhenCollectorEnd && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
                    throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete all reactions when collector end.';
            }
            break;

        case 'reactMenu': // TODO: precisa disso?
            break;

        case 'messageQuestion':
        case 'messageAsyncQuestion':
            if (options.onMessage && (typeof options.onMessage !== 'function'))
                throw 'Invalid input: onMessage is invalid type.';

            if (!options.onMessage)
                options.onMessage = Constants.DEFAULT_RETURN_FUNCTION;

            if (options.botMessage.channel.type == 'dm')
                options.deleteMessage = false;
            else if (!isBoolean(options.deleteMessage))
                options.deleteMessage = Boolean(options.deleteMessage);

            if (options.botMessage.channel.type == 'text' && options.deleteMessage && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
                throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete messages.';
            break;
    }

    if (!options.collectorOptions || !isObject(options.collectorOptions))
        options.collectorOptions = { time: Constants.DEFAULT_COLLECTOR_TIME, max: (type === 'reactPaginator' || type === 'reactMenu') ? Constants.DEFAULT_PAGINATOR_MAX_REACT : Constants.DEFAULT_COLLECTOR_MAX_REACT };

    if (!isNumber(options.collectorOptions.time)) {
        options.collectorOptions.time = parseInt(options.collectorOptions.time);
        if (isNaN(options.collectorOptions.time)) {
            options.collectorOptions.time = Constants.DEFAULT_COLLECTOR_TIME;
        }
    }

    if (!isNumber(options.collectorOptions.max)) {
        options.collectorOptions.max = parseInt(options.collectorOptions.max);
        if (isNaN(options.collectorOptions.max)) {
            options.collectorOptions.max = (type === 'reactPaginator' || type === 'reactMenu') ? Constants.DEFAULT_PAGINATOR_MAX_REACT : Constants.DEFAULT_COLLECTOR_MAX_REACT;
        }
    }

    return options;
}