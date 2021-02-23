![downloads-npm-total](https://img.shields.io/npm/dt/discord.js-collector) ![downloads-npm-week](https://img.shields.io/npm/dw/discord.js-collector?color=%234c00ff)  ![dependencies-deprecated-status](https://img.shields.io/david/IDjinn/Discord.js-Collector) ![npm-version](https://img.shields.io/npm/v/discord.js-collector)
# Discord.js-collector

Library to easily create messages collector, reactions collector and reactions role on discord.js v12, with customization ways.

---

## Sumary
◘ Reactions Collectors:\
| [Reaction Role](#reaction-role)\
| [Menu](#reaction-menu)\
| [Question](#simple-reaction-collector)\
| [Yes/No Question](#simple-boolean-reaction-collector)\
| [Embeds Paginator](#embeds-pagination)\
◘ Messages Collectors:\
| [Question](#simple-messages-collector)\
| [Async Question](#async-message-collector)\
◘ Examples\
| [Reaction Role Manager](./examples/reaction-role-manager/basic.js)\
| [Reaction Menu](./examples/reaction-collector/menu.js)\
◘ Others\
| [Changelog](CHANGELOG.md)\
| [Breaking Changes](./BREAKING_CHANGES.md)


## Warning
Please update your version to: ^1.8.0, multiple bugfixes and vulnerabilities.\
See all [Breaking Changes](./BREAKING_CHANGES.md).

## Discord Server

For faster support, please join the discord server [invite here](https://discord.gg/BK5FwGt7YX)

## Documentation

See the documentation of last version [here](https://idjinn.github.io/Discord.js-Collector/)

---

## Reaction role

You can create reactions roles, with amazing functions:\
| • If your bot turns off, when it turns on all users reacted in messages will get the role.\
| • If your bot turns off, if any user remove reaction, when the bot turns on it will remove the role from him/her.\
| • You can store the roles in a JSON file and migrate the reaction role data.\
| • You can limit max roles given by the bot, for example set a limit of 10 roles.\
| • Toggled roles: Limit one of these roles to use (Util for colors reaction roles, only get one of roles)\
| • Requirements: Limit roles for boosters only or discord developers only!\
| • Just Win: you can configure a role to just give to member if he reacts on it!\
| • Just Lose: you can configure a role to just take from member if he reacts on it!\
| • Reversed: When reacted on it, member will lose the role. When take off reaction of it, member will win the role.


![Reaction Role Gif](./assets/reactionRoles.gif)

You can find the code example [here](./examples/reaction-role-manager/basic.js)

---

## Reaction menu

To create a reaction menu with multiple pages.

![Menu Gif](./assets/reactMenu.gif)

You can find the code example [here](./examples/reaction-collector/menu.js)


## Simple reactions collector

To use in multiple actions, react and then trigger one function to do things.

![Question Gif](./assets/reactQuestion.gif)

## Simple boolean reactions collector

To use in `if` statements, the asynchronous reactions collector returning Promise <boolean> is more practical

![Question Gif](./assets/reactYesNoQuestion.gif)

## Embeds pagination
Example [here](./examples/reaction-collector/paginator.js)

Easier paginator embeds, with back/skip reaction to change current page.

![Question Gif](./assets/reactPaginator.gif)

You can find this code example [here](./examples/reaction-collector/paginator.js)

## Simple messages collector

Await for messages from user, and when a user sends a message the function will fire a trigger to do things. See exemple [here]

You can find the code example [here](./examples/message-collector/question.js)

![Question Gif](./assets/messageQuestion.gif)

## Async message collector

Await for messages from user, and when user send, it will return the user message as Promise<Message>.

![Question Gif](./assets/messageAsyncQuestion.gif)

```js
const { MessageCollector } = require("discord.js-collector");

const botMessage = await message.channel.send("Awaiting a message");
const userMessage = await MessageCollector.asyncQuestion({
  botMessage,
  user: message.author.id,
});
if (userMessage.content === "ping") {
  await message.channel.send("pong!");
}
```
