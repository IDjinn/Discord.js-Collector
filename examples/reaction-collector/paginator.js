const { ReactionCollector } = require('../../src/index')
const { Client, MessageEmbed} = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

// Paginate embeds, util for music queue list, simple lists like warn-list and etc.
client.on("message", async (message) => {
    if (message.content.startsWith('>help')) {
        const botMessage = await message.reply('Need help? Here list with all my commands!');
        ReactionCollector.paginator({
            botMessage,
            user: message.author,
            pages: [
                new MessageEmbed()
                .setTitle('Moderation')
                .addField('Kick', 'Kick one member from the server')
                .addField('Ban', 'Ban one member from server')
                .addField('Mute', 'Remove permissions from member to talk in chats while is muted')
                .addField('Clear', 'Clear messages from text channel'),
                new MessageEmbed({ title: 'We need make second page lol' })
            ]
        });
    }
});

client.login("NTAzMjM5MDU5Nzc1NDIyNDkx.W8tT5Q.HycGktYpNJ1Dhh4-QYp-zTdI-ZY");