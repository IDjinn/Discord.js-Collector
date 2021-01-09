const {
    GuildMember,
    PermissionResolvable,
    RoleResolvable,
    UserResolvable,
    Guild,
    TextChannel,
    Message,
    Emoji,
    MessageReaction,
    Role,
    Client,
} = require('discord.js');
const { ReactionRoleType, isValidReactionRoleType, ActionType } = require('./constants');
const { ReactionRoleManager } = require('./manager');

/**
 * Requirement type object struct
 * @typedef {object} IRequirementType
 * @property {boolean} [boost=false] - User need have boost in server to win this role.
 * @property {boolean} [verifiedDeveloper=false] - User need verified developer badge to win this role.
 * @property {IRequirementRolesType} [roles={}] - Roles requirements
 * @property {IRequirementUsersType} [users=false] - Users requirements
 * @property {PermissionResolvable[]} [permissionsNeed=[]] - Permissions requirements
 */

/**
 * Requirement type object struct
 * @typedef {object} IRequirementRolesType
 * @property {RoleResolvable[]} [allowList=[]] - List of roles ID's need to win this role.
 * @property {RoleResolvable[]} [denyList=[]] - List of roles ID's denied to win this role.
 */

/**
 * Requirement type object struct
 * @typedef {object} IRequirementUsersType
 * @property {UserResolvable[]} [allowList=[]] - List of users ID's allowed to win this role.
 * @property {UserResolvable[]} [denyList=[]] - List of users ID's denied to win this role.
 */

/**
 * Reaction role object structure.
 */
class ReactionRole {
    /**
     * Reaction Role constructor.
     * @param {Object} data
     * @param {Client} data.client - Bot client.
     * @param {ReactionRoleManager} data.manager - Reaction Role Manager.
     * @param {string} data.message - Message ID of reaction role.
     * @param {string} data.channel - Channel ID of message.
     * @param {string} data.guild - Guild ID of channel.
     * @param {string} data.emoji - Emoji ID of reaction role.
     * @param {string[]} [data.winners=[]] - List with role winners ID;
     * @param {number} [data.max=Number.MAX_SAFE_INTEGER] - Max roles available to give.
     * @param {boolean} [data.toggle=false] - User will have only one of these message roles.
     * @param {IRequirementType} [data.requirements={}] - Requirements to win this role.
     * @param {boolean} [data.disabled=false] - Is this reaction role disabled?
     * @param {ReactionRoleType} [data.type=1] - Reaction role type
     * @param {RoleResolvable[]} [data.roles=[]] - All roles of this reaction role.
     *
     * @return {ReactionRole}
     */
    constructor({
        client,
        manager,
        message,
        channel,
        guild,
        emoji,
        winners,
        max,
        toggle,
        requirements,
        disabled,
        type,
        roles,
    }) {
        /**
         * Bot client
         * @type {Client}
         */
        this.client = client;
        /**
         * Reaction Role Manager
         * @type {ReactionRoleManager}
         */
        this.manager = manager;
        /**
         * Guild ID of message
         * @type {string}
         * @readonly
         */
        this.guildId = message.guild ? message.guild.id : guild;
        /**
         * Channel ID of message
         * @type {string}
         * @readonly
         */
        this.channelId = message.channel ? message.channel.id : channel;
        /**
         * Message ID of reaction role
         * @type {string}
         * @readonly
         */
        this.messageId = message.id ? message.id : message;
        /**
         * Emoji identifier
         * @type {string}
         * @readonly
         */
        this.emojiId = emoji.id || emoji.name ? emoji.id : emoji.name || emoji;
        /**
         * ID's list of who won this role
         * @type {string[]}
         * @readonly
         */
        this.winnersId = winners || [];
        /**
         * Max roles available to give
         * @type {number}
         */
        // eslint-disable-next-line no-restricted-globals
        this.max = isNaN(max) ? 0 : Number(max);
        /**
         * Is it toggled role?
         * @type {number}
         * @deprecated since 1.7.9
         */
        this.toggle = Boolean(toggle);
        /**
         * Requirement to win this role.
         * @type {IRequirementType}
         */
        this.requirements = {
            boost: false,
            verifiedDeveloper: false,
            roles: {
                allowList: [],
                denyList: [],
            },
            users: {
                allowList: [],
                denyList: [],
            },
            permissionsNeed: [],
            ...requirements,
        };
        /**
         * Is this reaction role disabled?
         * @type {boolean}
         */
        this.disabled = Boolean(disabled);
        /**
         * This reaction role type.
         * @type {ReactionRoleType}
         */
        this.type = Number(type);
        /**
         * Roles ID's
         * @type {string[]}
         */
        this.rolesId = Array.isArray(roles) ? roles : [];

        /**
         * Guild from this Reaction Role
         * @type {Guild}
         */
        this.guild = guild instanceof Guild ? guild : null;
        /**
         * TextChannel from this Reaction Role
         * @type {TextChannel}
         */
        this.channel = channel instanceof TextChannel ? channel : null;
        /**
         * Message from this Reaction Role
         * @type {Message}
         */
        this.message = message instanceof Message ? message : null;
        /**
         * Emoji from this Reaction Role
         * @type {Emoji}
         */
        this.emoji = null;
        /**
         * MessageReaction from this Reaction Role
         * @type {MessageReaction}
         */
        this.messageReaction = null;
        /**
         * Members who win this role
         * @type {GuildMember[]}
         */
        this.winners = [];
        /**
         * Roles that will be given/taken
         * @type {Role[]}
         */
        this.roles = [];

        this.__isValid = false;

        this.__check();
        this.__handleDeprecation();
        if (!isValidReactionRoleType(this.type)) throw new Error(`Unexpected Reaction Role Type: '${this.type}' is not a valid type.`);
    }

    /**
     * Reaction Role ID (messageId-emojiId)
     * @type {string}
     * @readonly
     */
    get id() {
        return `${this.messageId}-${this.emojiId}`;
    }

    /**
     * Is this Reaction Toggle Role?
     * @type {boolean}
     * @readonly
     */
    get isToggle() {
        return this.type === ReactionRoleType.TOGGLE;
    }

    /**
     * Is this Normal Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isNormal() {
        return this.type === ReactionRoleType.NORMAL;
    }

    /**
     * Is this Just Win Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isJustWin() {
        return this.type === ReactionRoleType.JUST_WIN;
    }

    /**
     * Is this Just Lose Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isJustLose() {
        return this.type === ReactionRoleType.JUST_LOSE;
    }

    /**
     * Is this Reversed Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isReversed() {
        return this.type === ReactionRoleType.REVERSED;
    }

    /**
     * Is this Reaction Role valid?
     */
    get isValid() {
        return this.__isValid;
    }

    /**
     * Convert Reaction Role object to JSON.
     * @return {JSON} - Parsed json object.
     */
    toJSON() {
        return {
            id: this.id,
            message: this.messageId,
            channel: this.channelId,
            guild: this.guildId,
            emoji: this.emojiId,
            winnersId: this.winnersId,
            max: this.max,
            requirements: this.requirements,
            disabled: this.disabled,
            type: this.type,
            roles: this.rolesId,
        };
    }

    /**
     * Check if member have developer requirement to win this roles.
     * @param {GuildMember} member - The member to check.
     * @return {Promise<boolean>}
     */
    async checkDeveloperRequirement(member) {
        return new Promise(async (resolve) => {
            if (!this.requirements.verifiedDeveloper) return resolve(true);
            const flags = await member.user.fetchFlags();
            const isVerifiedDeveloper = flags.has('VERIFIED_DEVELOPER');
            return resolve(isVerifiedDeveloper);
        });
    }

    /**
     * Check if member have boost requirement to win this roles.
     * @param {GuildMember} member - The member to check.
     * @return {boolean}
     */
    checkBoostRequirement(member) {
        const isBoost = member.premiumSinceTimestamp != null && member.premiumSince != null;
        if (this.requirements.boost) return isBoost;
        return true;
    }

    /**
     * Transform json to Reaction Role object.
     * @param {object} json - Reaction role data.
     * @deprecated since 1.8.0, please use `new ReactionRole(json)` instead.
     * @static
     * @return {ReactionRole}
     */
    static fromJSON(json) {
        return new ReactionRole({
            message: json.message,
            channel: json.channel,
            guild: json.guild,
            role: json.role,
            emoji: json.emoji,
            winnersId: json.winnersId,
            max: json.max,
            toggle: json.toggle,
            requirements: json.requirements,
            disabled: json.disabled,
            type: json.type,
            roles: json.roles,
        });
    }

    /**
     * Resolve this reaction role.
     * @return {Promise<ReactionRole>}
     */
    resolve() {
        return new Promise(async (resolve) => {
            this.guild = this.client.guilds.cache.get(this.guildId);
            if (!this.guild) {
                this.manager.__debug(
                    'BOOT',
                    `Role '${this.id}' failed at start, guild wasn't found.`,
                );
                return resolve(this.manager.__handleDeleted(this, this.guildId));
            }

            this.channel = this.guild.channels.cache.get(this.channelId);
            if (!this.channel) {
                this.manager.__debug(
                    'BOOT',
                    `Role '${this.id}' failed at start, channel wasn't found.`,
                );
                return resolve(this.manager.__handleDeleted(this, this.guildId));
            }

            try {
                this.message = await this.channel.messages.fetch(this.messageId);
                if (!this.message || !(this.message instanceof Message)) {
                    this.manager.__debug(
                        'BOOT',
                        `Role '${this.id}' failed at start, message wasn't found.`,
                    );
                    return resolve(this.manager.__handleDeleted(this, this.guildId));
                }

                if (this.message.partial) await this.message.fetch();
                if (!this.message.reactions.cache.has(this.emojiId)) await this.message.react(this.emojiId);

                this.messageReaction = this.message.reactions.cache.find(
                    (x) => this.id === `${this.message.id}-${this.manager.__resolveReactionEmoji(x.emoji)}`,
                );
                this.emoji = this.messageReaction.emoji;

                if (this.messageReaction.partial) await this.messageReaction.fetch();

                const users = await this.messageReaction.users.fetch();
                const usersArray = users.array();
                for (let j = 0; j < usersArray.length; j += 1) {
                    const user = usersArray[j];
                    if (user.partial) await user.fetch();
                    if (user.bot) continue; // Ignore bots, please!

                    const member = this.guild.members.cache.get(user.id);
                    if (!member) {
                        await this.messageReaction.users.remove(user.id);
                        this.manager.__debug(
                            'BOOT',
                            `Member '${user.id}' wasn't found, reaction of his was removed from message.`,
                        );
                        continue;
                    }

                    this.manager.__handleReactionRoleAction(ActionType.GIVE, member, this, this.messageReaction);
                }

                for (let j = 0; j < this.winnersId.length; j += 1) {
                    const winnerId = this.winnersId[j];
                    const member = this.guild.members.cache.get(winnerId);
                    if (!member) {
                        this.winnersId.splice(j, 1);
                        this.manager.__debug(
                            'BOOT',
                            `Member '${winnerId}' wasn't found, his was removed from winner list.`,
                        );
                        continue;
                    }

                    if (member.partial) await member.fetch();
                    if (member.user.partial) await member.user.fetch();
                    if (member.user.bot) continue;

                    if (!users.has(winnerId)) this.manager.__handleReactionRoleAction(ActionType.TAKE, member, this, this.messageReaction);
                }

                for (let j = 0; j < this.rolesId.length; j += 1) {
                    const roleId = this.rolesId[j];
                    const role = this.guild.roles.resolve(roleId);
                    if (role) this.roles.push(role);
                    else {
                        this.manager.__debug(
                            'BOOT',
                            `Role '${roleId}' wasn't found in reaction role '${this.id}', so it was removed.`,
                        );
                        this.rolesId.splice(j, 1);
                    }
                }

                if (this.roles.length === 0) {
                    this.manager.__debug(
                        'BOOT',
                        `Reaction Role '${this.id}' failed at start, roles is invalid.`,
                    );
                    return resolve(this.manager.__handleDeleted(this, this.guildId));
                }

                this.__isValid = true;
                return resolve(this);
            } catch (error) {
                if (error && error.code === 10008) {
                    this.manager.__debug(
                        'BOOT',
                        `Role '${this.id}' failed at start, message wasn't found.`,
                    );
                    return resolve(this.manager.__handleDeleted(this, this.guild));
                }

                return resolve(error);
            }
        });
    }

    /**
     * @private
     */
    __handleDeprecation() {
        /**
         * @since 1.7.9
         */
        if (this.max > 10E9 || this.max < 0) this.max = 0; // 1B is max, 0 is inifity.

        if (this.toggle && this.type !== ReactionRoleType.TOGGLE) this.type = ReactionRoleType.TOGGLE;
        else if (this.type === ReactionRoleType.UNKNOWN) this.type = ReactionRoleType.NORMAL;
    }

    /**
     * @private
     */
    __check() {
        this.requirements.boost = Boolean(this.requirements.boost);
        this.requirements.verifiedDeveloper = Boolean(this.requirements.verifiedDeveloper);
        if (typeof this.requirements.boost !== 'boolean') throw new Error('Invalid property: requirements.boost must be a boolean.');
        if (typeof this.requirements.verifiedDeveloper !== 'boolean') throw new Error('Invalid property: requirements.verifiedDeveloper must be a boolean.');
        if (!Array.isArray(this.requirements.roles.allowList)) throw new Error('Invalid property: requirements.roles.allowList must be a array.');
        if (!Array.isArray(this.requirements.roles.denyList)) throw new Error('Invalid property: requirements.roles.denyList must be a array.');
        if (!Array.isArray(this.requirements.permissionsNeed)) throw new Error('Invalid property: requirements.permissionsNeed must be a array.');
    }
}

module.exports = {
    ReactionRole,
};
