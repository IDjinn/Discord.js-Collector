const { ReactionRoleManager } = require('discord.js-collector')
const { Client } = require("discord.js");
const client = new Client();
const reactionRoleManager = new ReactionRoleManager(client, {
    store: true, // Enable reaction role store in a Json file
    refreshOnBoot: true, // When the bot logs in to discord, it will give/take users who have reacted/removed the reaction while bot was offline
    path: __dirname + '/roles.json' // Where will save the roles if store is enabled
});

client.on("ready", () => {
    console.log("ready")
});

// When user react and win role, will trigger this event
reactionRoleManager.on('reactionRoleAdd', (member, role) => {
    console.log(member.displayName + ' won the role' + role.name)
});

// When user remove reaction and lose role, will trigger this event
reactionRoleManager.on('reactionRoleRemove', (member, role) => {
    console.log(member.displayName + ' lose the role' + role.name)
});

client.on("message", async (message) => {
    const client = message.client;
    const args = message.content.split(' ');
    args.shift(); // Ignore >createReactionRole
    // Example
    // >createReactionRole @role :emoji: MessageId
    if (message.content.startsWith('>createReactionRole')) {
        const role = message.mentions.roles.first();
        if(!role)
            return message.reply('You need mention a role').then(m => m.delete({timeout: 1_000}));

        const emoji = client.emojis.resolveIdentifier(args.slice(1)[0])
        if(!emoji)
            return message.reply('You need use a valid emoji.').then(m => m.delete({timeout: 1_000}));

        const msg = await message.channel.messages.fetch(args.slice(2)[0] || message.id);
        if(!role)
            return message.reply('Message not found! Wtf...').then(m => m.delete({timeout: 1_000}));

        reactionRoleManager.addRole({
            message: msg,
            role,
            emoji
        });
        message.reply('Done').then(m => m.delete({timeout: 500}));
        message.delete()
    }
});

client.login("Token");
