## Count objects in the object store(s)
```javascript
/**
 * Count objects in one object store
 *
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index' or/and 'range'
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Number} number of stored objects otherwise
 */
const conn = await sklad.open('dbName');

try {
    const totalNum = await conn.count('objStoreName', {
        range: IDBKeyRange.bound('lower', 'upper', true, true),
        index: 'index_name'
    });
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}

/**
 * Count objects in multiple object stores (during one transaction)
 *
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} number of stored objects otherwise
 */
const conn = await sklad.open('dbName');

try {
    const res = await conn.count({
        'objStoreName_1': null,
        'objStoreName_2': {range: IDBKeyRange.upperBound('upper')},
        'objStoreName_3': {index: 'index_name', range: IDBKeyRange.only('key')}
    });

    assert.equal(res, {
        objStoreName_1: 0,
        objStoreName_2: 10
        objStoreName_3: 4
    });
} catch (err) {
    // check err.name to get the reason of error
    // err.message will also be useful
    throw new Error(err.message);
}
```

## Important note
 * Counting records in multiple object stores with one call is faster than calling ```database.count()``` multiple times, because each ```database.count()``` runs inside its own transaction.
 * You can specify your own ranges with native [IDBKeyRange](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBKeyRange) API. IDBKeyRange object variable will be available once you include Sklad library in your code.
 * Beware that ranges are case-sensitive, for instance "A" is less than "z".
 * Check out [count() tests](https://github.com/1999/sklad/blob/master/tests/count.js) to see expected behaviour of this method.
