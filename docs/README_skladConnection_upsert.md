## Insert or update one or multiple records into the object stores
```javascript
/**
 * Insert or update one record in the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {*} inserted/updated object key otherwise
 */
const conn = await sklad.open('dbName');

try {
    const upsertedKey = await conn.upsert('objStoreName', {foo: 'bar'});
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}

/**
 * Insert or update multiple records in the object stores (during one transaction)
 *
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} inserted/updated objects' keys otherwise
 */
const conn = await sklad.open('dbName');

try {
    const upsertedKeys = await conn.upsert({
        'objStoreName_1': ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        'objStoreName_2': [{foo: 'bar'}, {foo: 'bar'}]
    });

    assert.equal(upsertedKeys, {
        objStoreName_1: [key1, key2, key3, key4, key5]
        objStoreName_2: [key6, key7]
    });
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}
```

## Important note
 * [The same](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_insert.md)
 * Check out [upsert() tests](https://github.com/1999/sklad/blob/master/tests/upsert.js) to see expected behaviour of this method.
