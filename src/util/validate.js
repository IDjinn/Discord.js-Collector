/* eslint-disable radix */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
const {
    isArray, isBoolean, isNumber, isObject,
} = require('util');
const Constants = require('./constants');
const { findRecursively } = require('./find');

/**
 * @description This method verify if collector configuration can be used, avoiding errors.
 * @private
 * @param  {CollectorOptions | AsyncCollectorOptions} options
 * @param {COLLECTOR_TYPE} type
 * @returns {CollectorOptions | AsyncCollectorOptions} options
 */
module.exports.validateOptions = (options, type) => {
    if (!options) return Promise.reject(new Error('Missing arguments: options is undefined.'));
    if (!options.botMessage || !options.botMessage.client) return Promise.reject(new Error('Invalid input: botMessage is undefined or invalid.'));
    if (!options.collectorOptions) options.collectorOptions = {};

    const { client } = options.botMessage;
    const validOptions = { botMessage: options.botMessage };
    if (typeof client.users.resolve === 'function') validOptions.user = client.users.resolve(options.user);
    else validOptions.user = client.resolver.resolveUser(options.user);
    if (!options.user) return Promise.reject(new Error('Invalid input: user is undefined or invalid.'));

    if (options.botMessage.channel.type === 'text') {
        if (!options.botMessage.guild) return Promise.reject(new Error('Invalid input: botMessage.guild is undefined.'));

        if (options.botMessage.guild.me) {
            if (
                !options.botMessage.guild.me
                    .permissionsIn(options.botMessage.channel)
                    .has('ADD_REACTIONS')
            ) return Promise.reject(new Error('Missing permissions: I cannot react in messages in that channel.'));
        }
    }

    if (options.botMessage.channel.type === 'dm') validOptions.deleteReaction = false;
    else if (type === 'reactMenu') validOptions.deleteReaction = true;
    else if (options.deleteReaction === undefined) validOptions.deleteReaction = true;
    else if (!isBoolean(options.deleteReaction)) validOptions.deleteReaction = Boolean(options.deleteReaction);

    if (options.botMessage.channel.type === 'dm') validOptions.deleteAllOnEnd = false;
    else if (type === 'reactMenu' || type === 'reactPaginator') validOptions.deleteAllOnEnd = true;
    else if (options.deleteAllOnEnd === undefined) validOptions.deleteAllOnEnd = true;
    else if (!isBoolean(options.deleteAllOnEnd)) validOptions.deleteAllOnEnd = Boolean(options.deleteAllOnEnd);

    if (options.botMessage.channel.type === 'text') {
        if (
            !options.botMessage.guild.me
                .permissionsIn(options.botMessage.channel)
                .has('ADD_REACTIONS')
        ) return Promise.reject(new Error('Missing permissions: I cannot react in messages in that channel.'));

        if (
            options.deleteReaction
            && !options.botMessage.guild.me
                .permissionsIn(options.botMessage.channel)
                .has('MANAGE_MESSAGES')
        ) return Promise.reject(new Error('Missing permissions: I not have permissions to Manage Messages in this channel to delete reactions.'));

        if (
            options.deleteAllOnEnd
            && !options.botMessage.guild.me
                .permissionsIn(options.botMessage.channel)
                .has('MANAGE_MESSAGES')
        ) {
            return Promise.reject(
                new Error(
                    'Missing permissions: I not have permissions to Manage Messages in this channel to delete all reactions when collector end.',
                ),
            );
        }
    }

    switch (type) {
    case 'reactQuestion':
    case 'yesNoQuestion':
    case 'reactPaginator':
    case 'reactMenu':
        validOptions.reactionsMap = options.reactions;
        if (options.reactionsMap
                && Object.keys(options.reactionsMap).filter(
                    (emoji) => !client.emojis.resolveIdentifier(emoji),
                ).length > 0
        ) return Promise.reject(new Error('Invalid input: reactions is invalid type.'));

        if (!options.reactionsMap) {
            validOptions.reactionsMap = type !== 'reactPaginator'
                ? Constants.DEFAULT_YES_NO_MAP
                : Constants.DEFAULT_PAGINATOR_REACTIONS_MAP;
        }
        break;

    case 'messageQuestion':
    case 'messageAsyncQuestion':
        // eslint-disable-next-line curly
        // eslint-disable-next-line max-len
        if (options.onMessage && typeof options.onMessage !== 'function') return Promise.reject(new Error('Invalid input: onMessage is invalid type.'));

        if (!options.onMessage) validOptions.onMessage = Constants.DEFAULT_RETURN_FUNCTION;

        if (options.botMessage.channel.type === 'dm') validOptions.deleteMessage = false;
        else if (!isBoolean(options.deleteMessage)) validOptions.deleteMessage = Boolean(options.deleteMessage);

        if (options.botMessage.channel.type === 'text'
                && options.deleteMessage
                && !options.botMessage.guild.me
                    .permissionsIn(options.botMessage.channel)
                    .has('MANAGE_MESSAGES')
        ) return Promise.reject(new Error('Missing permissions: I not have permissions to Manage Messages in this channel to delete messages.'));

        validOptions.onMessage = options.onMessage;
        break;

    default: return Promise.reject(new Error(`Invalid type: '${type}' is not a valid type.`));
    }

    if (type === 'reactMenu' || type === 'reactPaginator') {
        if (!options.pages) return Promise.reject(new Error('Invalid input: You need add pages to create a react menu/paginator.'));

        if (type === 'reactMenu') {
            const reactions = findRecursively({
                obj: options.pages,
                key: 'reactions',
                result: Object.keys(options.pages),
                type: 'array',
            });
            const notEmojis = reactions.filter(
                (emoji) => !client.emojis.resolveIdentifier(emoji),
            );
            if (notEmojis.length > 0) {
                return Promise.reject(new Error((
                    `Invalid input: These values is'nt a valid emoji: ${notEmojis.join(', ')}`
                )));
            }

            const onReacts = findRecursively({
                obj: options.pages,
                key: 'onReact',
                type: 'array',
            });

            if (onReacts.length > 0
                && onReacts.filter((fx) => typeof fx !== 'function').length > 0
            ) return Promise.reject(new Error('Invalid input: Some onReact is not a function type.'));

            const onMessages = findRecursively({
                obj: options.pages,
                key: 'onMessage',
                type: 'array',
            });
            if (
                onMessages.length > 0
                && onMessages.filter((fx) => typeof fx !== 'function').length > 0
            ) return Promise.reject(new Error('Invalid input: Some onMessage is not a function type.'));
        } else if (!isArray(options.pages)) return Promise.reject(new Error('Invalid input: Pages of react paginator must be array of MessageEmbed'));

        validOptions.pages = options.pages;
    }

    validOptions.collectorOptions = {};
    Object.assign(validOptions.collectorOptions, {
        time: Constants.DEFAULT_COLLECTOR_TIME,
        max: type === 'reactPaginator'
            || type === 'reactMenu'
            || type === 'messageQuestion' ? Constants.DEFAULT_PAGINATOR_MAX_REACT : Constants.DEFAULT_COLLECTOR_MAX_REACT,
    }, options.collectorOptions);

    if (isNaN(options.collectorOptions.time)) {
        validOptions.collectorOptions.time = parseInt(options.collectorOptions.time);
        if (isNaN(options.collectorOptions.time)) {
            validOptions.collectorOptions.time = Constants.DEFAULT_COLLECTOR_TIME;
        }
    }

    if (isNaN(options.collectorOptions.max)) {
        validOptions.collectorOptions.max = parseInt(options.collectorOptions.max);
        if (isNaN(options.collectorOptions.max)) {
            if (type === 'reactPaginator'
                || type === 'reactMenu'
                || type === 'messageQuestion') {
                validOptions.collectorOptions.max = Constants.DEFAULT_PAGINATOR_MAX_REACT;
            } else {
                validOptions.collectorOptions.max = Constants.DEFAULT_COLLECTOR_MAX_REACT;
            }
        }
    }

    return validOptions;
};
