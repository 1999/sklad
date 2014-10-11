## Clear one or multiple object stores
```javascript
/**
 * Clear one object store
 *
 * @param {String} objStoreName name of object store
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 */
sklad.open('dbName', function (err, database) {
    database.clear('objStoreName', function (err) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // object store is clear
    });
});

/**
 * Clear multiple object stores (during one transaction)
 *
 * @param {Array} objStoreNames
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 */
sklad.open('dbName', function (err, database) {
    database.clear(['objStoreName_1', 'objStoreName_2', 'objStoreName_3'], function (err) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // object stores are clear
    });
});
```

## Important notes
 * Check out [clear() tests](https://github.com/1999/sklad/blob/master/tests/clear.js) to see expected behaviour of this method.