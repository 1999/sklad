## Delete one or mutiple records
```javascript
/**
 * Delete one record from the object store
 *
 * @param {String} objStoreName name of object store
 * @param {Mixed} key
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 */
sklad.open('dbName', function (err, database) {
    database.delete('objStoreName', 'key', function (err) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

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
    database.delete({
        'objStoreName_1': ['key_1', 'key_2', 'key_3'],
        'objStoreName_2': ['key1']
    }, function (err) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // all records are deleted
    });
});
```
## Important notes
 * You can pass IDBKeyRange to delete all needed records.
 * Check out [delete() tests](https://github.com/1999/sklad/blob/master/tests/delete.js) to see expected behaviour of this method.
