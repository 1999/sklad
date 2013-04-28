## Insert one or multiple records into the object stores
```javascript
/**
 * Insert one record into the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} inserted object key
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.insert('objStoreName', {foo: 'bar'}, function (err, insertedKey) {
        if (err)
            throw new Error(err);

        // work with inserted key
    });
});

/**
 * Insert multiple records into the object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} inserted objects' keys
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.insert({
        'objStoreName_1': ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        'objStoreName_2': [{foo: 'bar'}, {foo: 'bar'}]
    }, function (err, insertedKeys) {
        if (err)
            throw new Error(err);

        // insertedKeys is smth like this:
        // {
        //     objStoreName_1: [key1, key2, key3, key4, key5]
        //     objStoreName_2: [key6, key7]
        // }
    });
});
```

## Important points
 * Inserting multiple records with one call is faster than calling ```database.insert()``` multiple times, because each ```database.insert()``` runs inside its own transaction.
 * There are [4 types](https://github.com/1999/sklad#important-notes) of storing your data in the object stores. You should choose which of them fits your needs and after this you should pass proper data in the ```insert()``` function.
 * If you want to store a value of a simple type (object store without key path) with your own primary key, then you should use ```sklad.keyValue()``` function like this:
```javascript
var data = sklad.keyValue('own_primary_key', some_value);
database.insert('objStoreName', data, function (err, insertedKey) {
    if (err)
        throw new Error(err);

    // work with inserted key
});
```
