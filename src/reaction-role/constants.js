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

module.exports = {
    REQUIREMENT_TYPE,
    REACTIONROLE_EVENT,
};
