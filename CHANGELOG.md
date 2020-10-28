
---
# CHANGELOG - V1.6.3-4

• Types: fix types imported (MessageCollector and ReactionCollector, CollectorOptions) from Discord.js

---
# CHANGELOG - V1.6.2

• Reaction Role Manager: Fix TypeError: messageReactionsRoles.map is not a function

---
# CHANGELOG - V1.6.1

• Reaction Role Manager: Fix error if client param is class extends client

---
# CHANGELOG - V1.6.0

• Reaction Paginator is working now, with more emojis (Soon it will be possible use custom emojis!)

---
# CHANGELOG - V1.5.5

• Reaction Role Manager\
    - `store` setting in constructor was removed (use storage instead).\
    - `addRole()` is renamed to `createReactionRole()`.\
    - `deleteRole()` is renamed to `deleteReactionRole()`.\
    - `storage()` now is public to update reaction roles.\
• Messages collector\
    - `max` messages in  `question()` is default Infinity now.\
•  `findRecursively()`\
    - now it's possible find items with a `value`.\
• Fix types, typos and improved documentation.

---
# CHANGELOG - V1.5.4

• Improve documentation\
• Added requierements to reaction roles: booster or verified developer\
• Fixed types\
• New event in reaction roles manager: missingRequirements

---
# CHANGELOG - V1.5.32

• Added JSDocs support, fix types.

---
# CHANGELOG - V1.5.31

• Remove deprecated funcions in reaction role manager

---
# CHANGELOG - V1.5.3

• Added handle delete events in reaction role manager

---
# CHANGELOG - V1.5.2

• Fix some erros in reactions roles setup (toggled roles)\
• Fix toggled roles when user react on message (now the system use timeout to check roles, prevent overflow)

---
# CHANGELOG - V1.5.0

• Fix some erros in reactions roles setup\
• Added new mode to reactions roles: Toggled roles. When react and role is toggled role, the user will keep only one of these message roles.


---
# CHANGELOG - V1.4.4

• Fix max counter in reaction role manager, before this version this number was inc and dec, when reaction add/remove.\
• Fix bots can win roles while reaction role manager boot\
• Improve debug logs in reaction role manager\
• Added support to mongodb (lib mongoose) in reaction role manager

---
# CHANGELOG - V1.4.3

• Fix unexpected token in Constants.js

---
# CHANGELOG - V1.4.2

• Fix typings

---
# CHANGELOG - V1.4.1

• Reactions arrays now is object, key value with key is Emoji and value is function when user react.\
• Now you can give more params to react functions, all ...args given in question(options, ...args) for e.g.g will be available in reactions functions after default params.\
• Improve examples in docs, improve [README.md](./README.md)\
• Fix typings\
• Reactions roles will emit events when user win/lose role or all reactions was removed from message.

---
# CHANGELOG - V1.4.0

• Refractor reaction menu, more options and new menu Controller, to stop, reset timer, back and go to pages.

---
# CHANGELOG - V1.3.7

• Fix format in README.md

---
# CHANGELOG - V1.3.6

• Fix invalid main file.

---
# CHANGELOG - V1.3.5

• Added onMessage and onReact in menu pages.

---
# CHANGELOG - V1.3.4

• Fixed types, changed how react menu works, now suport for multiple pages and subpages.\
• Improve README with links and Sumary.

---
# CHANGELOG - V1.3.0

• Added Reaction Role system, now you can create easy reaction roles with a internal storage, if your bot shutdown, all users will won the roles when it's up!

---
# CHANGELOG - V1.2.0

• New functions to create reactions menu, you can use with `ReactionCollector.menu(options)`

---
# CHANGELOG - V1.1.0

• Now collectors work in DM Channels, but cannot delete user reaction/message\
• [BETA] Added ReactionRoleManager, easy mode to create reactions roles with storage system, when finish i will share examples and gifs explaining how this work.
