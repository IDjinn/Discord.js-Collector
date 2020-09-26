# Reaction Roles

If you want use mongo db to storage reaction roles, you need do some steps.

## Configure mongoose

You will need only mongo database link to connect. The link is something like that:

`mongodb+srv://<username>:<password>@cluster0.hzu4f.gcp.mongodb.net/<database-name>`

## Setup Reaction Role with mongoose

```js
const reactionRoleManager = new ReactionRoleManager(client, {
    storage: true,
    mongoDbLink: 'your mongoose url here'
});
```

Check basic example [here](./basic.js)