const { isArray } = require('util');
/** 
* Find recursively something inside a object
* @param {options} options
* @param {object} options.obj - Object to search a item inside it.
* @param {object} options.key - Item key name to find.
* @param {string} [options.type='array'] - Type of value to find.
* @param {any[]} [options.result=[]] - Array with all results founded.
* @return {any[]} All results founded.
*/
function findRecursively({ obj, key, type = 'array' | 'value' | 'object', result = [] }) {
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

module.exports = {
    findRecursively
}