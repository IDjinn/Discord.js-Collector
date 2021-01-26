import Discord from 'discord.js';
import { Message } from 'discord.js';
import {  MessageCollector } from './Index';

const client = new Discord.Client();
let id = '';
client.on('message', async message => {
    if(message.author.bot) return;
    if(id) return;
    id = message.author.id;

    await message.reply('test async reply');/*
    MessageCollector.createQuestion({
        onMessage: (msg: Message) => {
            message.reply('yey');
        },
        channel: message.channel,
        users: [message.author],
        max: 3
    })*/

    const collector = MessageCollector.createAsyncQuestion({
        channel: message.channel,
        users: [message.author],
        max: 3
    });/*
await new Promise(resolve =>{
    console.log('resolving...')
})
console.log('resolved')
    for await (const msg of collector){
        await message.reply('your msg: ' + msg.content);
    }*/
    const msg = await collector.first;
    await message.reply('your msg: ' + msg!.content);
});


client.login('NjM2NjY5MDM2NDMxNjcxMzEz.XbC-Pw.0Waeu4eNDLvaNqPluBFdRgWoDrA')