const { MessageCollector } = require('./src');
new MessageCollector({},null)
const a = new MessageCollector.Question({});
const b = MessageCollector.createQuestion({})

console.log(a, b)