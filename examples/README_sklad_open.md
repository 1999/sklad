## Opening a database connection
You should start working with your database(s) with ```sklad.open()```. New object stores and indicies should be created in the "migration" part of the second parameter.

```javascript
/**
 * @param {String} dbName database name
 * @param {Object} options (optional) object with {Number} "version" and {Object} "migration" fields
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} database (with skladConnection as the prototype)
 */
sklad.open('dbName', {
    version: 2,
    migration: {
        '1': function (database) {
            // This migration part starts when your code runs first time in the browser.
            // This is a migration from "didn't exist" to "1" database version
            var objStore = database.createObjectStore('users', {autoIncrement: true});
            objStore.createIndex('fb_search', 'facebook_id', {unique: true});
        },
        '2': function (database) {
            // This migration part starts when your database migrates from "1" to "2" version
            var objStore = database.createObjectStore('users_likes', {keyPath: 'date'});
        }
    }
}, function (err, database) {
    // work with database
});
```

## Important points
 * Second parameter is optional. If you don't specify it, the current database version will be used
 * If you specify database version less than current, you will get an error about this as the first argument of the callback
 * Every migration function takes {[IDBDatabase](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase)} database as the only argument, so you can [create](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#createObjectStore) and [delete](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#deleteObjectStore()) object stores inside a function.
 * Migration scripts are executed according to database version. If your current database version is 1 and you set options.version as 4, than "2", "3" and "4" migrations will be executed one by one.
