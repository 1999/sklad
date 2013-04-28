## Clear one or multiple object stores
```javascript
/**
 * Clear one object store
 *
 * @param {String} objStoreName name of object store
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.clear('objStoreName', function (err) {
        if (err)
            throw new Error(err);

        // object store is clear
    });
});

/**
 * Clear multiple object stores (during one transaction)
 *
 * @param {Array} objStoreNames
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.clear(['objStoreName_1', 'objStoreName_2', 'objStoreName_3'], function (err) {
        if (err)
            throw new Error(err);

        // object stores are clear
    });
});
```
