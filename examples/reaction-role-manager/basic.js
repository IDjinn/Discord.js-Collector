const { ReactionRoleManager } = require('discord.js-collector')
const { Client } = require("discord.js");
const client = new Client();

client.on("ready", () => {
    console.log("ready")
    client.reactionRoleManager = new ReactionRoleManager(client, { path: __dirname + '/roles.json' });
});


client.on("message", async (message) => {
    if (message.content.startsWith('>createReactionRole')) {
        // You can create a command to add roles in message, but you will need fetch it.
        if (message.mentions.roles.size == 0)
            return await message.reply('You need mention a role.');

        const role = message.mentions.roles.first();
        client.reactionRoleManager.addRole({
            message,
            role,
            emoji: '731949791352717333'
        });
    }
});

client.login("Token");
