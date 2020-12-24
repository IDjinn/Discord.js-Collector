const {
    GuildMember, PermissionResolvable, RoleResolvable, UserResolvable,
} = require('discord.js');
const { ReactionRoleType, isValidReactionRoleType } = require('./constants');

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
     * @param {string[]} [data.roles=[]] - All roles of this reaction role.
     *
     * @return {ReactionRole}
     */
    constructor({
        message,
        channel,
        guild,
        role,
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
         * Guild ID of message
         * @type {string}
         * @readonly
         */
        this.guild = message.guild ? message.guild.id : guild;
        /**
         * Channel ID of message
         * @type {string}
         * @readonly
         */
        this.channel = message.channel ? message.channel.id : channel;
        /**
         * Message ID of reaction role
         * @type {string}
         * @readonly
         */
        this.message = message.id ? message.id : message;
        /**
         * Role ID
         * @type {string}
         * @deprecated since 1.8.0, please use `roles` property instead.
         * @readonly
         */
        this.role = role && role.id ? role.id : role;
        /**
         * Emoji identifier
         * @type {string}
         * @readonly
         */
        this.emoji = emoji.id || emoji.name ? emoji.id : emoji.name || emoji;
        /**
         * List of who won this role
         * @type {string[]}
         * @readonly
         */
        this.winners = winners || [];
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
        this.roles = Array.isArray(roles) ? roles : [];

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
        return `${this.message}-${this.emoji}`;
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
     * Convert Reaction Role object to JSON.
     * @return {JSON} - Parsed json object.
     */
    toJSON() {
        return {
            id: this.id,
            message: this.message,
            channel: this.channel,
            guild: this.guild,
            emoji: this.emoji,
            winners: this.winners,
            max: this.max,
            requirements: this.requirements,
            disabled: this.disabled,
            type: this.type,
            roles: this.roles,
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
            winners: json.winners,
            max: json.max,
            toggle: json.toggle,
            requirements: json.requirements,
            disabled: json.disabled,
            type: json.type,
            roles: json.roles,
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

        /**
        * @since 1.8.0
        */
        if (this.role && !this.roles.includes(this.role)) this.roles.push(this.role);
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
