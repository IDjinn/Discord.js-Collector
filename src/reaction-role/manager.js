/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
const {
    Client,
    Role,
    Message,
    Collection,
    GuildMember,
    Util,
    MessageReaction,
    User,
} = require('discord.js');
const { EventEmitter } = require('events');
const fs = require('fs');
const AsyncLock = require('async-lock');
const Constants = require('../util/constants');
const { ReactionRole } = require('./reactionRole');
const { REACTIONROLE_EVENT, REQUIREMENT_TYPE } = require('./constants');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const locker = new AsyncLock();

/**
 * Example in {@link https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-role-manager/basic.js}
 * @extends EventEmitter
 */
class ReactionRoleManager extends EventEmitter {
    /**
     * Triggered when reaction role manager is ready
     * @event ReactionRoleManager#ready
     * @example
     * reactionRoleManager.on('ready', () => {
     *   console.log('Reaction Role Manager is ready!');
     * });
     */

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
     * @property {REQUIREMENT_TYPE} requirementType - The missing requirement to win this role.
     * @property {GuildMember} member - Member who will not win this role.
     * @property {ReactionRole} reactionRole - This reaction role what the member hasn't the requirements.
     *
     * @example
     * reactionRoleManager.on('missingRequirements', (type, member, reactionRole) => {
     *   console.log(`Member '${member.id}' will not win role '${reactionRole.role}', because him hasn't requirement ${type}`);
     * });
     */

    /**
    * Create your custom hooks to execute before/after Reaction Role Manager do things.
    * @summary Pay attention: return value must be boolean! If is not, will not work like you wish.
    * @typedef {Object} IHooks
    * @property {Promise<boolean>} preRoleAddHook - Function executed before add a role to some member.
    * If return value is false, this action will be bypassed.
    * @property {Promise<boolean>} preRoleRemoveHook - Function executed before remove a role from some member.
    * If return value is false, this action will be bypassed.
    */

    /**
     * Reaction Role Manager constructor
     * @param {Client} client - Discord js client Object.
     * @param {Object} [options] -
     * @param {boolean} [options.storage=true] - Enable/disable storage of reaction role.
     * @param {string} [options.mongoDbLink=null] - Link to connect with mongodb.
     * @param {string} [options.path=null] - Path to save json data of reactions roles.
     * @param {boolean} [options.debug=false] - Enable/Disable debug of reaction role manager.
     * @param {IHooks} [options.hooks] - Custom hooks to execute before do things.
     * @extends EventEmitter
     * @return {ReactionRoleManager}
     */
    constructor(
        client,
        {
            storage, mongoDbLink, path, debug, disabledProperty, hooks,
        },
    ) {
        super();

        /**
         * Is Reaction role manager ready?
         * @type {boolean}
         * @readonly
         */
        this.isReady = false;
        /**
         * Reaction role manager ready date
         * @type {Date?}
         */
        this.readyAt = null;
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
        this.storage = typeof storage === 'boolean' ? storage : true;
        /**
         * Is debug enabled?
         * @type {boolean}
         * @default false
         */
        this.debug = typeof debug === 'boolean' ? debug : false;
        /**
         * Mongo db connection link.
         * @type {string?}
         * @readonly
         */
        this.mongoDbLink = mongoDbLink || null;
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
        this.storageJsonPath = path || null;
        /**
         * Disable RR instead delete?
         * @default true
         * @type {boolean}
         */
        this.disabledProperty = typeof disabledProperty === 'boolean' ? disabledProperty : true;
        /**
         * Define hooks for executed while Reaction Role Manager is running.
         * @type {IHooks}
         */
        this.hooks = {
            preRoleAddHook: (...args) => true,
            preRoleRemoveHook: (...args) => true,
            ...hooks,
        };

        if (this.hooks.preRoleAddHook && typeof this.hooks.preRoleAddHook !== 'function') throw new Error('Hook \'preRoleAdd\' must be a function.');
        else if (this.hooks.preRoleRemoveHook && typeof this.hooks.preRoleRemoveHook !== 'function') {
            throw new Error('Hook \'preRoleRemoveHook\' must be a function.');
        }

        this.client.on('ready', () => this.__resfreshOnBoot());
        this.client.on('messageReactionAdd', (msgReaction, user) => this.__onReactionAdd(msgReaction, user));
        this.client.on('messageReactionRemove', (msgReaction, user) => this.__onReactionRemove(msgReaction, user));
        this.client.on('messageReactionRemoveAll', (message) => this.__onRemoveAllReaction(message));

        this.client.on('roleDelete', async (role) => {
            const reactionRole = this.reactionRoles.find((rr) => rr.role === role.id);
            if (reactionRole) return this.__handleDeleted(reactionRole, role);
        });

        this.client.on('emojiDelete', async (emoji) => {
            const emojiIdentifier = this.__resolveReactionEmoji(emoji);
            const reactionRole = this.reactionRoles.find((rr) => rr.emoji === emojiIdentifier);
            if (reactionRole) return this.__handleDeleted(reactionRole, emoji);
        });

        this.client.on('guildDelete', async (guild) => {
            const reactionRole = this.reactionRoles.find((rr) => rr.guild === guild.id);
            if (reactionRole) return this.__handleDeleted(reactionRole, guild);
        });

        this.client.on('channelDelete', async (channel) => {
            const reactionRole = this.reactionRoles.find((rr) => rr.channel === channel.id);
            if (reactionRole) return this.__handleDeleted(reactionRole, channel);
        });

        const messageDeleteHandler = async (message) => {
            const reactionRole = this.reactionRoles.find((rr) => rr.message === message.id);
            if (reactionRole) return this.__handleDeleted(reactionRole, message);
        };

        this.client.on('messageDelete', (msg) => messageDeleteHandler(msg));

        this.client.on('messageDeleteBulk', (messages) => {
            const array = messages.array();
            for (let i = 0; i < array.length; i += 1) {
                messageDeleteHandler(array[i]);
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
        if (!guild) return this.deleteReactionRole({ reactionRole }, true);

        const channel = guild.channels.cache.get(reactionRole.channel);
        if (!channel) return this.deleteReactionRole({ reactionRole }, true);

        const message = await channel.messages.fetch(reactionRole.message);
        if (!message) return this.deleteReactionRole({ reactionRole }, true);

        const reaction = message.reactions.cache.find(
            (x) => reactionRole.id === `${message.id}-${this.__resolveReactionEmoji(x)}`,
        );
        if (!reaction) return this.deleteReactionRole({ reactionRole }, true);

        await reaction.remove();
    }

    /**
     * Check and setup mongoose, if it is enabled.
     * @private
     * @return {Promise<void>}
     */
    async __checkMongoose() {
        return new Promise(async (resolve, reject) => {
            if (!this.mongoDbLink) return resolve('Mongoose is disabled.');

            try {
                this.mongoose = require('mongoose');
                await this.mongoose.connect(this.mongoDbLink, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    useFindAndModify: false,
                });

                this.mongoose.model(
                    'ReactionRoles',
                    new this.mongoose.Schema({
                        id: String,
                        message: String,
                        channel: String,
                        guild: String,
                        role: String,
                        emoji: String,
                        winners: Array,
                        max: {
                            type: Number,
                            default: Number.MAX_SAFE_INTEGER,
                        },
                        toggle: {
                            type: Boolean,
                            default: false,
                        },
                        requirements: {
                            boost: {
                                type: Boolean,
                                default: false,
                            },
                            verifiedDeveloper: {
                                type: Boolean,
                                default: false,
                            },
                        },
                        disabled: {
                            type: Boolean,
                            default: false,
                        },
                    }),
                );
                return resolve(true);
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * Startup reaction roles from storage on ready event (database/json).
     * @private
     * @return {Promise<void>}
     */
    async __resfreshOnBoot() {
        if (!this.storage) return;

        await this.__checkMongoose();
        await this.__parseStorage();
        await sleep(1500);

        const reactionRoleArray = this.reactionRoles.array();
        for (let i = 0; i < reactionRoleArray.length; i += 1) {
            const reactionRole = reactionRoleArray[i];
            const guild = this.client.guilds.cache.get(reactionRole.guild);
            if (!guild) {
                this.__debug(
                    'BOOT',
                    `Role '${reactionRole.id}' failed at start, guild wasn't found.`,
                );
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            const role = guild.roles.cache.get(reactionRole.role);
            if (!role) {
                this.__debug(
                    'BOOT',
                    `Role '${reactionRole.id}' failed at start, role wasn't found.`,
                );
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            const channel = guild.channels.cache.get(reactionRole.channel);
            if (!channel) {
                this.__debug(
                    'BOOT',
                    `Role '${reactionRole.id}' failed at start, channel wasn't found.`,
                );
                this.__handleDeleted(reactionRole, guild);
                continue;
            }

            try {
                const message = await channel.messages.fetch(reactionRole.message).catch(() => null);
                if (!message || !(message instanceof Message)) continue;
                if (message.partial) await message.fetch();
                if (!message.reactions.cache.has(reactionRole.emoji)) await message.react(reactionRole.emoji);

                const reaction = message.reactions.cache.find(
                    (x) => reactionRole.id === `${message.id}-${this.__resolveReactionEmoji(x.emoji)}`,
                );

                if (reaction.partial) await reaction.fetch();

                const users = await reaction.users.fetch();
                const usersArray = users.array();
                for (let j = 0; j < usersArray.length; j += 1) {
                    const user = usersArray[j];
                    if (user.partial) await user.fetch();
                    if (user.bot) continue;// Ignore bots, please!

                    const member = guild.members.cache.get(user.id);
                    if (!member) {
                        await reaction.users.remove(user);
                        this.__debug(
                            'BOOT',
                            `Member '${user.id}' wasn't found, reaction of his was removed from message.`,
                        );
                        continue;
                    }

                    if (member.partial) await member.fetch();
                    if (await this.__checkRequirements(reactionRole, reaction, member)) {
                        if (reactionRole.toggle) {
                            this.__debug(
                                'BOOT',
                                `Skiping role '${reactionRole.role}' of give role queue, need check if is it toggle role.`,
                            );
                        } else if (await this.hooks.preRoleAddHook(member, role, reactionRole)) {
                            if (reactionRole.winners.indexOf(member.id) <= -1) reactionRole.winners.push(member.id);
                            if (!member.roles.cache.has(reactionRole.role)) {
                                await member.roles.add(reactionRole.role);
                                this.emit(
                                    REACTIONROLE_EVENT.REACTION_ROLE_ADD,
                                    member,
                                    role,
                                );
                                this.__debug(
                                    'BOOT',
                                    `Role '${reactionRole.role}' was given to '${member.id}', it reacted when bot wasn't online.`,
                                );
                            } else {
                                this.__debug(
                                    'BOOT',
                                    `Keeping role '${reactionRole.role}' from '${member.id}', it reacted and already have the role.`,
                                );
                            }
                        }
                        this.__timeoutToggledRoles(member, message);
                    }
                }

                for (let j = 0; j < reactionRole.winners.length; j += 1) {
                    const winnerId = reactionRole.winners[j];
                    const member = guild.members.cache.get(winnerId);
                    if (!member) {
                        reactionRole.winners.splice(j, 1);
                        this.__debug(
                            'BOOT',
                            `Member '${winnerId}' wasn't found, his was removed from winner list.`,
                        );
                        continue;
                    }

                    if (member.partial) await member.fetch();
                    if (member.user.partial) await member.fetch();
                    if (member.user.bot) continue;

                    if (!users.has(winnerId) && await this.hooks.preRoleRemoveHook(member, role, reactionRole)) {
                        // Delete role if user reacted off
                        const index = reactionRole.winners.indexOf(winnerId);
                        if (index >= 0) reactionRole.winners.splice(index, 1);

                        if (member.roles.cache.has(reactionRole.role)) {
                            await member.roles.remove(reactionRole.role);
                            this.emit(
                                REACTIONROLE_EVENT.REACTION_ROLE_REMOVE,
                                member,
                                role,
                            );
                            this.__debug(
                                'BOOT',
                                `Role '${reactionRole.role}' removed from '${member.id}', it removed reaction when bot wasn't online.`,
                            );
                        }
                    }
                }
            } catch (error) {
                if (error && error.code === 10008) {
                    this.__debug(
                        'BOOT',
                        `Role '${reactionRole.id}' failed at start, message wasn't found.`,
                    );
                    this.__handleDeleted(reactionRole, guild);
                    continue;
                }
                throw error;
            }
            this.__readyTimeout();
        }
    }

    /**
     * Print messages in console if it's in debug mode.
     * @private
     * @param {string} type - Type or location in code where you are debugging.
     * @param {string} message - Message to print.
     * @param {...*} args - Other args to print after message.
     * @return {ReturnValueDataTypeHere} Brief description of the returning value here.
     */
    __debug(type, message, ...args) {
        if (this.debug) {
            console.log(
                `[${new Date().toLocaleString()}] [REACTION ROLE] [DEBUG] [${type.toUpperCase()}] - ${message} ${args}`,
            );
        }
    }

    /**
     * Check if members have all requirements and handle if it doesn't have it.
     * @private
     * @param {ReactionRole} reactionRole - Reaction role to check requirements.
     * @param {MessageReaction} reaction - Message reaction to remove reaction if it dosn't have requirements.
     * @param {GuildMember} member - Member to check requirements.
     * @return {Promise<boolean>}
     */
    async __checkRequirements(reactionRole, reaction, member) {
        return new Promise(async (resolve) => {
            if (!reactionRole.checkBoostRequirement(member)) {
                this.emit(
                    REACTIONROLE_EVENT.MISSING_REQUIREMENTS,
                    REQUIREMENT_TYPE.BOOST,
                    member,
                    reactionRole,
                );
                await reaction.users.remove(member.user);
                this.__debug(
                    'BOOT',
                    `Member '${member.id}' not have boost requirement, will not win this role.`,
                );
                return resolve(false);
            } if (
                !(await reactionRole.checkDeveloperRequirement(member))
            ) {
                this.emit(
                    REACTIONROLE_EVENT.MISSING_REQUIREMENTS,
                    REQUIREMENT_TYPE.VERIFIED_DEVELOPER,
                    member,
                    reactionRole,
                );
                await reaction.users.remove(member.user);
                this.__debug(
                    'BOOT',
                    `Member '${member.user.id}' not have verified developer requirement, will not win this role.`,
                );
                return resolve(false);
            }
            return resolve(true);
        });
    }

    /**
     * Create new reaction role.
     * @param {Object} options - Object with options to create new reaction role.
     * @param {Message} options.message - Message what will have the reactions.
     * @param {Role} options.role - Role what the bot will give/take from members when they react.
     * @param {Emoji} options.emoji - Emoji or emoji id what member will react to win/lose the role.
     * @param {Number} [options.max=Infinity] - Max roles to give.
     * @param {Boolean} [options.toggle=false] - User will have only one of these message roles.
     * @param {Object} [options.requirements={}] - Requirements to win this role.
     * @param {boolean} [options.requirements.boost=false] - Need be a booster to win this role?
     * @param {boolean} [options.requirements.verifiedDeveloper=false] - Need be a verified developer to win this role?
     * @return {Promise<void>}
     */
    createReactionRole(
        {
            message, role, emoji, max, toggle, requirements,
        } = {
            max: Number.MAX_SAFE_INTEGER,
            toggle: false,
            requirements: { boost: false, verifiedDeveloper: false },
        },
    ) {
        return new Promise(async (resolve, reject) => {
            if (message instanceof Message) {
                if (!message.guild) {
                    return reject(
                        new Error('Bad input: message must be a guild message, cannot create reaction role in DM channels.'),
                    );
                }

                role = message.guild.roles.resolveID(role);
                if (!role) return reject(new Error(`Bad input: I canno't resolve role ${role}`));

                const emojiParsed = Util.parseEmoji(emoji);
                emoji = this.__resolveReactionEmoji(emojiParsed);
                if (!emoji) return reject(new Error(`Bad input: I canno't resolve emoji ${emoji}`));

                if (
                    emojiParsed
                    && emojiParsed.id
                    && !this.client.emojis.resolve(emojiParsed.id)
                ) return reject(new Error(`Bad input: I canno't find emoji ${emoji}`));

                await message.react(emoji);
                const reactionRole = new ReactionRole({
                    message,
                    role,
                    emoji,
                    max,
                    toggle,
                    requirements,
                });
                this.reactionRoles.set(reactionRole.id, reactionRole);
                await this.store(reactionRole);
                this.__debug(
                    'ROLE',
                    `Role '${role}' added in reactionRoleManager!`,
                );
                return resolve();
            }
            return reject(new Error('Bad input: addRole({...}) message must be a Message Object.'));
        });
    }

    /**
     * This funcion will delete the reaction role from storage.
     * @param {object} options -
     * @param {object} [options.reactionRole] - Reaction Role to delete
     * @param {object} [options.message] - Message of Reaction Role. If you want delete it and not have the reaction role object
     * @param {object} [options.emoji] - Emoji of Reaction Role. If you want delete it and not have the reaction role object
     * @param {boolean} [deleted=false] - Is role deleted from guild?
     * @return {Promise<void>}
     */
    async deleteReactionRole({ reactionRole, message, emoji }, deleted = false) {
        return new Promise(async (resolve, reject) => {
            if (message && emoji) {
                const resolvedEmojiID = this.__resolveReactionEmoji(Util.parseEmoji(emoji));
                const messageID = message && message.id ? message.id : message;
                reactionRole = this.reactionRoles.find((rr) => rr.message === messageID && rr.emoji === resolvedEmojiID);
            }

            if (reactionRole instanceof ReactionRole) {
                reactionRole.disabled = true;
                if (this.disabledProperty) await this.store(reactionRole);
                // eslint-disable-next-line curly
                else if (this.mongoose) await this.mongoose
                    .model('ReactionRoles')
                    .deleteOne({ id: reactionRole.id })
                    .exec();
                else this.reactionRoles.delete(reactionRole.id);

                if (deleted) {
                    this.__debug(
                        'ROLE',
                        `Role '${reactionRole.id}' deleted, so it was removed from reactionRoleManager!`,
                    );
                } else {
                    this.__debug(
                        'ROLE',
                        `Role '${reactionRole.id}' removed from reactionRoleManager!`,
                    );
                }
                return resolve();
            }
            return reject(new Error('Bad input: deleteReactionRole(role) must be a ReactionRole Object.'));
        });
    }

    /**
     * Store updated roles funcion. Note: for json storage, doesn't need give arguments to this funcion.
     * @param {...ReactionRole} roles - All roles to update in database.
     * @return {Promise<void>}
     */
    async store(...roles) {
        return new Promise(async (resolve) => {
            if (this.storage) {
                if (this.mongoose) {
                    for (let i = 0; i < roles.length; i += 1) {
                        const role = roles[i];
                        await this.mongoose
                            .model('ReactionRoles')
                            .findOneAndUpdate({ id: role.id }, role, {
                                new: true,
                                upsert: true,
                            })
                            .exec();
                    }
                    this.__debug(
                        'STORE',
                        `Stored ${roles.length} updated roles.`,
                    );
                }

                if (this.storageJsonPath) {
                    fs.writeFileSync(
                        this.storageJsonPath,
                        JSON.stringify(
                            this.reactionRoles.map((role) => role.toJSON()),
                        ),
                    );
                    this.__debug(
                        'STORE',
                        `Stored roles saved, contains '${this.reactionRoles.size}' roles.`,
                    );
                }
            }
            return resolve();
        });
    }

    /**
     * Parse storage roles funcion.
     * @private
     * @return {Promise<void>}
     */
    async __parseStorage() {
        return new Promise(async (resolve) => {
            if (this.storage) {
                const roles = [];
                if (fs.existsSync(this.storageJsonPath)) {
                    const json = JSON.parse(
                        fs.readFileSync(this.storageJsonPath).toString(),
                    );
                    roles.push(...json);
                }

                if (this.mongoose) {
                    roles.push(
                        ...(await this.mongoose
                            .model('ReactionRoles')
                            .find({ disabled: false })),
                    );
                }

                for (let i = 0; i < roles.length; i += 1) {
                    const role = roles[i];
                    if (!role || !role.message || role.disabled) continue;

                    this.reactionRoles.set(
                        role.id,
                        ReactionRole.fromJSON(role),
                    );
                }
            }
            this.__debug(
                'STORE',
                `Stored roles parsed, contains '${this.reactionRoles.size}' roles.`,
            );
            return resolve();
        });
    }

    /**
     * Reaction Role add reaction hanlder
     * @private
     * @param {MessageReaction} msgReaction
     * @param {User} user
     * @return {Promise<void>}
     */
    async __onReactionAdd(msgReaction, user) {
        if (user.bot) return;

        if (msgReaction.partial) await msgReaction.fetch();
        if (user.partial) await user.fetch();

        const emoji = this.__resolveReactionEmoji(msgReaction.emoji);
        const { message } = msgReaction;
        if (message.partial) await message.fetch();

        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const member = guild.members.cache.get(user.id);
        if (!member) return;

        if (member.partial) await member.fetch();

        const reactionRole = this.reactionRoles.get(id);
        if (!(reactionRole instanceof ReactionRole)) return;

        if (reactionRole.disabled) return;

        if (reactionRole.winners.length >= reactionRole.max) {
            await msgReaction.users.remove(member.id);
            return this.__debug(
                'ROLE',
                `Member will not win the reaction role '${reactionRole.role}' because the maximum number of roles to give has been reached`,
            );
        }

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.__debug(
                'ROLE',
                `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not won the role.`,
            );
            return msgReaction.remove();
        }

        if (!await this.__checkRequirements(reactionRole, msgReaction, member)) return;
        if (reactionRole.toggle) this.__timeoutToggledRoles(member, message, reactionRole);
        else if (await this.hooks.preRoleAddHook(member, role, reactionRole)) {
            if (reactionRole.winners.indexOf(member.id) <= -1) reactionRole.winners.push(member.id);
            if (!member.roles.cache.has(role.id)) await member.roles.add(role);

            this.emit(REACTIONROLE_EVENT.REACTION_ROLE_ADD, member, role);
            this.__debug(
                'ROLE',
                `User '${member.displayName}' won the role '${role.name}'.`,
            );

            this.store(reactionRole);
        }
    }

    /**
     * Timeout handler to check toggled roles.
     * @param {GuildMember} member
     * @param {Message} message
     * @param {ReactionRole} [skippedRole=null]
     * @param {number} [tries=0]
     * @private
     * @return {Promise<void>}
     */
    async __timeoutToggledRoles(member, message, skippedRole = null, tries = 0) {
        if (++tries > 3) return;
        if (locker.isBusy(member.id)) {
            await sleep(Constants.DEFAULT_TIMEOUT_TOGGLED_ROLES);
            return this.__timeoutToggledRoles(member, message, skippedRole, tries);
        }

        const timeout = this.timeouts.get(member.id);
        if (timeout) this.client.clearTimeout(timeout);

        this.timeouts.set(
            member.id,
            setTimeout(async () => locker.acquire(member.id, async () => {
                const toggledRoles = this.reactionRoles.filter((rr) => rr.message === message.id && rr.toggle);
                const toggledRolesArray = toggledRoles.array();
                for (let i = 0; i < toggledRolesArray.length; i += 1) {
                    const toggledRole = toggledRolesArray[i];
                    if (toggledRole.disabled) continue;

                    const reaction = message.reactions.cache.find(
                        (r) => this.__resolveReactionEmoji(r.emoji) === toggledRole.emoji,
                    );

                    if (member.partial) await member.fetch();
                    if (reaction.partial) await reaction.fetch();

                    const users = await reaction.users.fetch();
                    if (users.has(member.id) && (!skippedRole || skippedRole.id === toggledRole.id)) {
                        skippedRole = toggledRole;
                        continue;
                    }

                    const role = member.guild.roles.cache.get(toggledRole.role);
                    if (await this.hooks.preRoleRemoveHook(member, role, toggledRole)) {
                        const index = toggledRole.winners.indexOf(member.id);
                        if (index >= 0) toggledRole.winners.splice(index, 1);

                        if (member.roles.cache.has(toggledRole.id)) await member.roles.remove(toggledRole.role);

                        if (users.has(member.id)) { await reaction.users.remove(member.user); }
                        this.__debug(
                            'TOGGLE',
                            `Take off role '${toggledRole.role}' from user '${member.id}', it's a toggled role.`,
                        );
                    }
                }

                if (skippedRole instanceof ReactionRole) {
                    const reaction = message.reactions.cache.find(
                        (r) => this.__resolveReactionEmoji(r.emoji) === skippedRole.emoji,
                    );

                    const role = message.guild.roles.cache.get(skippedRole.role);
                    if (await this.__checkRequirements(skippedRole, reaction, member)
                        && await this.hooks.preRoleAddHook(member, role, skippedRole)) {
                        if (skippedRole.winners.indexOf(member.id) <= -1) skippedRole.winners.push(member.id);

                        if (!member.roles.cache.has(skippedRole.role)) {
                            await member.roles.add(skippedRole.role);

                            this.emit(
                                REACTIONROLE_EVENT.REACTION_ROLE_ADD,
                                member,
                                role,
                            );
                            if (this.isReady) {
                                this.__debug(
                                    'TOGGLE',
                                    `Role '${skippedRole.role}' was given to '${member.id}' after check toggle roles.`,
                                );
                            } else {
                                this.__debug(
                                    'BOOT',
                                    // eslint-disable-next-line max-len
                                    `Role '${skippedRole.role}' was given to '${member.id}' after check toggle roles, it reacted when bot wasn't online.`,
                                );
                            }
                        } else {
                            this.__debug(
                                'BOOT',
                                // eslint-disable-next-line max-len
                                `Keeping role '${skippedRole.role}' after check toggle roles. The member '${member.id}' reacted and already have the role.`,
                            );
                        }
                    }
                }

                await this.store(...toggledRoles);
            }), Constants.DEFAULT_TIMEOUT_TOGGLED_ROLES),
        );
    }

    __readyTimeout() {
        const readyTimeout = this.timeouts.get('ready_timeout');
        if (readyTimeout) this.client.clearTimeout(readyTimeout);
        if (this.isReady) return;

        this.timeouts.set('ready_timeout', setTimeout(() => {
            this.isReady = true;
            this.readyAt = new Date();
            this.emit(REACTIONROLE_EVENT.READY);
            this.__debug('READY', 'Reaction role manager is ready.');
        }, 5000));
    }

    /**
     * Reaction Role remove reaction hanlder
     * @private
     * @param {MessageReaction} msgReaction
     * @param {User} user
     * @return {Promise<void>}
     */
    async __onReactionRemove(msgReaction, user) {
        if (user.bot) return;

        if (msgReaction.partial) await msgReaction.fetch();
        if (user.partial) await user.fetch();

        const emoji = this.__resolveReactionEmoji(msgReaction.emoji);
        const { message } = msgReaction;
        if (message.partial) await message.fetch();

        const { guild } = message;
        const id = `${message.id}-${emoji}`;

        const member = guild.members.cache.get(user.id);
        if (!member) return;

        if (member.partial) await member.fetch();

        const reactionRole = this.reactionRoles.get(id);
        if (!(reactionRole instanceof ReactionRole)) return;

        if (reactionRole.disabled) return;

        const role = guild.roles.cache.get(reactionRole.role);
        if (!(role instanceof Role)) {
            this.__debug(
                'ROLE',
                `Role '${reactionRole.role}' wasn't found in guild '${guild.id}', the member '${member.id}' will not lose the role.`,
            );
            return msgReaction.remove();
        }

        if (await this.hooks.preRoleRemoveHook(member, role, reactionRole) && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            this.emit(REACTIONROLE_EVENT.REACTION_ROLE_REMOVE, member, role);
            this.__debug(
                'ROLE',
                `User '${member.displayName}' lost the role '${role.name}'.`,
            );
        }

        const index = reactionRole.winners.indexOf(member.id);
        if (index >= 0) {
            reactionRole.winners.splice(index, 1);
            this.store(reactionRole);
        }
    }

    /**
     * Reaction Role handler when reaction is clean up.
     * @private
     * @return {Promise<void>}
     */
    async __onRemoveAllReaction(message) {
        const messageReactionsRoles = this.reactionRoles.filter((r) => r.message === message.id).array();
        const membersAffected = [];
        let reactionsTaken = 0;
        for (let i = 0; i < messageReactionsRoles.length; i += 1) {
            const reactionRole = messageReactionsRoles[i];
            for (let j = 0; j < reactionRole.winners.length; j += 1) {
                const winnerId = reactionRole.winners[j];
                /**
                 * @type {GuildMember}
                 */
                const member = message.guild.members.cache.get(winnerId);
                if (!member) continue;

                if (member.partial) await member.fetch();

                const role = member.guild.roles.cache.get(reactionRole.role);
                if (await this.hooks.preRoleRemoveHook(member, role, reactionRole)) {
                    await member.roles.remove(role.id);
                    if (!membersAffected.includes(member)) membersAffected.push(member);
                }

                reactionsTaken += 1;
            }
            await this.deleteReactionRole({ reactionRole }, true);
            this.__debug(
                'ROLE',
                `Reaction role '${reactionRole.id}' was deleted, by someone take off all reactions from message.`,
            );
        }

        const rolesAffected = messageReactionsRoles.map((rr) => message.guild.roles.cache.get(rr.role));
        this.emit(
            REACTIONROLE_EVENT.ALL_REACTIONS_REMOVE,
            message,
            rolesAffected,
            membersAffected,
            reactionsTaken,
        );
        this.store();
    }

    __resolveReactionEmoji(emoji) {
        return emoji.id || this.client.emojis.resolveIdentifier(emoji.name);
    }
}

module.exports = {
    ReactionRoleManager,
    ReactionRole,
    REQUIREMENT_TYPE,
    REACTIONROLE_EVENT,
};
