
const { MessageCollector } = require("discord.js-collector");

const { Client } = require("discord.js");
const client = new Client();
client.on("ready", () => {
    console.log("ready");
});

client.on("message", async (message) => {
    if (message.content.startsWith('>question')) {
        const botMessage = await message.channel.send("Awaiting a message");
        MessageCollector.question({
            botMessage,
            user: message.author.id,
            onMessage: async (botMessage, message) => { // Every message sent by user will trigger this function.
                await message.delete();
                await botMessage.channel.send(`Your message: '${message.content}'`);
            }
        }); 
    }
});

client.login("Token");