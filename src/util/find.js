const { isArray } = require('util');
/**
 * Find recursively something inside a object
 * @param {options} options
 * @param {object} options.obj - Object to search a item inside it.
 * @param {object} options.key - Item key name to find.
 * @param {string|number} [options.value=null] - Value item to find.
 * @param {string} [options.type='array'] - Type of value to find.
 * @param {any[]} [options.result=[]] - Array with all results founded.
 * @return {any[]} All results founded.
 */
function findRecursively({
    obj,
    key,
    value = null,
    // eslint-disable-next-line no-bitwise
    type = 'array' | 'value' | 'object',
    result = [],
}) {
    // eslint-disable-next-line no-restricted-syntax
    for (const k in obj) {
        if (obj[k] instanceof Object) {
            findRecursively({
                obj: obj[k],
                key,
                type,
                result,
                value,
            });
        }
    }
    if (obj && obj[key]) {
        if (type === 'array' && isArray(obj[key])) result.push(...obj[key]);
        else if (type === 'object') {
            if (!value || obj[key] === value) result.push(obj);
        } else result.push(obj[key]);
    }
    return result;
}

module.exports = {
    findRecursively,
};
