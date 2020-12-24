/**
 * Reaction role manager events.
 * @typedef {Object} ReactionRoleEvent
 * @property {string} REACTION_ROLE_ADD='reactionRoleAdd' - Triggered when a member won some role.
 * @property {string} REACTION_ROLE_REMOVE='reactionRoleRemove' - Triggered when a member lost some role.
 * @property {string} ALL_REACTIONS_REMOVE='allReactionsRemove' - Triggered when all reactions from message was removed.
 * @property {string} MISSING_REQUIREMENTS='missingRequirements' - Triggered when a member hasn't all requirements to win some role.
 * @property {string} MISSING_PERMISSIONS='missingPermissions' - Triggered when the bot doesn't have permissions to manage this role.
 * @property {string} DEBUG='debug' - Triggered for debug messages.
 * @property {string} READY='ready' - Triggered when reation role manager is ready.
 * @readonly
 */
const ReactionRoleEvent = Object.freeze({
    REACTION_ROLE_ADD: 'reactionRoleAdd',
    REACTION_ROLE_REMOVE: 'reactionRoleRemove',
    ALL_REACTIONS_REMOVE: 'allReactionsRemove',
    MISSING_REQUIREMENTS: 'missingRequirements',
    MISSING_PERMISSIONS: 'missingPermissions',
    DEBUG: 'debug',
    READY: 'ready'
});

/**
 * Requirement type to win some role.
 * @typedef {Object} RequirementType
 * @property {number} [UNKNOWN=0]
 * @property {number} [BOOST=1] - Need be a booster to win this role.
 * @property {number} [VERIFIED_DEVELOPER=2] - Need be a verified developer to win this role.
 * @property {number} [PERMISSION=3] - Need has some permissions to win this role.
 * @property {number} [ROLES=4] - Need has all allow listed roles and hasn't all denied listed roles.
 * @property {number} [USERS=5] - Need be inluded in allow list and not included in deny list to win this role.
 * @readonly
 */
const RequirementType = Object.freeze({
    UNKNOWN: 0,
    BOOST: 1,
    VERIFIED_DEVELOPER: 2,
    PERMISSION: 3,
    ROLES: 4,
    USERS: 5,
});

/**
 * Reaction Role Type
 * @typedef {object} ReactionRoleType
 * @property {number} NORMAL - This role works like basic reaction role.
 * @property {number} TOGGLE - You can win only one role of all toggle roles in this message (like colors system)
 * @property {number} JUST_WIN - This role you'll only win, not lose.
 * @property {number} JUST_LOSE - This role you'll only lose, not win.
 * @property {number} REVERSED - This is reversed role. When react, you'll lose it, when you take off reaction you'll win it.
 * @readonly
 */
const ReactionRoleType = Object.freeze({
    UNKNOWN: 0,
    NORMAL: 1,
    TOGGLE: 2,
    JUST_WIN: 3,
    JUST_LOSE: 4,
    REVERSED: 5
});

/**
 * Reaction action Type
 * @typedef {object} ActionType
 * @property {number} UNKNOWN - Unknown type of this reaction action.
 * @property {number} GIVE - The member will win some reaction role.
 * @property {number} TAKE - The member will lose some reaction role.
 * @readonly
 */
const ActionType = Object.freeze({
    UNKNOWN: 0,
    GIVE: 1,
    TAKE: 2
});

/**
 * Check if a number is valid reaction role type.
 * @param {ReactionRoleType} number - Type of reaction role to check if it's valid.
 * @return {boolean}
 */
const isValidReactionRoleType = (number) => !isNaN(number) && (number >= ReactionRoleType.NORMAL && number <= ReactionRoleType.REVERSED);

module.exports = {
    RequirementType,
    ReactionRoleEvent,
    ReactionRoleType,
    ActionType,
    isValidReactionRoleType,
};
