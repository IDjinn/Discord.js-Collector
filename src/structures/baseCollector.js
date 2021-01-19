const { CollectorOptions } = require('../util/collectorOptions');
const CollectorValidator = require('./collectorValidator');
const {Client,UserResolvable} = require('discord.js');

module.exports = class BaseCollector {
    constructor(options, validator) {
        /**
         * @type {CollectorOptions}
         */
        this.options = options;
        /**
         * @type {CollectorValidator}
         */
        this.validator = validator;
        /**
         * Timestamps until this collector expires
         * @readonly
         * @type {number} 
         */
        this.expireTimestamp = -1;

        /** 
         * @private
         * @type {boolean}
         */
        this._isReady = false;

        /** 
         * @private
         * @type {boolean}
         */
        this._isCollecting = false;
    }

    /**
     * Check if setup is ready to start collect
     */
    isReady() {
        return this._isReady && this.isNotExpired();
    }

    /**
     * Check if setup is collecting
     */
    isCollecting() {
        return this._isCollecting && this.isReady();
    }

    /**
     * Check if this collector is expired
     * @returns {boolean}
     */
    isExpired() {
        return Date.now() > this.expireTimestamp;
    }

    /**
     * Check if this collector is not expired
     * @returns {boolean}
     */
    isNotExpired() {
        return !this.isExpired();
    }

    /**
     * Start the collector
     */
    start(){
        this._isCollecting = true;
    }

    /**
     * Stop the collector
     */
    stop(){
        this._isCollecting = false;
    }   

    /**
     * Check if incoming event object is valid match with this collector
     * @param {Client} client 
     * @param {UserResolvable} userResolvable - object to check if this match
     */
    match(client, userResolvable){
        const user = client.users.resolve(userResolvable);
        if(!user) return false;
        return this.options.user.id === user.id;
    }

    /**
     * Triggered when is collected
     * @param  {...any} args 
     */
    onCollect(...args){

    }

    /**
     * Init collector
     * @param {Client} client 
     */
    async init(client){
        await this.validator.validate(client);
        this.expireTimestamp = this.options.time + Date.now();
        this._isReady = true;
    }
}