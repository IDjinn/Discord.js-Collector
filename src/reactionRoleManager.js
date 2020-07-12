const { timeStamp } = require("console");
const { Client } = require("discord.js");
const { Collection, Role, Message } = require('discord.js');
const fs = require('fs');
const path = require('path');
//const DATA_JSON_PATH = path.join(__dirname, './data/reactionRoles.json');

class ReactionRole {
    constructor(options) {
        const { message, role, emoji, max } = options;
        this.message = message.id ? message.id : message;
        this.role = role.id ? role.id : role;
        this.emoji = emoji.id ? emoji.id : emoji.name || emoji;
        this.max = isNaN(max) ? Infinity : max;
        // this.init();
    }
    /*
        async init(client) {
            guild.
            return this.message.react(this.emoji);
        }*/

    get id() {
        return `${this.message}-${this.emoji}`;
    }

    toJSON() {
        return {
            id: this.id, message: this.message, role: this.role, emoji: this.emoji, max: this.max
        };
    }

    static fromJSON(json) {
        return new ReactionRole({
            message: json.message,
            role: json.role,
            emoji: json.emoji,
            max: json.max
        })
    }
}

class ReactionRoleManager {
    constructor(client, { store, path, debug } = { store: true, path: './test.json', debug: false }) {
        if (!(client instanceof Client))
            throw 'Client param must be a Client object.';

        this.client = client;
        this.store = store;
        this.DATA_JSON_PATH = path;
        this.debug = debug;
        this.roles = this.__parseStore();
        this.interval = setInterval(this.__store, 10 * 60_000);

        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));
    }

    __debug(type, message, ...args) {
        if (this.debug)
            console.debug(`[${new Date().toLocaleString()}] [DEBUG] [${type.toUpperCase()}] - ${message} ${args}`)
    }

    addRole({ message, role, emoji, max }) {
        if (message instanceof Message && message.guild) {
            const discordRole = message.guild.roles.resolve(role);
            const discordEmoji = message.guild.emojis.resolve(emoji);
            message.react(discordEmoji);
            this.roles.set(role.id, new ReactionRole({ message: message, role: discordRole, emoji: discordEmoji, max }));
            this.__debug('ROLE', `Role '${discordRole.id}' added in reactionRoleManager!`);
            return;
        }

        throw 'Bad input: addRole({...}) message must be a Message object inside a guild.';
    }

    removeRole(role) {
        if (role instanceof ReactionRole) {
            this.roles.delete(role.id);
            this.__debug('ROLE', `Role '${role.role}' removed from reactionRoleManager!`);
        }

        throw 'Bad input: removeRole(role) must be a ReactionRole object.';
    }

    __store() {
        if (this.store) {
            fs.writeFileSync(this.DATA_JSON_PATH, JSON.stringify(this.roles.map(role => role.toJSON())));
            this.__debug('STORE', `Stored roles saved, contains '${this.roles.size}' roles.`);
        }
    }

    __parseStore() {
        if (this.store) {
            if (fs.existsSync(this.DATA_JSON_PATH)) {
                const json = JSON.parse(fs.readFileSync(this.DATA_JSON_PATH).toString());
                const roles = new Collection();
                for (const role of json) {
                    roles.set(role.id, ReactionRole.fromJSON(role));
                }
                this.__debug('STORE', `Stored roles parsed, contains '${roles.size}' roles.`);
                return roles;
            }
        }
        return new Collection();
    }


    async __onReactionAdd(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = msgReaction.emoji.id || msgReaction.emoji.name;
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const reactionRole = this.roles.get(id);
        if (!(reactionRole instanceof ReactionRole))
            return;

        const member = guild.members.cache.get(user.id);
        if (!member || !member.manageable)
            return;

        if (reactionRole.max <= 0)
            return this.removeRole(reactionRole);

        reactionRole.max--;
        this.__debug('REACTION', `User '${member.displayName}' won the role '${reactionRole.role}'.`);
        return await member.roles.add(reactionRole.role);
    }

    async __onReactionRemove(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = msgReaction.emoji.id || msgReaction.emoji.name;
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const reactionRole = this.roles[id];
        if (!(reactionRole instanceof ReactionRole))
            return;

        const member = guild.members.cache.get(user.id);
        if (!member || !member.manageable)
            return;

        if (reactionRole.max <= 0)
            return this.removeRole(reactionRole);

        reactionRole.max++;
        this.__debug('REACTION', `User '${member.displayName}' lost the role '${reactionRole.role}'.`);
        return await member.roles.remove(reactionRole.role);
    }

    __onRemoveAllReaction(message) {

    }
}

module.exports = {
    ReactionRoleManager,
    ReactionRole
}