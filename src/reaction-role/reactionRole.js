const { GuildMember } = require('discord.js');
const { ReactionRoleType, isValidReactionRoleType } = require('./constants');
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
     * @param {object} [data.requirements={}] - Requirements to win this role.
     * @param {boolean} [data.requirements.boost=false] - Need be a booster to win this role?
     * @param {boolean} [data.requirements.verifiedDeveloper=false] - Need be a verified developer to win this role?
     * @param {boolean} [data.disabled=false] - Is this reaction role disabled?
     * @param {REACTION_ROLE_TYPE} [data.type=0] - Reaction role type
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
        type
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
         * @readonly
         */
        this.role = role.id ? role.id : role;
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
        this.max = isNaN(max) || max < 0 ? 0 : Number(max);
        /**
         * Is it toggled role?
         * @type {number}
         * @deprecated since 1.7.9
         */
        this.toggle = Boolean(toggle);
        /**
         * Requirement to win this role.
         * @property {boolean} [boost=false] - Need be a booster to win this role.
         * @property {boolean} [verifiedDeveloper=false] - Need be a verified bot developer to win this role.
         */
        this.requirements = {
            boost: Boolean(requirements ? requirements.boost : null),
            verifiedDeveloper: Boolean(
                requirements ? requirements.verifiedDeveloper : null,
            ),
        };
        /**
         * Is this reaction role disabled?
         * @type {boolean}
         */
        this.disabled = Boolean(disabled);
        /**
         * This reaction role type.
         * @type {REACTION_ROLE_TYPE}
         */
        this.type = Number(type);

        if(this.max > 10E9) this.max = 0; // 1B
        this.__handleDeprecation();
        if(!isValidReactionRoleType(this.type)) throw new Error(`Unexpected Reaction Role Type: '${this.type}' is not a valid type.`);
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
    get isToggle(){
        return this.type === ReactionRoleType.TOGGLE;
    }

    /**
     * Is this Normal Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isNormal(){
        return this.type === ReactionRoleType.NORMAL;
    }

    /**
     * Is this Just Win Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isJustWin(){
        return this.type === ReactionRoleType.JUST_WIN;
    }

    /**
     * Is this Just Lose Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isJustLose(){
        return this.type === ReactionRoleType.JUST_LOSE;
    }

    /**
     * Is this Reversed Reaction Role?
     * @type {boolean}
     * @readonly
     */
    get isReversed(){
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
            role: this.role,
            emoji: this.emoji,
            winners: this.winners,
            max: this.max,
            requirements: {
                boost: this.requirements.boost,
                verifiedDeveloper: this.requirements.verifiedDeveloper,
            },
            disabled: this.disabled,
            type: this.type
        };
    }

    /**
     * Check if member have developer requirement to win this role.
     * @param {GuildMember} member - The member to check.
     * @return {Promise<boolean>}
     */
    async checkDeveloperRequirement(member) {
        return new Promise(async (resolve) => {
            const flags = await member.user.fetchFlags();
            const isVerifiedDeveloper = flags.has('VERIFIED_DEVELOPER');
            if (this.requirements.verifiedDeveloper) return resolve(isVerifiedDeveloper);
            return resolve(true);
        });
    }

    /**
     * Check if member have boost requirement to win this role.
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
            type: json.type
        });
    }

    /**
     * @private
     */
    __handleDeprecation(){
        /**
         * @since 1.7.9
         */
        if(this.toggle && this.type !== ReactionRoleType.TOGGLE) this.type = ReactionRoleType.TOGGLE;
        else if(this.type === ReactionRoleType.UNKNOWN) this.type = ReactionRoleType.NORMAL;
    }
}

module.exports = {
    ReactionRole,
};
