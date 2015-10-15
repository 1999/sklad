## Insert one or multiple records into the object stores
```javascript
/**
 * Insert one record into the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {*} inserted object key
 */
sklad.open('dbName', function (err, conn) {
    conn.insert('objStoreName', {foo: 'bar'}).then(function (insertedKey) {
        // work with inserted key
    }).catch(function (err) {
        // check err.name to get the reason of error
        // err.message will also be useful
        throw new Error(err.message);
    });
});

/**
 * Insert multiple records into the object stores (during one transaction)
 *
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} inserted objects' keys
 */
sklad.open('dbName', function (err, database) {
    database.insert({
        'objStoreName_1': ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
        'objStoreName_2': [{foo: 'bar'}, {foo: 'bar'}]
    }).then(function (insertedKeys) {
        // insertedKeys is smth like this:
        // {
        //     objStoreName_1: [key1, key2, key3, key4, key5]
        //     objStoreName_2: [key6, key7]
        // }
    }).catch(function (err) {
        // check err.name to get the reason of error
        // err.message will also be useful
        throw new Error(err.message);
    });
});
```

## Important notes
 * Inserting multiple records with one call is faster than calling `database.insert()` multiple times, because each `database.insert()` runs inside its own transaction.
 * There are [4 types](https://github.com/1999/sklad#important-notes) of storing your data in the object stores. You should choose which of them fits your needs best when you design your app's architecture.
 * If you want to store a simple type value (object store without key path) with your own primary key, then you should use `sklad.keyValue()` function like this:
```javascript
var data = sklad.keyValue('own_primary_key', some_value);
database.insert('objStoreName', data).then(...);
```
 * Check out [insert() tests](https://github.com/1999/sklad/blob/master/tests/insert.js) to see expected behaviour of this method.
