## Insert or update one or multiple records into the object stores
```javascript
/**
 * Insert or update one record in the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Mixed} inserted/updated object key
 */
sklad.open('dbName', function (err, database) {
    database.upsert('objStoreName', {foo: 'bar'}, function (err, upsertedKey) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // work with upserted key
    });
});

/**
 * Insert or update multiple records in the object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Object} inserted/updated objects' keys
 */
sklad.open('dbName', function (err, database) {
    database.upsert({
        'objStoreName_1': ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        'objStoreName_2': [{foo: 'bar'}, {foo: 'bar'}]
    }, function (err, upsertedKeys) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // upsertedKeys is smth like this:
        // {
        //     objStoreName_1: [key1, key2, key3, key4, key5]
        //     objStoreName_2: [key6, key7]
        // }
    });
});
```

## Important note
 * [The same](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_insert.md)
 * Check out [upsert() tests](https://github.com/1999/sklad/blob/master/tests/upsert.js) to see expected behaviour of this method.
