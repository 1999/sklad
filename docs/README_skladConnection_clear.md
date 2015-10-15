## Clear one or multiple object stores
```javascript
/**
 * Clear one object store
 *
 * @param {String} objStoreName name of object store
 * @return {Promise}
 *   @param {DOMError} err
 */
sklad.open('dbName', function (err, database) {
    database.clear('objStoreName').then(function () {
        // object store is clear
    }).catch(function (err) {
        // check err.name to get the reason of error
        // err.message will also be useful
        throw new Error(err.message);
    });
});

/**
 * Clear multiple object stores (during one transaction)
 *
 * @param {Array} objStoreNames
 * @return {Promise}
 *   @param {DOMError} err
 */
sklad.open('dbName', function (err, database) {
    database.clear(['objStoreName_1', 'objStoreName_2', 'objStoreName_3']).then(function () {
        // object stores are clear
    }).catch(function (err) {
        // check err.name to get the reason of error
        // err.message will also be useful
        throw new Error(err.message);
    });
});
```

## Important notes
 * Check out [clear() tests](https://github.com/1999/sklad/blob/master/tests/clear.js) to see expected behaviour of this method.
