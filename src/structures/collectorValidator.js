const { CollectorOptions } = require('../util/collectorOptions');
const { Client, Channel, User, TextBasedChannel, GuildChannel } = require('discord.js');

module.exports = class CollectorValidator {
    /**
     * @param {CollectorOptions} options 
     */
    constructor(options) {
        this.options = options;
        this._isValid = null;

        this.setDefaultOptions();
    }

    setDefaultOptions() {
        if (!this.options.time) this.options.time = 30000; // 30 seconds
        if (!this.options.max) this.options.max = 1;
    }

    /**
     * Check if this collector has valid setup
     * @returns {boolean}
     */
    isValid(){
        if(typeof this._isValid === 'boolean') return this._isValid;
        return false;
    }

    /**
     * @param {Client} client 
     */
    resolve(client) {
        return new Promise((resolve, reject) => {
            const channel = client.channels.resolve(this.options.channel);
            if (!channel) return reject(new Error('Channel cannot be resolved. Check if this channel is a valid Id | Channel object.'));

            const user = client.users.resolve(this.options.user);
            if(!user) return reject(new Error('User cannot be resolved. Check if this user is a valid Id | User object.'))
            
            if (this.options.max < 1) return reject(new Error('Max must be between 0-Infinity positive!'));
            if (this.options.time < 1) return reject(new Error('Time must be greater than 0, in milliseconds!'));

            return resolve({
                channel,
                user,
                time: this.options.time,
                max: this.options.max,
            })
        });
    }

    /**
     * @param {Client} client 
     * @returns {Promise<boolean>} isValid
     */
    validate(client) {
        return new Promise(async(resolve, reject) => {
            const resolved = await this.resolve(client).catch(reject);
            const isGuildContext = ['text', 'news', 'store'].includes(resolved.channel.type);
            if (isGuildContext && resolved.channel instanceof TextBasedChannel(GuildChannel)) {
                const channel = resolved.channel;
                const myselfMember = channel.guild.me;

                if (!channel.permissionsFor(myselfMember).has('VIEW_CHANNEL')) return reject(new Error(`I don't have permissions to see channel '${channel.id}'.`));
            }

            this._isValid = true;
            this.options = {
                ...this.options,
                ...resolved
            }
            return resolve(true);
        });
    }
}