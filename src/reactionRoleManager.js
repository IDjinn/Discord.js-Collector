const { Client, Role } = require("discord.js");
const { Collection, Message } = require('discord.js');
const fs = require('fs');
const { EventEmitter } = require("events");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
* Structure from reaction role object.
*/
class ReactionRole {
    constructor({ message, channel, guild, role, emoji, winners, max, toggle }) {
        this.message = message.id ? message.id : message;
        this.channel = message.channel ? message.channel.id : channel;
        this.guild = message.guild ? message.guild.id : guild;
        this.role = role.id ? role.id : role;
        this.emoji = emoji.id ? emoji.id : emoji.name || emoji;
        this.winners = winners || [];
        this.max = isNaN(max) ? Number.MAX_SAFE_INTEGER : max;
        this.toggle = Boolean(toggle);
    }

    get id() {
        return `${this.message}-${this.emoji}`;
    }

    toJSON() {
        return {
            id: this.id,
            message: this.message,
            channel: this.channel,
            guild: this.guild,
            role: this.role,
            emoji: this.emoji,
            winners: this.winners,
            max: this.max > Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : this.max,
            toggle: this.toggle
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
            max: json.max,
            toggle: json.toggle
        })
    }
}

/**
 * Example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-role-manager/basic.js}
 */
class ReactionRoleManager extends EventEmitter {
    constructor(client, { storage, store, mongoDbLink, path, debug } = { storage: true, store: true, mongoDbLink: null, path: __dirname + '/data/roles.json', debug: false }) {
        super();
        if (!(client instanceof Client))
            throw 'Client param must be a Client object.';

        this.client = client;
        this.storage = store || storage;
        this.DATA_JSON_PATH = path;
        this.debug = debug;
        this.mongoDbLink = mongoDbLink;
        this.roles = new Collection();
        this.client.on('ready', () => this.__resfreshOnBoot());

        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));
    }


    async __checkMongoose() {
        if (!this.mongoDbLink)
            return Promise.resolve('Mongoose is disabled.');

        try {
            this.mongoose = require('mongoose');
            await this.mongoose.connect(this.mongoDbLink, { useNewUrlParser: true, useUnifiedTopology: true });

            this.mongoose.model('ReactionRoles', new this.mongoose.Schema({
                id: String,
                message: String,
                channel: String,
                guild: String,
                role: String,
                emoji: String,
                winners: Array,
                max: {
                    type: Number,
                    default: Number.MAX_SAFE_INTEGER
                },
                toggle: {
                    type: Boolean,
                    default: false
                }
            }));
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async __resfreshOnBoot() {
        if (!this.storage)
            return;

        await this.__checkMongoose().catch(console.error);
        await this.__parseStorage();
        await sleep(1000);

        const updateQueue = [];
        const checkedRoles = [];
        for (const reactionRole of this.roles.values()) {
            const guild = this.client.guilds.cache.get(reactionRole.guild);
            if (!guild) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, guild wasn't found.`);
                this.deleteReactionRole(reactionRole);
                continue;
            }

            const channel = guild.channels.cache.get(reactionRole.channel);
            if (!channel) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, channel wasn't found.`);
                this.deleteReactionRole(reactionRole);
                continue;
            }

            const message = await channel.messages.fetch(reactionRole.message);
            if (!message) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, message wasn't found.`);
                this.deleteReactionRole(reactionRole);
                continue;
            }

            if (!message.reactions.cache.has(reactionRole.emoji)) // Bot reaction is deleted, and not have any reaction with this reaction role emoji.
                await message.react(reactionRole.emoji);

            // for (const reaction of message.reactions.cache.values()) {
            const reaction = message.reactions.cache.find(x => `${message.id}-${this.client.emojis.resolveIdentifier(x.emoji.id || x.emoji.name)}`);
            /* if (!reaction) {
                 console.log('not found! wtf');
                 continue;
             }*/

            await reaction.users.fetch(); //Need fetch the users to next for
            for (const user of reaction.users.cache.values()) {
                if (user.bot) // Ignore bots, please!
                    continue;

                const member = guild.members.cache.get(user.id);
                if (!member) {
                    await reaction.users.remove(user);
                    this.__debug('REACTION', `Member '${user.id}' wasn't found, reaction of his was removed from message.`);
                    continue;
                }

                /* const emoji = this.client.emojis.resolveIdentifier(reaction.emoji.id || reaction.emoji.name);
                 const id = `${message.id}-${emoji}`;
                 if (id != reactionRole.id) {
                     this.__debug('ROLE', `Weird problem, some reaction with wrong setup. Id '${id}' from this role is not '${reactionRole.id}'...`);
                     continue;
                 }
*/
                if (reactionRole.toggle) {
                    const uncheckedRoles = this.roles.filter(role => role.message == reactionRole.message).filter(x => !checkedRoles.includes(`${x.role}-${member.id}`));
                    let counter = 0;
                    for (const [_, unchecked] of uncheckedRoles) {
                        if (counter >= 1 && !checkedRoles.includes(`${unchecked.role}-${member.id}`)) {
                            checkedRoles.push(`${unchecked.role}-${member.id}`);
                            await reaction.users.remove(user);
                            if (member.roles.cache.has(unchecked.role)) {
                                await member.roles.remove(unchecked.role);
                                this.emit('reactionRoleRemove', member, reactionRole.role);
                            }
                        }
                        counter++;
                    }
                    if (counter >= 1)
                        continue;
                }

                if (reactionRole.winners.indexOf(member.id) <= -1)
                    reactionRole.winners.push(member.id);
                if (!member.roles.cache.has(reactionRole.role)) {
                    this.emit('reactionRoleAdd', member, reactionRole.role);
                    await member.roles.add(reactionRole.role);
                    this.__debug('ROLE', `Role '${reactionRole.role}' was given to '${member.id}', it reacted when bot wasn't online.`);
                }
                else {
                    this.__debug('ROLE', `Keeping role '${reactionRole.role}' from '${member.id}', it reacted and already have the role.`);
                }
            }
            //  }

            for (const winnerId of reactionRole.winners) {
                const member = guild.members.cache.get(winnerId);
                if (!member) {
                    const index = reactionRole.winners.indexOf(winnerId);
                    reactionRole.winners.splice(index, 1);
                    this.__debug('BOOT', `Member '${winnerId}' wasn't found, his was removed from winner list.`);
                    continue;
                }

                if (member.user.bot)
                    continue;

                if (!reaction.users.cache.has(winnerId)) { // Delete role if user reacted off
                    if (member.roles.cache.has(reactionRole.role)) {
                        await member.roles.remove(reactionRole.role);
                        this.emit('reactionRoleRemove', member, reactionRole.role);
                    }

                    const index = reactionRole.winners.indexOf(winnerId);
                    reactionRole.winners.splice(index, 1);
                    this.__debug('ROLE', `Role '${reactionRole.role}' removed from '${member.id}', it removed reaction when bot wasn't online.`)
                }
            }
            updateQueue.push(reactionRole);
        }
        this.__store(...updateQueue);
    }

    __debug(type, message, ...args) {
        if (this.debug)
            console.log(`[${new Date().toLocaleString()}] [REACTION ROLE] [DEBUG] [${type.toUpperCase()}] - ${message} ${args}`)
    }

    /**
    * Create new reaction role.
    * @property {object} options - Object with options to create new reaction role.
    * @property {Message} options.message - Message what will have the reactions.
    * @property {Role} options.role - Role what the bot will give/take from members when they react.
    * @property {Emoji} options.emoji - Emoji or emoji id what member will react to win/lose the role.
    * @property {Number} [options.max] - Max roles to give, default is Infinity.
    * @property {Boolean} [options.toggle] - User will have only one of these message roles, default false.
    */
    createReactionRole({ message, role, emoji, max, toggle } = { max: Number.MAX_SAFE_INTEGER, toggle: false }) {
        return new Promise(async (resolve, reject) => {
            if (message instanceof Message) {
                if (!message.guild)
                    return reject('Bad input: message must be a guild message, cannot create reaction role in DM channels.');

                role = message.guild.roles.resolve(role);
                if (!(role instanceof Role))
                    return reject('Bad input: I canno\'t resolve role ' + role);
                emoji = message.client.emojis.resolveIdentifier(emoji);
                if (!emoji)
                    return reject('Bad input: I canno\'t resolve emoji ' + role);

                await message.react(emoji);
                const reactionRole = new ReactionRole({ message: message, role, emoji, max, toggle });
                this.roles.set(reactionRole.id, reactionRole);
                await this.__store(reactionRole);
                if (toggle) {
                    await this.mongoose.model('ReactionRoles').updateMany({ message: message }, { toggle: toggle }).exec();
                }
                this.__debug('ROLE', `Role '${role.id}' added in reactionRoleManager!`);
                return resolve();
            }
            return reject('Bad input: addRole({...}) message must be a Message object.');
        });
    }

    /**
    * @deprecated since 1.4.4, use createReactionRole instead.
    */
    async addRole({ message, role, emoji, max } = { max: Number.MAX_SAFE_INTEGER }) {
        return this.createReactionRole({ message, role, emoji, max });
    }

    /** 
    * This funcion will delete the reaction role from storage.
    * @param {ReactionRole} role - Reaction role to delete.
    * @return {Promise<void>}
    */
    async deleteReactionRole(role) {
        return await this.removeRole(role);
    }

    /**
    * @deprecated since 1.4.4, use deleteReactionRole instead.
    */
    async removeRole(role) {
        if (role instanceof ReactionRole) {
            this.roles.delete(role.id);
            if (this.mongoose) {
                await this.mongoose.model('ReactionRoles').deleteOne({ id: role.id }).exec();
            }
            this.__debug('ROLE', `Role '${role.role}' removed from reactionRoleManager!`);
            return;
        }

        throw 'Bad input: removeRole(role) must be a ReactionRole object.';
    }

    async __store(...roles) {
        if (this.storage) {
            if (this.mongoose) {
                for (const role of roles) {
                    await this.mongoose.model('ReactionRoles').findOneAndUpdate({ id: role.id }, role, { new: true, upsert: true }).exec();
                }
            }

            if (fs.existsSync(this.DATA_JSON_PATH)) {
                fs.writeFileSync(this.DATA_JSON_PATH, JSON.stringify(this.roles.map(role => role.toJSON())));
                this.__debug('STORE', `Stored roles saved, contains '${this.roles.size}' roles.`);
            }
        }
    }

    async __parseStorage() {
        if (this.storage) {
            const roles = [];
            if (fs.existsSync(this.DATA_JSON_PATH)) {
                const json = JSON.parse(fs.readFileSync(this.DATA_JSON_PATH).toString());
                roles.push(...json);
            }

            if (this.mongoose) {
                roles.push(...await this.mongoose.model('ReactionRoles').find({}));
            }

            for (const role of roles) {
                this.roles.set(role.id, ReactionRole.fromJSON(role));
            }
        }
        this.__debug('STORE', `Stored roles parsed, contains '${this.roles.size}' roles.`);
    }

    async __onReactionAdd(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = this.client.emojis.resolveIdentifier(msgReaction.emoji.id || msgReaction.emoji.name);
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const reactionRole = this.roles.get(id);
        if (!(reactionRole instanceof ReactionRole))
            return;

        const member = guild.members.cache.get(user.id);
        if (!member)
            return;

        if (reactionRole.winners.length >= reactionRole.max) {
            await msgReaction.users.remove(member.id);
            return this.__debug('ROLE', `Member will not win the reaction role '${reactionRole.role}' because the maximum number of roles to give has been reached`)
        }

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.deleteReactionRole(reactionRole);
            this.__debug('ROLE', `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not won the role.`)
        }

        if (reactionRole.winners.indexOf(member.id) <= -1)
            reactionRole.winners.push(member.id);

        if (reactionRole.toggle) {
            for (const reaction of message.reactions.cache.values()) {
                await reaction.users.fetch();
                if (reaction.users.cache.has(user.id)) {
                    const emoji = this.client.emojis.resolveIdentifier(reaction.emoji.id || reaction.emoji.name);
                    const reactionId = `${message.id}-${emoji}`;
                    const rr = this.roles.get(reactionId);
                    if (id == reactionId)
                        continue;

                    await reaction.users.remove(user);
                    if (rr && member.roles.cache.has(rr.role)) {
                        await member.roles.remove(rr.role);
                        this.emit('reactionRoleRemove', member, role);
                    }

                    if (rr.winners.indexOf(member.id) <= -1)
                        rr.winners.push(member.id);
                }
            }
        }

        await member.roles.add(role).catch(console.error);
        this.emit('reactionRoleAdd', member, role);
        this.__debug('REACTION', `User '${member.displayName}' won the role '${role.name}'.`);
        this.__store(reactionRole);
    }

    async __onReactionRemove(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = this.client.emojis.resolveIdentifier(msgReaction.emoji.id || msgReaction.emoji.name);
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const reactionRole = this.roles.get(id);
        if (!(reactionRole instanceof ReactionRole))
            return;

        const member = guild.members.cache.get(user.id);
        if (!member)
            return;

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.__debug('ROLE', `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not lose the role.`)
            return this.deleteReactionRole(reactionRole);
        }

        const index = reactionRole.winners.indexOf(member.id);
        reactionRole.winners.splice(index, 1);

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(console.error);
            this.emit('reactionRoleRemove', member, role);
            this.__debug('REACTION', `User '${member.displayName}' lost the role '${role.name}'.`);
        }

        this.__store(reactionRole);
    }

    async __onRemoveAllReaction(message) {
        const messageReactionsRoles = this.roles.filter(r => r.message == message.id).values();
        const membersAffected = [];
        let reactionsTaken = 0;
        for (const reactionRole of messageReactionsRoles) {
            for (const winnerId of reactionRole.winners) {
                const member = message.guild.members.cache.get(winnerId);
                if (!member)
                    continue;

                await member.roles.remove(reactionRole.role);
                if (!membersAffected.includes(member))
                    membersAffected.push(member);

                reactionsTaken++;
            }
            this.deleteReactionRole(reactionRole);
            this.__debug('REACTION ROLE', `Reaction role '${reactionRole.id}' was deleted, by someone take off all reactions from message.`);
        }

        const rolesAffected = messageReactionsRoles.map(rr => message.guild.roles.get(rr.role)).filter(role => role instanceof Role);
        this.emit('allReactionsRemove', message, rolesAffected, membersAffected, reactionsTaken);
        this.__store();
    }
}

module.exports = {
    ReactionRoleManager,
    ReactionRole
}