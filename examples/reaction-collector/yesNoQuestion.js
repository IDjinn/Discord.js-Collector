const { ReactionCollector } = require('../../src/index')
const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

// You can create easily yes/no questions to run funcions
client.on("message", async (message) => {
    if (message.content.startsWith('>delete-channel')) {
        const botMessage = await message.reply('Are you sure? This action canno\'t be undo!');
        if(await ReactionCollector.yesNoQuestion({botMessage, user: message.author })){
           message.channel.delete();
        }
        else{
            message.reply('Ok, operation cancelled!');
        }
    }
});

client.login("Token");