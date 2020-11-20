


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