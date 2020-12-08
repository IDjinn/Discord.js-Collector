const { ReactionCollector } = require('discord.js-collector')
const { Client, MessageEmbed } = require("discord.js");
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
                new MessageEmbed()
                    .setTitle('Util')
                    .addField('Ping', 'Bot ping latency')
                    .addField('Botinfo', 'Ban one member from server')
                    .addField('Avatar', 'Show a user avatar'),
                new MessageEmbed()
                    .setTitle('Economy')
                    .addField('Daily', 'Pick up daily reward')
                    .addField('Pay', 'Pay some amount to other user'),
                new MessageEmbed()
                    .setTitle('Administration')
                    .addField('Autorole', 'Configure autorole in this server')
                    .addField('Prefix', 'Change bot prefix')
            ],
            collectorOptions: {
                time: 60000
            }
        });
    }
});

client.login('Token');