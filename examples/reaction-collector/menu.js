const { ReactionCollector } = require('discord.js-collector')
const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

const pages = {
    '✅': {
        id: 'first-page', // Page id is used to navigate cross pages.
        content: 'Hello world!',
        embed: { title: "What's happening?", description: "This message is a reaction menu example." },
        reactions: ['?'], // Reactions to acess next sub-page
        onMessage: (controller, message) => { // You can receive message inside every page to make cool things!
            if (message.startsWith('>hi')) {
                message.reply('Hello!')
                controller.goTo('second-page'); // With controller, you can go to other pages from menu, back to last page and others funcions...
            }
        },
        pages: { // Exemple sub-pages
            '❓': {
                id: 'secret-page',
                content: '?',
                embed: {
                    description: 'You\'ve found the secret page.'
                },
                onMessage: (controller) => {
                    controller.stop(); // Stop collector
                }
            }
        }
    },
    '❌': {
        id: 'second-page',
        content: 'You can acess others pages and sub-pages!',
        embed: {
            description: 'Type ">goTo secret-page"!'
        },
        onMessage: (controller, message) => {
            if (message.content.startsWith('>goTo secret-page')) {
                controller.goTo('secret-page');
            }
        }
    }
}

client.on("message", async (message) => {
    if (message.content.startsWith('>help')) {
        const botMessage = await message.reply('Reaction menu');
        ReactionCollector.menu({ botMessage, user: message.author, pages });
    }
});

client.login("Token");