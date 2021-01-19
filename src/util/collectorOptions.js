const { ChannelResolvable, UserResolvable } = require("discord.js");
//Just for type export
/** @type {CollectorOptions} */
let CollectorOptions;
/** @type {MessageCollectorOptions} */
let MessageCollectorOptions;

/**
 * @typedef {object} CollectorOptions 
 * @property {ChannelResolvable} channel - Channel to collect messages.
 * @property {UserResolvable} user - User who will have collected messages.
 * @property {number} [max=1] - Max messages to collect.
 * @property {number} [time=30000] - Max collector time.
 */

/**
 * @typedef {CollectorOptions} MessageCollectorOptions 
 * @property {Function} onMessage - Trigger each collected message.
 */


module.exports = {
    CollectorOptions,
    MessageCollectorOptions
}