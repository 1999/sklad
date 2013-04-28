## Count objects in the object store(s)
```javascript
/**
 * Count objects in one object store
 *
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index' or/and 'range'
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Number} number of stored objects
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.count('objStoreName', {
        range: IDBKeyRange.bound('lower', 'upper', true, true),
        index: 'index_name'
    }, function (err, totalNum) {
        if (err)
            throw new Error(err);

        // total number of records in "objStoreName" (with this range and index) is totalNum
    });
});

/**
 * Count objects in multiple object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Object} number of stored objects
 */
sklad.open('dbName', function (err, database) {
    if (err)
        throw new Error(err);

    database.count({
        'objStoreName_1': null,
        'objStoreName_2': {range: IDBKeyRange.upperBound('upper')},
        'objStoreName_3': {index: 'index_name', range: IDBKeyRange.only('key')}
    }, function (err, total) {
        if (err)
            throw new Error(err);

        // total is smth like this:
        // {
        //     objStoreName_1: 0,
        //     objStoreName_2: 10
        //     objStoreName_3: 4
        // }
    });
});
```

## Important points
 * Counting records in multiple object stores with one call is faster than calling ```database.count()``` multiple times, because each ```database.count()``` runs inside its own transaction.
 * You can specify your own ranges with native [IDBKeyRange](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBKeyRange) API. IDBKeyRange object variable will be available once you include Sklad library in your code.
 * Beware that ranges are case-sensitive, for instance "A" is less than "z".
