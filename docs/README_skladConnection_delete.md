## Delete one or multiple records
```javascript
/**
 * Delete one record from the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} key
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 */
const conn = await sklad.open('dbName');

try {
    await conn.delete('objStoreName', 'key');
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}

/**
 * Delete multiple records from the object stores (during one transaction)
 *
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 */
const conn = await sklad.open('dbName');

try {
    await conn.delete({
        'objStoreName_1': ['key_1', 'key_2', 'key_3'],
        'objStoreName_2': ['key1']
    });
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}
```
## Important notes
 * You can pass IDBKeyRange to delete all needed records.
 * Check out [delete() tests](https://github.com/1999/sklad/blob/master/tests/delete.js) to see expected behaviour of this method.
