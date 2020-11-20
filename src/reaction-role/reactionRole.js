const { GuildMember } = require('discord.js');
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
        this.max = isNaN(max) ? Number.MAX_SAFE_INTEGER : Number(max);
        /**
         * Is it toggled role?
         * @type {number}
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
            max:
                this.max > Number.MAX_SAFE_INTEGER
                    ? Number.MAX_SAFE_INTEGER
                    : this.max,
            toggle: this.toggle,
            requirements: {
                boost: this.requirements.boost,
                verifiedDeveloper: this.requirements.verifiedDeveloper,
            },
            disabled: this.disabled,
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
        });
    }
}

module.exports = {
    ReactionRole,
};
