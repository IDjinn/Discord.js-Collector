const { Client, Role, Message, Collection, GuildMember } = require("discord.js");
const Constants = require("../util/constants");
const { EventEmitter } = require("events");
const { ReactionRole } = require('./reactionRole');
const { REACTIONROLE_EVENT, REQUIEREMENT_TYPE } = require('./constants');

const fs = require('fs');
const { resolve } = require("path");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-role-manager/basic.js}
 * @extends EventEmitter
 */
class ReactionRoleManager extends EventEmitter {
    /**
    * Triggered when member won a reaction role.
    * @event ReactionRoleManager#reactionRoleAdd
    * @property {GuildMember} member - The guild member who won the role.
    * @property {Role} role - The guild role what member was won.
    * @example
    * reactionRoleManager.on('reactionRoleAdd', (member, role) => {
    *   console.log(member.displayName + ' won the role ' + role.name)
    * });
    */

    /**
    * Triggered when member lose a reaction role.
    * @event ReactionRoleManager#reactionRoleRemove
    * @property {GuildMember} member - The guild member who lost the role.
    * @property {Role} role - The guild role what member was lost.
    *
    * @example
    * reactionRoleManager.on('reactionRoleRemove', (member, role) => {
    *   console.log(member.displayName + ' lose the role ' + role.name)
    * });
    */

    /**
    * Triggered when someone remove reactions from a message.
    * @event ReactionRoleManager#allReactionsRemove
    * @property {Message} message - The message what reaction was removed.
    * @property {Role[]} rolesAffected - Roles affected when reactions was removed.
    * @property {GuildMember[]} membersAffected - Members affected when reactions was removed.
    * @property {number} reactionsTaken - Count of reactions removed from message.
    *
    * @example
    * reactionRoleManager.on('allReactionsRemove', (message) => {
    *   console.log(`All reactions from message ${message.id} was removed, all roles was taken and reactions roles deleted.`)
    * });
    */

    /**
    * Triggered when someone tried won role, but not have it requirements.
    * @event ReactionRoleManager#missingRequirements
    * @property {REQUIEREMENT_TYPE} requierementType - The missing requierement to win this role.
    * @property {GuildMember} member - Member who will not win this role.
    * @property {ReactionRole} reactionRole - This reaction role what the member hasn't the requirements.
    *
    * @example
    * reactionRoleManager.on('missingRequirements', (type, member, reactionRole) => {
    *   console.log(`Member '${member.id}' will not win role '${reactionRole.role}', because him hasn't requierement ${type}`);
    * });
    */

    /**
    * Reaction Role Manager constructor
    * @param {Client} client - Discord js client object.
    * @param {object} options -
    * @param {object} [options.storage=true] - Enable/disable storage of reaction role.
    * @param {object} [options.mongoDbLink=null] - Link to connect with mongodb.
    * @param {object} [options.path=null] - Path to save json data of reactions roles.
    * @param {object} [options.debug=false] - Enable/Disable debug of reaction role manager.
    * @extends EventEmitter
    * @return {ReactionRoleManager}
    */
    constructor(client, { storage, mongoDbLink, path, debug } = { storage: true, mongoDbLink: null, path: __dirname + '/data/roles.json', debug: false }) {
        super();
        if (!(client instanceof Client))
            throw 'Client param must be a Client object.';

        /**
        * Discord client.
        * @type {Client}
        * @readonly
        */
        this.client = client;
        /**
        * Is storage enabled?
        * @type {boolean}
        * @default true
        */
        this.storage = Boolean(storage);
        /**
        * Is debug enabled?
        * @type {boolean}
        * @default false
        */
        this.debug = Boolean(debug);
        /**
        * Mongo db connection link.
        * @type {string?}
        * @readonly
        */
        this.mongoDbLink = mongoDbLink;
        /**
        * ReactionRoles collection
        * @type {Collection<string, ReactionRole>}
        * @readonly
        */
        this.reactionRoles = new Collection();
        /**
        * Timeouts to check toggled roles collection - Internal use.
        * @type {Collection<string, Function>}
        * @readonly
        */
        this.timeouts = new Collection();
        /**
        * Json storage path
        * @type {string?}
        */
        this.storageJsonPath = path;

        this.client.on('ready', () => this.__resfreshOnBoot());
        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));

        this.client.on('roleDelete', async role => {
            const reactionRole = this.reactionRoles.find(reactionRole => reactionRole.role == role.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, role);
        });

        this.client.on('emojiDelete', async emoji => {
            const emojiIdentifier = this.client.emojis.resolveIdentifier(emoji.id || emoji.name);
            const reactionRole = this.reactionRoles.find(reactionRole => reactionRole.emoji == emojiIdentifier);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, emoji);
        });

        this.client.on('guildDelete', async guild => {
            const reactionRole = this.reactionRoles.find(reactionRole => reactionRole.guild == guild.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, guild)
        });

        this.client.on('channelDelete', async channel => {
            const reactionRole = this.reactionRoles.find(reactionRole => reactionRole.channel == channel.id);
            if (reactionRole)
                return await this.__handleDeleted(reactionRole, channel)
        });

        const messageDeleteHandler = async message => {
            const reactionRole = this.reactionRoles.find(reactionRole => reactionRole.message == message.id);
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

    /** 
    * Handle some delete event, and resolve delete reaction role.
    * @private
    * @param {ReactionRole} reactionRole - Reaction Role to delete.
    * @param {GuildResolvable} guildResolvable - Guild where need delete reaction role.
    * @return {Promise<void>} 
    */
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
    }

    /** 
    * Check and setup mongoose, if it is enabled.
    * @private
    * @return {Promise<void>}
    */
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
                },
                requirements: {
                    boost: {
                        type: Boolean,
                        default: false
                    },
                    verifiedDeveloper: {
                        type: Boolean,
                        default: false
                    },
                }
            }));
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
    * Startup reaction roles from storage on ready event (database/json).
    * @private
    * @return {Promise<void>}
    */
    async __resfreshOnBoot() {
        if (!this.storage)
            return;

        await this.__checkMongoose().catch(console.error);
        await this.__parseStorage();
        await sleep(1500);

        for (const reactionRole of this.reactionRoles.values()) {
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

                if (this.__checkRequirements(reactionRole, reaction, member)) {
                    if (reactionRole.toggle) {
                        this.__debug('BOOT', `Skiping role '${reactionRole.role}' of give role assembly, need check if is it toggle role.`);
                    }
                    else {
                        if (reactionRole.winners.indexOf(member.id) <= -1)
                            reactionRole.winners.push(member.id);
                        if (!member.roles.cache.has(reactionRole.role)) {
                            this.emit(REACTIONROLE_EVENT.REACTION_ROLE_ADD, member, role);
                            await member.roles.add(reactionRole.role);
                            this.__debug('BOOT', `Role '${reactionRole.role}' was given to '${member.id}', it reacted when bot wasn't online.`);
                        }
                        else {
                            this.__debug('BOOT', `Keeping role '${reactionRole.role}' from '${member.id}', it reacted and already have the role.`);
                        }
                    }
                    this.__timeoutToggledRoles(member, message);
                }
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
                        this.emit(REACTIONROLE_EVENT.REACTION_ROLE_REMOVE, member, role);
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

    async __checkRequirements(reactionRole, reaction, member) {
        return Promise(async resolve => {
            if (!reactionRole.checkBoostRequirement(member)) {
                this.emit(REACTIONROLE_EVENT.MISSING_REQUIEREMENTS, REQUIEREMENT_TYPE.BOOST, member, reactionRole);
                await reaction.users.remove(member.user);
                this.__debug('BOOT', `Member '${user.id}' not have boost requierement, will not win this role.`);
                return resolve(false);
            }
            else if (!await reactionRole.checkDeveloperRequirement(member)) {
                this.emit(REACTIONROLE_EVENT.MISSING_REQUIEREMENTS, REQUIEREMENT_TYPE.VERIFIED_DEVELOPER, member, reactionRole);
                await reaction.users.remove(member.user);
                this.__debug('BOOT', `Member '${member.user.id}' not have verified developer requierement, will not win this role.`);
                return resolve(false);
            }
            return resolve(true);
        });
    }

    /**
    * Create new reaction role.
    * @param {object} options - Object with options to create new reaction role.
    * @param {Message} options.message - Message what will have the reactions.
    * @param {Role} options.role - Role what the bot will give/take from members when they react.
    * @param {Emoji} options.emoji - Emoji or emoji id what member will react to win/lose the role.
    * @param {Number} [options.max=Infinity] - Max roles to give.
    * @param {Boolean} [options.toggle=false] - User will have only one of these message roles.
    * @param {object} [options.requierements={}] - Requierements to win this role.
    * @param {boolean} [options.requierements.boost=false] - Need be a booster to win this role?
    * @param {boolean} [options.requierements.verifiedDeveloper=false] - Need be a verified developer to win this role?
    */
    createReactionRole({ message, role, emoji, max, toggle, requierements } = { max: Number.MAX_SAFE_INTEGER, toggle: false, requierements: { boost: false, verifiedDeveloper: false } }) {
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
                const reactionRole = new ReactionRole({ message: message, role, emoji, max, toggle, requierements });
                this.reactionRoles.set(reactionRole.id, reactionRole);
                await this.store(reactionRole);
                this.__debug('ROLE', `Role '${role}' added in reactionRoleManager!`);
                return resolve();
            }
            return reject('Bad input: addRole({...}) message must be a Message object.');
        });
    }

    /** 
    * This funcion will delete the reaction role from storage.
    * @param {ReactionRole} role - Reaction role to delete.
    * @param {boolean} [deleted=false] - Is role deleted from guild.
    * @return {Promise<void>}
    */
    async deleteReactionRole(role, deleted = false) {
        if (role instanceof ReactionRole) {
            this.reactionRoles.delete(role.id);
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

    /** 
    * Store updated roles funcion. Note: for json storage, doesn't need give arguments to this funcion.
    * @param {...ReactionRole} roles - All roles to update in database.
    * @return {Promise<void>}
    */
    async store(...roles) {
        if (this.storage) {
            if (this.mongoose) {
                for (const role of roles) {
                    await this.mongoose.model('ReactionRoles').findOneAndUpdate({ id: role.id }, role, { new: true, upsert: true }).exec();
                }
                this.__debug('STORE', `Stored ${roles.length} updated roles.`);
            }

            if (fs.existsSync(this.storageJsonPath)) {
                fs.writeFileSync(this.storageJsonPath, JSON.stringify(this.reactionRoles.map(role => role.toJSON())));
                this.__debug('STORE', `Stored roles saved, contains '${this.reactionRoles.size}' roles.`);
            }
        }
    }

    /**
    * Parse storage roles funcion.
    * @private
    * @return {Promise<void>}
    */
    async __parseStorage() {
        if (this.storage) {
            const roles = [];
            if (fs.existsSync(this.storageJsonPath)) {
                const json = JSON.parse(fs.readFileSync(this.storageJsonPath).toString());
                roles.push(...json);
            }

            if (this.mongoose) {
                roles.push(...await this.mongoose.model('ReactionRoles').find({}));
            }

            for (const role of roles) {
                if (!role || !role.message) // TODO: Temporary, need find where have update/insert mongoose error.
                    continue;
                this.reactionRoles.set(role.id, ReactionRole.fromJSON(role));
            }
        }
        this.__debug('STORE', `Stored roles parsed, contains '${this.reactionRoles.size}' roles.`);
    }

    /**
    * Reaction Role add reaction hanlder
    * @private
    * @return {Promise<void>}
    */
    async __onReactionAdd(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = this.client.emojis.resolveIdentifier(msgReaction.emoji.id || msgReaction.emoji.name);
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const member = guild.members.cache.get(user.id);
        if (!member)
            return;

        const reactionRole = this.reactionRoles.get(id);
        if (!(reactionRole instanceof ReactionRole)) {
            await message.reactions.removeAll();
            return this.__debug('ROLE', `Reaction Role '${id}' wasn't found in guild '${guild.id}', so the member '${member.id}' will not win this role.`)
        }

        if (reactionRole.winners.length >= reactionRole.max) {
            await msgReaction.users.remove(member.id);
            return this.__debug('ROLE', `Member will not win the reaction role '${reactionRole.role}' because the maximum number of roles to give has been reached`)
        }

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.__debug('ROLE', `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not won the role.`)
            return await message.reactions.removeAll();
        }

        if (this.__checkRequirements(reactionRole, msgReaction, member)) {
            if (reactionRole.winners.indexOf(member.id) <= -1)
                reactionRole.winners.push(member.id);

            await member.roles.add(role).catch(console.error);
            this.emit(REACTIONROLE_EVENT.REACTION_ROLE_ADD, member, role);
            this.__debug('ROLE', `User '${member.displayName}' won the role '${role.name}'.`);

            if (reactionRole.toggle) {
                this.__timeoutToggledRoles(member, message);
            }
            else {
                this.store(...[reactionRole]);
            }
        }
    }

    /**
    * Timeout handler to check toggled roles.
    * @private
    * @return {Promise<void>}
    */
    __timeoutToggledRoles(member, message) {
        const timeout = this.timeouts.get(member.id);
        if (timeout)
            this.client.clearTimeout(timeout);
        this.timeouts.set(member.id, setTimeout(async () => {
            let skippedRole = null;
            const toggledRoles = this.reactionRoles.filter(rr => rr.message == message.id && rr.toggle);
            for (const toggledRole of toggledRoles.values()) {
                if (!skippedRole) { // TODO: remove this
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

            if (skippedRole instanceof ReactionRole) {
                const reaction = message.reactions.cache.find(reaction => this.client.emojis.resolveIdentifier(reaction.emoji.id || reaction.emoji.name) == skippedRole.emoji)
                if (this.__checkRequirements(skippedRole, reaction, member)) {
                    if (skippedRole.winners.indexOf(member.id) <= -1)
                        skippedRole.winners.push(member.id);

                    if (!member.roles.cache.has(skippedRole.role)) {
                        await member.roles.add(skippedRole.role);
                        const role = message.guild.roles.cache.get(skippedRole.role);
                        this.emit(REACTIONROLE_EVENT.REACTION_ROLE_ADD, member, role);
                        this.__debug('BOOT', `Role '${skippedRole.role}' was given to '${member.id}' after check toggle roles, it reacted when bot wasn't online.`);
                    }
                    else {
                        this.__debug('BOOT', `Keeping role '${skippedRole.role}' after check toggle roles. The member '${member.id}' reacted and already have the role.`);
                    }
                }
            }

            await this.store(...toggledRoles);
        }, Constants.DEFAULT_TIMEOUT_TOGGLED_ROLES));
    }

    /**
    * Reaction Role remove reaction hanlder
    * @private
    * @return {Promise<void>}
    */
    async __onReactionRemove(msgReaction, user) {
        if (user.bot)
            return;

        const emoji = this.client.emojis.resolveIdentifier(msgReaction.emoji.id || msgReaction.emoji.name);
        const { message } = msgReaction;
        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const member = guild.members.cache.get(user.id);
        if (!member)
            return;

        const reactionRole = this.reactionRoles.get(id);
        if (!(reactionRole instanceof ReactionRole)) {
            this.__debug('ROLE', `Reaction Role '${id}' wasn't found in guild '${guild.id}', so this role will be deleted.`);
            return await message.reactions.removeAll();
        }

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.__debug('ROLE', `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not lose the role.`)
            return await msgReaction.removeAll();
        }

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            this.emit(REACTIONROLE_EVENT.REACTION_ROLE_REMOVE, member, role);
            this.__debug('ROLE', `User '${member.displayName}' lost the role '${role.name}'.`);
        }

        const index = reactionRole.winners.indexOf(member.id);
        if (index >= 0) {
            reactionRole.winners.splice(index, 1);
            this.store(...[reactionRole]);
        }
    }

    /**
    * Reaction Role handler when reaction is clean up.
    * @private
    * @return {Promise<void>}
    */
    async __onRemoveAllReaction(message) {
        const messageReactionsRoles = this.reactionRoles.filter(r => r.message == message.id).values();
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
        this.emit(REACTIONROLE_EVENT.ALL_REACTIONS_REMOVE, message, rolesAffected, membersAffected, reactionsTaken);
        this.store();
    }
}

module.exports = {
    ReactionRoleManager,
    ReactionRole,
    REQUIEREMENT_TYPE,
    REACTIONROLE_EVENT
}