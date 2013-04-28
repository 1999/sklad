## Insert or update one or multiple records into the object stores
```javascript
/**
 * Insert or update one record in the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} inserted/updated object key
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.upsert('objStoreName', {foo: 'bar'}, function (err, upsertedKey) {
        if (err)
            throw new Error(err);

        // work with upserted key
    });
});

/**
 * Insert or update multiple records in the object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} inserted/updated objects' keys
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.upsert({
        'objStoreName_1': ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        'objStoreName_2': [{foo: 'bar'}, {foo: 'bar'}]
    }, function (err, upsertedKeys) {
        if (err)
            throw new Error(err);

        // upsertedKeys is smth like this:
        // {
        //     objStoreName_1: [key1, key2, key3, key4, key5]
        //     objStoreName_2: [key6, key7]
        // }
    });
});
```

## Important points
[The same](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_insert.md)
