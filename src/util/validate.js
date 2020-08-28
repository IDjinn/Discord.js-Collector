const { Message, User, ClientUser } = require("discord.js");
const Constants = require('./constants');
const { isArray, isBoolean, isNumber, isObject } = require('util');

let result = [];
const findRecursively = (obj, toFind, value = null) => {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            findRecursively(obj[key], toFind, value);
        }
    }
    if (obj && obj[toFind]) {
        if (value && obj[toFind] == value)
            result.push(obj)
        else if (typeof obj[toFind] === 'function')
            result.push(obj[toFind]);
        else if (obj[toFind].length > 0)
            result.push(...obj[toFind]);
        else
            result.push(obj[toFind]);
        return true;
    }
}

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

    if (options.botMessage.channel.type == 'dm')
        options.deleteReaction = false;
    else if (type === 'reactMenu')
        options.deleteReaction = true;
    else if (options.deleteReaction === undefined)
        options.deleteReaction = true;
    else if (!isBoolean(options.deleteReaction))
        options.deleteReaction = Boolean(options.deleteReaction);

    if (options.botMessage.channel.type == 'dm')
        options.deleteAllOnEnd = false;
    else if (type === 'reactMenu' || type === 'reactPaginator')
        options.deleteAllOnEnd = true;
    else if (options.deleteAllOnEnd === undefined)
        options.deleteAllOnEnd = true;
    else if (!isBoolean(options.deleteAllOnEnd))
        options.deleteAllOnEnd = Boolean(options.deleteAllOnEnd);

    if (options.botMessage.channel.type == 'text') {
        if (!options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('ADD_REACTIONS'))
            throw 'Missing permissions: I cannot react in messages in that channel.';

        if (options.deleteReaction && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
            throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete reactions.';

        if (options.deleteAllOnEnd && !options.botMessage.guild.me.permissionsIn(options.botMessage.channel).has('MANAGE_MESSAGES'))
            throw 'Missing permissions: I not have permissions to Manage Messages in this channel to delete all reactions when collector end.';
    }

    switch (type) {
        case 'reactQuestion':
        case 'yesNoQuestion':
        case 'reactPaginator':
            options.reactionsMap = options.reactions; // TODO: REMOVE-ME
            options.reactions = undefined;
            if (options.reactionsMap && Object.keys(options.reactionsMap).filter(emoji => !client.emojis.resolveIdentifier(emoji)).length > 0)
                throw 'Invalid input: reactions is invalid type.';

            if (!options.reactionsMap)
                options.reactionsMap = (type !== 'reactPaginator') ? Constants.DEFAULT_YES_NO_MAP : Constants.DEFAULT_PAGINATOR_REACTIONS_MAP;
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

    if (type == 'reactMenu') {
        if (!options.pages)
            throw 'Invalid input: You need add pages to create a react menu.';

        result = [];
        findRecursively(options.pages, 'reactions');
        const reactions = [];
        reactions.push(...Object.keys(options.pages))
        const notEmojis = reactions.filter(emoji => !client.emojis.resolveIdentifier(emoji));
        if (notEmojis.length > 0)
            throw 'Invalid input: These values is\'nt a valid emoji: ' + notEmojis.join(', ');

        result = [];
        findRecursively(options.pages, 'onReact');
        const onReacts = result;
        if (onReacts.length > 0 && onReacts.filter(fx => typeof fx !== 'function').length > 0)
            throw 'Invalid input: Some onReact is not a function type.';


        result = [];
        findRecursively(options.pages, 'onMessage');
        const onMessages = result;
        if (onMessages.length > 0 && onMessages.filter(fx => typeof fx !== 'function').length > 0)
            throw 'Invalid input: Some onMessage is not a function type.';
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
            if (type === 'reactPaginator' || type === 'reactMenu') {
                options.collectorOptions.max = Constants.DEFAULT_PAGINATOR_MAX_REACT;
            } else {
                options.collectorOptions.max = Constants.DEFAULT_COLLECTOR_MAX_REACT;
            }
        }
    }

    return options;
}