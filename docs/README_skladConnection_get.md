## Get records from the object store(s)
```javascript
/**
 * Get objects from one object store
 *
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index', 'range', 'offset', 'limit' and 'direction'
 * @param {Function} callback invokes:
 *      @param {DOMError|Null} err
 *      @param {Array} stored objects
 */
sklad.open('dbName', function (err, database) {
    database.get('objStoreName', {
        range: IDBKeyRange.bound('lower', 'upper', true, true),
        index: 'index_name',
        offset: 20,
        limit: 10,
        direction: sklad.DESC
    }, function (err, records) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // records in an array containing objects with structure:
        // {
        //     key: ...,
        //     value: object1
        // },
        // ...
    });
});

/**
 * Get objects from multiple object stores (during one transaction)
 *
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Object} stored objects
 */
sklad.open('dbName', function (err, database) {
    database.get({
        'objStoreName_1': {
            range: IDBKeyRange.bound('lower', 'upper', true, true),
            index: 'index_name',
            offset: 20,
            limit: 10,
            direction: sklad.DESC
        },
        'objStoreName_2': {
            limit: 3,
            direction: sklad.ASC_UNIQUE
        }
    }, function (err, records) {
        if (err) {
            // check err.name to get the reason of error
            // err.message will also be useful
            throw new Error(err.message);
        }

        // records in an object with arrays:
        // {
        //     objStoreName_1: [
        //         {
        //             key: ...,
        //             value: object1,
        //         },
        //         ...
        //     ],
        //     objStoreName_2: [ ... ]
        // }
    });
});
```

## Important notes
 * Fetching records in multiple object stores with one call is faster than calling ```database.get()``` multiple times, because each ```database.get()``` runs inside its own transaction.
 * You can specify your own ranges with native [IDBKeyRange](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBKeyRange) API. IDBKeyRange object variable will be available once you include Sklad library in your code.
 * There's no such opportunity to get limited number of records and total records number in one call. You should make ```database.count()``` call first to get total number of records available with these options.
 * Default direction is increasing in the order of keys including duplicates.
 * Check out [get() tests](https://github.com/1999/sklad/blob/master/tests/get.js) to see expected behaviour of this method.
 * There are 4 types of iterating direction:

```javascript
sklad.ASC;
// Shows all records, including duplicates.
// Starts at the lower bound of the key range and moves upwards (monotonically increasing in the order of keys).

sklad.ASC_UNIQUE;
// Shows all records, excluding duplicates.
// If multiple records exist with the same key, only the first one iterated is retrieved.
// Starts at the lower bound of the key range and moves upwards.

sklad.DESC;
// Shows all records, including duplicates.
Starts at the upper bound of the key range and moves downwards (monotonically decreasing in the order of keys).

sklad.DESC_UNIQUE;
// Shows all records, excluding duplicates.
// If multiple records exist with the same key, only the first one iterated is retrieved.
// Starts at the upper bound of the key range and moves downwards.
```
