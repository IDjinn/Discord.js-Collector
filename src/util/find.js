const { isArray } = require('util');
module.exports = function findRecursively({ obj, key, type = 'array' | 'value' | 'object', result = [] }) {
    for (const k in obj) {
        if (obj[k] instanceof Object) {
            findRecursively({ obj: obj[k], key: key, type, result: result })
        }
    }
    if (obj && obj[key]) {
        if (type === 'array' && isArray(obj[key]))
            result.push(...obj[key]);
        else if (type == 'object') {
            result.push(obj);
        }
        else
            result.push(obj[key]);
    }
    return result
}