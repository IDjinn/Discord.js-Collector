const { ReactionCollector } = require('discord.js-collector')
const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

// You can create easily yes/no questions to run funcions
client.on("message", async (message) => {
    if (message.content.startsWith('>delete-channel')) {
        const botMessage = await message.reply('Are you sure? This action canno\'t be undo!');
        ReactionCollector.question({
            botMessage,
            user: message.author,
            reactions: {
                '✅': async () => await message.channel.delete(),
                '❌': async () => await message.reply('Ok, operation cancelled!'),
            }
        });
    }
});

// Or you can create choises to execute when user pick his choise
client.on("message", async (message) => {
    if (message.content.startsWith('>poll')) {
        const botMessage = await message.reply('Some question to create poll here');
        ReactionCollector.question({
            botMessage,
            user: message.author,
            reactions: {
                '👍': async (reaction) => await message.react(reaction.emoji.name), // Your custom function here.
                '👎': async (reaction) => await message.react(reaction.emoji.name),
                '🕒': async (reaction) => await message.react(reaction.emoji.name)
            }
        });
    }
});

client.login("Token");