## Delete one or mutiple records
```javascript
/**
 * Delete one record from the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} key
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.delete('objStoreName', 'key', function (err) {
        if (err)
            throw new Error(err);

        // record is deleted
    });
});

/**
 * Delete multiple records from the object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.delete({
        'objStoreName_1': ['key_1', 'key_2', 'key_3'],
        'objStoreName_2': ['key1']
    }, function (err) {
        if (err)
            throw new Error(err);

        // all records are deleted
    });
});
```
