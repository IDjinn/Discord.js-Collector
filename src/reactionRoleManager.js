const { Client } = require("discord.js");
const { Collection, Message } = require('discord.js');
const fs = require('fs');

class ReactionRole {
    constructor({ message, channel, guild, role, emoji, winners, max }) {
        this.message = message.id ? message.id : message;
        this.channel = message.channel ? message.channel.id : channel;
        this.guild = message.guild ? message.guild.id : guild;
        this.role = role.id ? role.id : role;
        this.emoji = emoji.id ? emoji.id : emoji.name || emoji;
        this.winners = winners || [];
        this.max = max != null && !isNaN(Number(max)) ? max : Number.MAX_SAFE_INTEGER;
    }

    get id() {
        return `${this.message}-${this.emoji}`;
    }

    toJSON() {
        return {
            id: this.id, message: this.message, channel: this.channel, guild: this.guild, role: this.role, emoji: this.emoji, winners: this.winners, max: this.max > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : this.max
        };
    }

    static fromJSON(json) {
        return new ReactionRole({
            message: json.message,
            channel: json.channel,
            guild: json.guild,
            role: json.role,
            emoji: json.emoji,
            winners: json.winners,
            max: json.max
        })
    }
}


/**
 * @example
 * client.on('ready', () => {
 *      client.reactionRoleManager = new ReactionRoleManager(client, { store: true });
 * });
 * 
 * client.on('message', message => {
 * //...
 *      const role = message.mentions.roles.first();
 *      client.reactionRoleManager.addRole({
 *            message, // If you don't have message object, need fetch it.
 *            role, // Role object or Id
 *            emoji: message.guild.emojis.cache.get('706597879523049585'), // Emoji Resolvable or Id
 *            max: 15 // Max roles to give, default is Infinity
 *      });
 * });
 */
class ReactionRoleManager {
    constructor(client, { store, path, debug, refreshOnBoot } = { refreshOnBoot: true, store: true, path: __dirname + '/data/roles.json', debug: false }) {
        if (!(client instanceof Client))
            throw 'Client param must be a Client object.';

        this.client = client;
        this.store = store;
        this.DATA_JSON_PATH = path;
        this.debug = debug;
        this.roles = this.__parseStore();
        if (refreshOnBoot && this.store)
            this.__resfreshOnBoot();

        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));
    }

    async __resfreshOnBoot() {
        for (const reactionRole of this.roles.values()) {
            const guild = this.client.guilds.cache.get(reactionRole.guild);
            if (!guild) {
                this.removeRole(reactionRole);
                continue;
            }


            const channel = guild.channels.cache.get(reactionRole.channel);
            if (!channel) {
                this.removeRole(reactionRole);
                continue;
            }

            const message = await channel.messages.fetch(reactionRole.message);
            if (!message) {
                this.removeRole(reactionRole);
                continue;
            }

            for (const reaction of message.reactions.cache.values()) {
                await reaction.users.fetch(); //Need fetch the users to next for
                for (const user of reaction.users.cache.values()) {
                    const member = guild.members.cache.get(user.id);
                    if (!member) {
                        await reaction.remove(user);
                        continue;
                    }

                    const emoji = reaction.emoji.id || reaction.emoji.name;
                    const id = `${message.id}-${emoji}`;
                    if (id != reactionRole.id)
                        continue;

                    if (reactionRole.winners.indexOf(member.id) <= -1)
                        reactionRole.winners.push(member.id);
                    if (!member.roles.cache.has(reactionRole.role)) {
                        await member.roles.add(reactionRole.role);
                        this.__debug('ROLE', `Role '${reactionRole.role}' was given to '${member.id}', it reacted when bot wasn't online.`)
                    }
                }

                for (const winnerId of reactionRole.winners) {
                    const member = guild.members.cache.get(winnerId);
                    if (!member) {
                        const index = reactionRole.winners.indexOf(winnerId);
                        reactionRole.winners.splice(index, 1);
                        continue;
                    }

                    if (!reaction.users.cache.has(winnerId)) {
                        if (member.roles.cache.has(reactionRole.role)) {
                            await member.roles.remove(reactionRole.role);
                            this.__debug('ROLE', `Role '${reactionRole.role}' removed from '${member.id}', it removed reaction when bot wasn't online.`)
                        }

                        const index = reactionRole.winners.indexOf(winnerId);
                        reactionRole.winners.splice(index, 1);
                    }
                }
            }
        }
        this.__store();
    }

    __debug(type, message, ...args) {
        if (this.debug)
            console.debug(`[${new Date().toLocaleString()}] [DEBUG] [${type.toUpperCase()}] - ${message} ${args}`)
    }

    async addRole({ message, role, emoji, max } = { max: Number.MAX_SAFE_INTEGER }) {
        if (message instanceof Message && message.guild) {
            if (!message.guild)
                throw 'Bad input: message must be a guild message, cannot create reaction role in DM channels.'

            const discordRole = message.guild.roles.resolve(role);
            const discordEmoji = message.guild.emojis.resolve(emoji);
            await message.react(discordEmoji);
            const reactionRole = new ReactionRole({ message: message, role: discordRole, emoji: discordEmoji, max });
            this.roles.set(reactionRole.id, reactionRole);
            this.__store();
            this.__debug('ROLE', `Role '${discordRole.id}' added in reactionRoleManager!`);
            return;
        }

        throw 'Bad input: addRole({...}) message must be a Message object.';
    }

    removeRole(role) {
        if (role instanceof ReactionRole) {
            this.roles.delete(role.id);
            this.__debug('ROLE', `Role '${role.role}' removed from reactionRoleManager!`);
            return;
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
        const roles = new Collection();
        if (this.store) {
            if (fs.existsSync(this.DATA_JSON_PATH)) {
                const json = JSON.parse(fs.readFileSync(this.DATA_JSON_PATH).toString());
                for (const role of json) {
                    roles.set(role.id, ReactionRole.fromJSON(role));
                }
                this.__debug('STORE', `Stored roles parsed, contains '${roles.size}' roles.`);
            }
        }
        return roles;
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
        if (!member)
            return;

        if (reactionRole.max <= 0)
            return this.removeRole(reactionRole);

        reactionRole.max--;
        if (reactionRole.winners.indexOf(member.id) <= -1)
            reactionRole.winners.push(member.id);

        this.__store();
        this.__debug('REACTION', `User '${member.displayName}' won the role '${reactionRole.role}'.`);
        return await member.roles.add(reactionRole.role).catch(console.error);
    }

    async __onReactionRemove(msgReaction, user) {
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
        if (!member)
            return;

        if (reactionRole.max <= 0)
            return this.removeRole(reactionRole);

        reactionRole.max++;
        // Delete when remove reaction
        const index = reactionRole.winners.indexOf(member.id);
        reactionRole.winners.splice(index, 1);
        //
        this.__store();
        this.__debug('REACTION', `User '${member.displayName}' lost the role '${reactionRole.role}'.`);
        return await member.roles.remove(reactionRole.role).catch(console.error);
    }

    async __onRemoveAllReaction(message) {
        for (const reactionRole of this.roles.filter(r => r.message == message.id).values()) {
            for (const winnerId of reactionRole.winners) {
                const member = message.guild.members.cache.get(winnerId);
                if (!member)
                    continue;

                await member.roles.remove(reactionRole.role);
            }
            this.removeRole(reactionRole);
        }
        this.__store();
    }
}

module.exports = {
    ReactionRoleManager,
    ReactionRole
}