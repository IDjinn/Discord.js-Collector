const { ReactionCollector } = require('discord.js-collector');
const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

// You can create easily yes/no questions to run funcions
client.on("message", async (message) => {
    if (message.content.startsWith('>delete-channel')) {
        const botMessage = await message.reply('Are you sure? This action canno\'t be undo!');
        if (await ReactionCollector.yesNoQuestion({ botMessage, user: message.author })) {
            await message.channel.delete();
            await message.reply('Done!');
        }
        else {
            await message.reply('Ok, operation cancelled!');
        }
    }
});

client.login("Token");