const { ReactionCollector } = require('discord.js-collector')
const { Client, MessageEmbed } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

const pages = {
    '📥': {
        embed: {
            title: 'Welcome Join Config',
            description: `React below embed to configure channel or message of welcome settings.\n\n📜 Channel settings\n📢 Message settings`,
        },
        reactions: ['📜', '📢'],
        pages: {
            '📜': {
                backEmoji: '🔙',
                embed: {
                    description: 'Please mention or use channel id to set as welcome channel.'
                },
                onMessage: async (controller, message) => {
                    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(message.content);
                    if (!channel)
                        return message.reply('🚫 | You\'ve forgot mention a channel or use their id.').then((m) => m.delete({ timeout: 3000 }));

                    // Do what you want here, like set it on database...
                    return await message.reply(`✅ | Success! You've settled welcome channel as ${channel}.`).then(m => m.delete({ timeout: 3000 }));
                }
            },
            '📢': {
                backEmoji: '🔙',
                embed: {
                    description: 'Make the message used when a member join in the server.',
                },
                onMessage: async (controller, message) => {
                    // Do what you want here, like set it on database..
                    return await message.reply('✅ | Success!').then(m => m.delete({ timeout: 3000 }));
                }
            }
        }
    },
};

client.on("message", async (message) => {
    if (message.content.startsWith('>config')) {
        const embed = new MessageEmbed()
            .setTitle('Server Settings')
            .setDescription('React below to configure modules in this server.\n\n📥 Welcome module')
        const botMessage = await message.reply(embed);
        ReactionCollector.menu({ botMessage, user: message.author, pages });
    }
});

client.login("Token");