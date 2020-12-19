const { ReactionRoleManager } = require('discord.js-collector')
const { Client } = require("discord.js");
const client = new Client();

const reactionRoleManager = new ReactionRoleManager(client, {
    storage: true, // Enable reaction role store in a Json file
    path: __dirname + '/roles.json', // Where will save the roles if store is enabled
    mongoDbLink: 'url mongoose link' // See here to see how setup mongoose: https://github.com/IDjinn/Discord.js-Collector/blob/master/examples/reaction-role-manager/Note.md
});

client.on("ready", () => {
    console.log("ready")
});

// When is ready, reation role manager will emit this event
reactionRoleManager.on('ready', () => {
    console.log('Reaction Role Manager is ready!');
});

// When user react and win role, will trigger this event
reactionRoleManager.on('reactionRoleAdd', (member, role) => {
    console.log(member.displayName + ' won the role' + role.name)
});

// When user remove reaction and lose role, will trigger this event
reactionRoleManager.on('reactionRoleRemove', (member, role) => {
    console.log(member.displayName + ' lose the role' + role.name)
});

// When someone removed all reactions from message
reactionRoleManager.on('allReactionsRemove', (message) => {
    console.log(`All reactions from message ${message.id} was removed, all roles was taken and reactions roles deleted.`)
});

// If member doesn't have all requirements, this event is triggered.
reactionRoleManager.on('missingRequirements', (type, member, reactionRole) => {
    console.log(`Member '${member.id}' will not win role '${reactionRole.role}', because him hasn't requirement ${type}`);
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
            emoji
        });
        message.reply('Done').then(m => m.delete({ timeout: 500 }));
    }
    else if (message.content.startsWith('>deleteReactionRole')){
        const emoji = args[0];
        if (!emoji)
            return message.reply('You need use a valid emoji.').then(m => m.delete({ timeout: 1000 }));

        const msg = await message.channel.messages.fetch(args[1]);
        if (!msg)
            return message.reply('Message not found! Wtf...').then(m => m.delete({ timeout: 1000 }));

        await reactionRoleManager.deleteReactionRole({message: msg, emoji});
    }
});

client.login("Token");
