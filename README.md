# Discord.js-colelctor

Library to easily create message collector and reactions on discord, with customization ways

---

## Simple reaction collector

To use in multiple actions, react and then execute one thing.

![Question Gif](./assets/question.gif)

```js
const {ReactionCollector} = require('discord.js-collector');

const botMessage = await message.channel.send('Simple choice yes/no...');
ReactionCollector.question({
    botMessage,
    user: message,
    onReact: [
        async (botMessage) => await botMessage.channel.send("You've choice yes."),
        async (botMessage) => await botMessage.channel.send("You've choice no."),
    ]
});
```

### Options param
`ReactionCollector.question(options);`

```js
{
    botMessage: Message // Message sent from bot.
    user: UserResolvable // User who will react, must be User | Snowflake | Message | GuildMember.
    reactions?: Array<EmojiResolvable> // List of emojis will use to create reaction question.
    onReact?: Array<Function> // When user click on reaction, will trigger respective funcion, in order by reaction list.
    deleteReaction?: boolean // Default true, when user react if it's enabled will remove user reaction.
    deleteAllReactionsWhenCollectorEnd?: boolean // Default true, when collector end, if it's enabled will remove all reactions in botMessage.
}
```

---

## Simple true/false reaction collector

To use in `if` statements, the asynchronous reaction collector returning Promise <boolean> is more practical



```js
const {ReactionCollector} = require('discord.js-collector');

const botMessage = await message.channel.send('Simple choice yes/no...');
const options = { botMessage, user: message};
if(await ReactionCollector.asyncQuestion(options)){
    // User reacted yes
}
else{
    // User reacted no
}
```

## Embeds pagination

Easier paginator embeds, with back/skip reaction to change current page.

```js
const botMessage = await message.channel.send('Simple paginator...');
ReactionCollector.paginator({
    botMessage,
    user: message,
    pages: [
        new MessageEmbed({ description: 'First page content...' }),
        new MessageEmbed({ description: 'Second page content...' })
    ]
});
```