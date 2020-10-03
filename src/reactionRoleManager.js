const { Client, Role, Message, Collection } = require("discord.js");
const fs = require('fs');
const { EventEmitter } = require("events");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const TIMEOUT = 2500;

/** 
* Reaction role object structure.
* @param {Object} data
* @param {string} data.message - Message ID of reaction role.
* @param {string} data.channel - Channel ID of message.
* @param {string} data.guild - Guild ID of channel.
* @param {string} data.emoji - Emoji ID of reaction role.
* @param {string[]} data.winners - List with role winners ID;
* @param {number} data.max - Max roles available to give.
* @param {boolean} data.toggle - User will have only one of these message roles.
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
    /** 
    * Convert Reaction Role object to JSON.
    * @return {JSON} - Parsed json object.
    */
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

    /** 
    * Transform json to Reaction Role object.
    * @param {object} json - Reaction role data.
    * @return {ReactionRole}
    */
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
 * @extends EventEmitter
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
        this.timeouts = new Collection();

        this.client.on('ready', () => this.__resfreshOnBoot());
        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));

        this.client.on('roleDelete', async role => {
            const reactionRole = this.roles.find(reactionRole => reactionRole.role == role.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, role);
        });

        this.client.on('emojiDelete', async emoji => {
            const emojiIdentifier = this.client.emojis.resolveIdentifier(emoji.id || emoji.name);
            const reactionRole = this.roles.find(reactionRole => reactionRole.emoji == emojiIdentifier);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, emoji);
        });

        this.client.on('guildDelete', async guild => {
            const reactionRole = this.roles.find(reactionRole => reactionRole.guild == guild.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, guild)
        });

        this.client.on('channelDelete', async channel => {
            const reactionRole = this.roles.find(reactionRole => reactionRole.channel == channel.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, channel)
        });

        const messageDeleteHandler = async message => {
            const reactionRole = this.roles.find(reactionRole => reactionRole.message == message.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, message)
        }

        this.client.on('messageDelete', messageDeleteHandler.bind(this));

        this.client.on('messageDeleteBulk', messages => {
            for (const message of messages.values()) {
                messageDeleteHandler(message).bind(this);
            }
        });
    }


    async __handleDeleted(reactionRole, guildResolvable) {
        const guild = this.client.guilds.resolve(guildResolvable);
        if (!guild)
            return this.deleteReactionRole(reactionRole, true);

        const channel = guild.channels.cache.get(reactionRole.channel);
        if (!channel)
            return this.deleteReactionRole(reactionRole, true);

        const message = await channel.messages.fetch(reactionRole.message);
        if (!message)
            return this.deleteReactionRole(reactionRole, true);

        const reaction = message.reactions.cache.find(x => reactionRole.id == `${message.id}-${this.client.emojis.resolveIdentifier(x.emoji.id || x.emoji.name)}`);
        if (!reaction)
            return this.deleteReactionRole(reactionRole, true);

        await reaction.remove();
        //this.deleteReactionRole(reactionRole, true); not need. will trigger clear reactions event
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
        await sleep(1500);

        for (const reactionRole of this.roles.values()) {
            const guild = this.client.guilds.cache.get(reactionRole.guild);
            if (!guild) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, guild wasn't found.`);
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            const role = guild.roles.cache.get(reactionRole.role);
            if (!role) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, role wasn't found.`);
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            const channel = guild.channels.cache.get(reactionRole.channel);
            if (!channel) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, channel wasn't found.`);
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            const message = await channel.messages.fetch(reactionRole.message);
            if (!message) {
                this.__debug('BOOT', `Role '${reactionRole.id}' failed at start, message wasn't found.`);
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            if (!message.reactions.cache.has(reactionRole.emoji)) // Bot reaction is deleted, and not have any reaction with this reaction role emoji.
                await message.react(reactionRole.emoji);

            const reaction = message.reactions.cache.find(x => reactionRole.id == `${message.id}-${this.client.emojis.resolveIdentifier(x.emoji.id || x.emoji.name)}`);
            await reaction.users.fetch(); //Need fetch the users to next for
            for (const user of reaction.users.cache.values()) {
                if (user.bot) // Ignore bots, please!
                    continue;

                const member = guild.members.cache.get(user.id);
                if (!member) {
                    await reaction.users.remove(user);
                    this.__debug('BOOT', `Member '${user.id}' wasn't found, reaction of his was removed from message.`);
                    continue;
                }

                if (reactionRole.toggle) {
                    this.__debug('BOOT', `Skiping role '${reactionRole.role}' of give role assembly, need check if is it toggle role.`);
                }
                else {
                    if (reactionRole.winners.indexOf(member.id) <= -1)
                        reactionRole.winners.push(member.id);
                    if (!member.roles.cache.has(reactionRole.role)) {
                        this.emit('reactionRoleAdd', member, role);
                        await member.roles.add(reactionRole.role);
                        this.__debug('BOOT', `Role '${reactionRole.role}' was given to '${member.id}', it reacted when bot wasn't online.`);
                    }
                    else {
                        this.__debug('BOOT', `Keeping role '${reactionRole.role}' from '${member.id}', it reacted and already have the role.`);
                    }
                }

                this.__timeoutToggledRoles(member, message);
            }

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
                        this.emit('reactionRoleRemove', member, role);
                    }

                    const index = reactionRole.winners.indexOf(winnerId);
                    if (index >= 0)
                        reactionRole.winners.splice(index, 1);
                    this.__debug('BOOT', `Role '${reactionRole.role}' removed from '${member.id}', it removed reaction when bot wasn't online.`)
                }
            }
        }
        this.__debug('READY', 'Reaction role manager is ready.');
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

                role = message.guild.roles.resolveID(role);
                if (!role)
                    return reject('Bad input: I canno\'t resolve role ' + role);

                const matchAnimatedEmoji = emoji.match(/(?<=<a?:.*:)\d*(?=>)/);
                emoji = message.client.emojis.resolveIdentifier(matchAnimatedEmoji && matchAnimatedEmoji[0] ? matchAnimatedEmoji[0] : emoji);
                if (!emoji)
                    return reject('Bad input: I canno\'t resolve emoji ' + role);
                if (matchAnimatedEmoji && !this.client.emojis.resolve(emoji))
                    return reject('Bad input: I canno\'t find emoji ' + role);

                await message.react(emoji);
                const reactionRole = new ReactionRole({ message: message, role, emoji, max, toggle });
                this.roles.set(reactionRole.id, reactionRole);
                await this.__store(reactionRole);
                /*if (toggle) { not needed?
                    await this.mongoose.model('ReactionRoles').updateMany({ message: message }, { toggle: toggle }).exec();
                }*/
                this.__debug('ROLE', `Role '${role}' added in reactionRoleManager!`);
                return resolve();
            }
            return reject('Bad input: addRole({...}) message must be a Message object.');
        });
    }

    /** 
    * This funcion will delete the reaction role from storage.
    * @param {ReactionRole} role - Reaction role to delete.
    * @param {boolean} deleted - Is role deleted from guild? Default is false.
    * @return {Promise<void>}
    */
    async deleteReactionRole(role, deleted = false) {
        if (role instanceof ReactionRole) {
            this.roles.delete(role.id);
            if (this.mongoose) {
                await this.mongoose.model('ReactionRoles').deleteOne({ id: role.id }).exec();
            }

            if (deleted)
                this.__debug('ROLE', `Role '${role.role}' deleted, so it was removed from reactionRoleManager!`);
            else
                this.__debug('ROLE', `Role '${role.role}' removed from reactionRoleManager!`);
        }
        else
            throw 'Bad input: removeRole(role) must be a ReactionRole object.';
    }

    async __store(...roles) {
        if (this.storage) {
            if (this.mongoose) {
                for (const role of roles) {
                    await this.mongoose.model('ReactionRoles').findOneAndUpdate({ id: role.id }, role, { new: true, upsert: true }).exec();
                }
                this.__debug('STORE', `Stored ${roles.length} updated roles.`);
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
                if (!role || !role.message) // TODO: Temporary, need find where have update/insert mongoose error.
                    continue;
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

        await member.roles.add(role).catch(console.error);
        this.emit('reactionRoleAdd', member, role);
        this.__debug('ROLE', `User '${member.displayName}' won the role '${role.name}'.`);

        if (reactionRole.toggle) {
            this.__timeoutToggledRoles(member, message);
        }
        else {
            this.__store(...[reactionRole]);
        }
    }

    __timeoutToggledRoles(member, message) {
        const timeout = this.timeouts.get(member.id);
        if (timeout)
            this.client.clearTimeout(timeout);
        this.timeouts.set(member.id, setTimeout(async () => {
            let skippedRole = null;
            const toggledRoles = this.roles.filter(rr => rr.message == message.id && rr.toggle);
            for (const toggledRole of toggledRoles.values()) {
                if (!skippedRole) {
                    skippedRole = toggledRole;
                    continue;
                }

                const index = toggledRole.winners.indexOf(member.id);
                if (index >= 0)
                    toggledRole.winners.splice(index, 1);

                if (member.roles.cache.has(toggledRole.id))
                    await member.roles.remove(toggledRole.role);

                const reaction = message.reactions.cache.find(reaction => this.client.emojis.resolveIdentifier(reaction.emoji.id || reaction.emoji.name) == toggledRole.emoji)
                await reaction.users.remove(member.user);
                this.__debug('REACTION', `Take off role '${toggledRole.role}' from user '${member.id}', it's a toggled role.`);
            }

            if (skippedRole.winners.indexOf(member.id) <= -1)
                skippedRole.winners.push(member.id);
            if (!member.roles.cache.has(skippedRole.role)) {
                await member.roles.add(skippedRole.role);
                const role = message.guild.roles.cache.get(skippedRole.role);
                this.emit('reactionRoleAdd', member, role);
                this.__debug('BOOT', `Role '${skippedRole.role}' was given to '${member.id}' after check toggle roles, it reacted when bot wasn't online.`);
            }
            else {
                this.__debug('BOOT', `Keeping role '${skippedRole.role}' after check toggle roles. The member '${member.id}' reacted and already have the role.`);
            }

            await this.__store(...toggledRoles);
        }, TIMEOUT));
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

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(console.error);
            this.emit('reactionRoleRemove', member, role);
            this.__debug('ROLE', `User '${member.displayName}' lost the role '${role.name}'.`);
        }

        const index = reactionRole.winners.indexOf(member.id);
        if (index >= 0) {
            reactionRole.winners.splice(index, 1);
            this.__store(...[reactionRole]);
        }
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
            await this.deleteReactionRole(reactionRole, true);
            this.__debug('ROLE', `Reaction role '${reactionRole.id}' was deleted, by someone take off all reactions from message.`);
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