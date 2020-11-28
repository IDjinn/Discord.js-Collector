/**
 * Reaction role manager events.
 * @typedef {Object} REACTIONROLE_EVENT
 * @property {string} REACTION_ROLE_ADD='reactionRoleAdd' - Triggered when a member won some role.
 * @property {string} REACTION_ROLE_REMOVE='reactionRoleRemove' - Triggered when a member lost some role.
 * @property {string} ALL_REACTIONS_REMOVE='allReactionsRemove' - Triggered when all reactions from message was removed.
 * @property {string} MISSING_REQUIREMENTS='missingRequirements' - Triggered when a member hasn't all requirements to win some role.
 * @property {string} READY='ready' - Triggered when reation role manager is ready.
 * @readonly
 */
const REACTIONROLE_EVENT = Object.freeze({
    REACTION_ROLE_ADD: 'reactionRoleAdd',
    REACTION_ROLE_REMOVE: 'reactionRoleRemove',
    ALL_REACTIONS_REMOVE: 'allReactionsRemove',
    MISSING_REQUIREMENTS: 'missingRequirements',
    READY: 'ready'
});

/**
 * Requirement type to win some role.
 * @typedef {Object} REQUIREMENT_TYPE
 * @property {string} BOOST - Need be a booster to win this role.
 * @property {string} VERIFIED_DEVELOPER - Need be a verified developer to win this role.
 * @readonly
 */
const REQUIREMENT_TYPE = Object.freeze({
    BOOST: 'BOOST',
    VERIFIED_DEVELOPER: 'VERIFIED_DEVELOPER',
});

/**
 * Reaction Role Type
 * @typedef {Object} REQUIREMENT_TYPE
 * @property {number} NORMAL - This role works like basic reaction role.
 * @property {number} TOGGLE - You can win only one role of all toggle roles in this message (like colors system)
 * @property {number} JUST_WIN - This role you'll only win, not lose.
 * @property {number} JUST_LOSE - This role you'll only lose, not win.
 * @property {number} REVERSED - This is reversed role. When react, you'll lose it, when you take off reaction you'll win it.
 * @readonly
 */
const REACTION_ROLE_TYPE = Object.freeze({
    UNKNOWN: -1,
    NORMAL: 0,
    TOGGLE: 1,
    JUST_WIN: 2,
    JUST_LOSE: 3,
    REVERSED: 4
});

const ACTION_TYPE = Object.freeze({
    UNKNOWN: 0,
    GIVE: 1,
    TAKE: 2
});

const isValidReactionRoleType = (number) => !isNaN(number) && (number >= REACTION_ROLE_TYPE.NORMAL || number <= REACTION_ROLE_TYPE.REVERSED);

module.exports = {
    REQUIREMENT_TYPE,
    REACTIONROLE_EVENT,
    REACTION_ROLE_TYPE,
    ACTION_TYPE,
    isValidReactionRoleType,
};
