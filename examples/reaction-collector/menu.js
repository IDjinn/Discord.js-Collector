const { ReactionCollector } = require('../src/index')
const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

const pages = {
    '✅': {
        content: 'Hello world!',
        reactions: ['?'], // Reactions to acess next sub-page
        embed: {
            description: 'First page content, you can edit and put your custom embed.'
        },
        pages: { // Exemple sub-pages
            '❓': {
                content: '?',
                embed: {
                    description: 'You\'ve found the secret page.'
                }
            }
        }
    },
    '❌': {
        content: 'What\'s happened?',
        embed: {
            description: 'You\'ve clicked in ❌ emoji.'
        }
    }
}

client.on("message", async (message) => {
    if (message.content.startsWith('>createReactionMenu')) {
        const botMessage = await message.reply('Reaction menu');
        ReactionCollector.menu({ botMessage, user: message, pages });
    }
});

client.login("Token");