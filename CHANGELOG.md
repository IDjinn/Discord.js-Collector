
---
# CHANGELOG - V1.8.8

Fix reaction paginator bug.

---
# CHANGELOG - V1.8.7

Reaction Role Manager: fix rr not deleted properly.

---
# CHANGELOG - V1.8.6

Reaction Role Manager: fix Unknown message error.

---
# CHANGELOG - V1.8.5

Reaction Collector: Fix custom emojis not working

---
# CHANGELOG - V1.8.4

Reaction Role Manager feature: new Requirements types! Now you can limit roles/users/permissions needed or denied to win some role.

---
# CHANGELOG - V1.8.3

Reaction Role Manager:\ 
    - Created debug event.\
    - Make the bot remove/not remove it's reaction when a reaction role is deleted.

---
# CHANGELOG - V1.8.2

Reaction Role Manager: fixed allReactionsRemove triggered whenever message with reactions was deleted

---
# CHANGELOG - V1.8.0

Reaction Role Manager: new role types.\
    - Normal: a normal reaction role.\
    - Toggle: toggle roles, like used in color system.\
    - Just Win: member will only win this role, not lose it.\
    - Just Lose: member will only lose this role, not win it.\
    - Reversed: when react on it, will lose the role, when take off reaction will win the role.

---
# CHANGELOG - V1.7.9

Reaction Role Manager: new feature: hooks!

---
# CHANGELOG - V1.7.8

Reaction Role Manager: partial support and fixed toggled roles take off non first reaction.

---
# CHANGELOG - V1.7.7

Reaction Role Manager:\
    - fix override timeout in toggled roles\
    - fix check requirements

Collectors: multiple configuration fixes

---
# CHANGELOG - V1.7.6

• Reaction Role Manager: delete reaction roles by message and emoji

---
# CHANGELOG - V1.7.5

• Reaction Role Manager: 
    - Fix reaction roles toggle
    - Added ready event and property
    - Fix roles setup

---
# CHANGELOG - V1.7.3

• Reaction Role Manager: fix roles.has is not a funcion

---
# CHANGELOG - V1.7.2

• Reaction Role Manager: fix toggled roles wasn't working

---
# CHANGELOG - V1.7.1

• Reaction Role Manager: fix error on setup

---
# CHANGELOG - V1.7.0

• Reaction Role Manager: disable property instead delete reaction role\
• Reaction Collector: now the collector will be passed with args

See [Breaking Changes](./BREAKING_CHANGES.md)

---
# CHANGELOG - V1.6.9

• Reaction Role Manager: Fix roles to give/take verification on turn on bot.

---
# CHANGELOG - V1.6.8

• Reaction Role Manager:\
    - Fix json storage\
    - Removed unecessary debug logs\
    - Conflict if not have rr, don't remove user reaction

---
# CHANGELOG - V1.6.7

• Fix Reaction Role Manager: Bad input: I canno't find emoji {identifier}

---
# CHANGELOG - V1.6.6

• Fix Reaction Collector TypeError: Cannot read property 'map' of undefined\
• Reaction Role Manager: wrong typo in createReactionRole()

---
# CHANGELOG - V1.6.5

• Fix Reaction Role Manager: Problems with animated emojis and auto deleting rr

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
