## Clear one or multiple object stores
```javascript
/**
 * Clear one object store
 *
 * @param {String} objStoreName name of object store
 * @return {Promise}
 */
const conn = await sklad.open('dbName');

try {
    await conn.clear('objStoreName');
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}

/**
 * Clear multiple object stores (during one transaction)
 *
 * @param {Array} objStoreNames
 * @return {Promise}
 *   @param {DOMError} err
 */
const conn = await sklad.open('dbName');

try {
    await conn.clear(['objStoreName_1', 'objStoreName_2', 'objStoreName_3']);
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}
```

## Important notes
 * Check out [clear() tests](https://github.com/1999/sklad/blob/master/tests/clear.js) to see expected behaviour of this method.
