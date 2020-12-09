const { ReactionRoleManager, ReactionRoleType, ReactionCollector } = require('../src')
const { Client, Constants, WebhookClient, MessageEmbed } = require("discord.js");
const client = new Client({partials: ['REACTION', 'MESSAGE', 'GUILD_MEMBER']});
require('dotenv').config({ path: __dirname + '/process.env' });
const app = require('express')();
const server = require('http').createServer(app);
const axios = require('axios')

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

client.log =async (embed) => {
    const channel = client.channels.cache.get(process.env.LOG_CHANNEL);
    if (channel) await channel.send(embed);
}


const reactionRoleManager = new ReactionRoleManager(client, {
    storage: true, // Enable reaction role store in a Json file
    path: __dirname + '/roles.json', // Where will save the roles if store is enabled,
    debug: true,
    disabledProperty: false
});

client.on("ready", () => {
    console.log("ready")
});

reactionRoleManager.on('ready', () => {
    const embed = new MessageEmbed()
        .setTitle('Ready')
        .setDescription('Reaction Role Manager is ready.')
        .setTimestamp();
    client.log(embed);
});

// When user react and win role, will trigger this event
reactionRoleManager.on('reactionRoleAdd', (member, role) => {
    const embed = new MessageEmbed()
        .setTitle('Role Win')
        .setDescription(`\`${member.displayName}\` win the role '${role.name}'`)
        .setTimestamp();
    client.log(embed);
});

// When user remove reaction and lose role, will trigger this event
reactionRoleManager.on('reactionRoleRemove', (member, role) => {
    const embed = new MessageEmbed()
        .setTitle('Role Lost')
        .setDescription(`\`${member.displayName}\` lost the role '${role.name}'`)
        .setTimestamp();
    client.log(embed);
});

// When someone removed all reactions from message
reactionRoleManager.on('allReactionsRemove', (message) => {
    const embed = new MessageEmbed()
        .setTitle('Reactions Removed')
        .setDescription(`All reactions of message \`${message.id}\` was removed, so everone who reacted on it lost their roles.`)
        .setTimestamp();
    client.log(embed);
});

// If member doesn't have all requirements, this event is triggered.
reactionRoleManager.on('missingRequirements', (type, member, reactionRole) => {
    const embed = new MessageEmbed()
        .setTitle('Missing Requierements')
        .setDescription(`Member \`${member.displayName}\` missing requirement ${type}, he will not win the role '${reactionRole.id}'`)
        .setTimestamp();
    client.log(embed);
});

client.on("message", async (message) => {
    const client = message.client;
    const args = message.content.split(' ').slice(1);
    // Example
    // >createReactionRole @role :emoji: MessageId
    if (message.content.startsWith('>createReactionRole')) {
        const role = message.mentions.roles.first();
        if (!role)
            return message.reply('You need mention a role').then(m => m.delete({ timeout: 1000 }));

        const emoji = args[1];
        if (!emoji)
            return message.reply('You need use a valid emoji.').then(m => m.delete({ timeout: 1000 }));

        const msg = await message.channel.messages.fetch(args[2] || message.id);
        if (!role)
            return message.reply('Message not found! Wtf...').then(m => m.delete({ timeout: 1000 }));

        reactionRoleManager.createReactionRole({
            message: msg,
            roles: [role],
            emoji,
            type: ReactionRoleType.NORMAL // It's optional, normal by default
        });
        message.reply('Done').then(m => m.delete({ timeout: 500 }));
        message.delete().catch();
    }
    else if (message.content.startsWith('>eval')) {
        if (message.author.id !== '376460601909706773') return;
        try {
            const code = args.join(" ");
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            message.channel.send(clean(evaled), { code: "xl" });
        } catch (err) {
            message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
    }
    else if (message.content.startsWith('>clear')) {
        const amount = parseInt(args[0]);
        const msg = message;
        console.clear();
        if (!amount) return msg.reply('You haven\'t given an amount of messages which should be deleted!'); // Checks if the `amount` parameter is given
        if (isNaN(amount)) return msg.reply('The amount parameter isn`t a number!'); // Checks if the `amount` parameter is a number. If not, the command throws an error

        if (amount > 100) return msg.reply('You can`t delete more than 100 messages at once!'); // Checks if the `amount` integer is bigger than 100
        if (amount < 1) return msg.reply('You have to delete at least 1 message!'); // Checks if the `amount` integer is smaller than 1

        await msg.channel.messages.fetch({ limit: amount }).then(messages => { // Fetches the messages
            msg.channel.bulkDelete(messages // Bulk deletes all messages that have been fetched and are not older than 14 days (due to the Discord API)
            )
        });
    }
});

client.login(process.env.TOKEN);

if (process.env.GET_URL) {
    app.get('/', (_, res) => res.sendStatus(204));
    client.setInterval(() => {
        try {
            axios.get(process.env.GET_URL);
        } catch { }
    }, 5000);
    server.listen(process.env.PORT || 3000);
}