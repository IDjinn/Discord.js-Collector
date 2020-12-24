

---
#  V1.8.3 ->  V1.8.4

Reaction Role Manager: \
    - `RequirementType` now is enum check [here](https://idjinn.github.io/Discord.js-Collector/global.html#RequirementType) new values.\
    - `IRequirementType` now was improved, check [here](https://idjinn.github.io/Discord.js-Collector/global.html#IRequirementType) new fields.\


---
#  V1.8.1 ->  V1.8.3

Reaction Role Manager: \
    - `debug` property was removed, please use event debug instead.

---
#  V1.8.1 ->  V1.8.3

Reaction Role Manager: \
    - `debug` property was removed, please use event debug instead.

---
#  V1.8.0 ->  V1.8.1

Reaction Role Manager: \
    - Event `ReactionRoleManager#allReactionsRemove` param `rolesAffected` now it's a `Collection<string, Role>`\
    - `ReactionRole#role` property was flaged as deprecated, please use `ReactionRole#roles` instead\
    - `static ReactionRole#fromJSON(json)` method was flaged as deprecated, use `new ReactionRole(json)` instead\
    - `ReactionRoleManager#createReactionRole(options)` param `role` is removed, it was replaced by `roles`, and now it's array of roles.

---
#  V1.7.0 ->  V1.8.0

Reaction Role Manager: \
    - `ReactionRole#type` property will define if it's normal, toggle or other reaction role types, the system have auto deprecation handler, if it's not toggle role system set it as normal, if is toggle role set it as toggle role type. Other types will not be affected.
    - `ReactionRole#toggle` property was marked with deprecated, please use `isToggle` instead. All toggle roles will be updated to type `2` (until  v1.8.0), `toJSON()` method and default value in mongoDB schema will not longer show it.\
    - `ReactionRole#max` property was changed behavior, now 0 is infinity (and default) roles to give, and max limit is 1B roles.\
    - `ReactionRole#createReactionRole()` option `toggle` is replaced by `type` of reaction role.

---
#  V1.6.9 ->  V1.7.0

- Reaction Collector:\
    - On React triggers:\
        Now, first param given is `collector` (`controller` if you're using menu), then all other args\
            Example:\

            ```js 
            // Before
                ReactionCollector.question({
                    botMessage,
                    user: message.author,
                    reactions: {
                        '✅': async (reaction, ...args) => await message.channel.delete(),
                        '❌': async (reaction, ...args) => await message.reply('Ok, operation cancelled!'),
                    }
                },
                'you', 'args', 'here');

            // After
                ReactionCollector.question({
                    botMessage,
                    user: message.author,
                    reactions: {
                        '✅': async (reaction, collector, ...args) => await message.channel.delete(),
                        '❌': async (reaction, collector, ...args) => {
                            collector.stop(); // Stop reaction collector please!
                            await message.reply('Ok, operation cancelled!');
                        }
                    }
                }
                'you', 'args', 'here');
            ```

- Reaction Role Manager:\
    - Now all roles will not deleted by default. If you want delete reaction roles when message was deleted or something like that, you need enable Reaction Roles delete property.\
        Example:\

        ```js 
            const reactionRoleManager = new ReactionRoleManager(client, {
                storage: true, 
                mongoDbLink: 'url mongo db',
                disableProperty: false // Now, all roles will not just 'disabled', it will be deleted.
            });
        ```


# V1.7.0 -> V1.8.0

- Reaction Role Manager:\
    - Now `deleteReactionRole(reactionRole, [deleted])` method will use object in first param to delete with only message and emoji of this reaction role.\
        E.g:\

        ```js
            // Before
            await rrManager.deleteReactionRole(reactionRole);
            // Now
            await rrManager.deleteReactionRole({reactionRole});
            // Or just delete if you have message and emoji
            await rrManager.deleteReactionRole({rrMessage, emoji});
        ```