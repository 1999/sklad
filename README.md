# Sklad: IndexedDB abstraction layer

## Open database
```javascript
/**
 * Opens a connection to database
 * @param {String} dbName database name
 * @param {Object} options (optional) object with {Number} "version" and {Object} "migration" fields
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} database (with skladConnection as the prototype)
 */
sklad.open('dbName', options, function (err, database) {
  // work with database
});
```

## Insert record
```javascript
/**
 * @param {String} objStoreName name of the object store
 * @param {String|Date|Float|Array} key (optional) key
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {String|Date|Float|Array} inserted object key
 */
insert: function skladConnection_insert(objStoreName, key, data, callback) {}
```

## Upsert record
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {String|Date|Float|Array} key (optional) key
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {String} saved object key
 */
upsert: function skladConnection_upsert(objStoreName, key, data, callback) {}
```

## Delete record
```javascript
/**
 * Delete record from the database
 *
 * @param {String} objStoreName name of object store
 * @param {String} key object's key
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
delete: function skladConnection_delete(objStoreName, key, callback) {}
```

## Get records from the database
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {Object} options object with keys "index", "range" and "direction"
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Array} stored objects
 */
get: function skladConnection_get(objStoreName, options, callback) {},
```

## Count objects in the database
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {Object} options object with keys "index" and "range"
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Number} number of stored objects
 */
count: function skladConnection_count(objStoreName, options, callback) {}
```

# Any tests?
PhantomJS is still [missing](https://github.com/ariya/phantomjs/issues/10992) support for IndexedDB, so i can't cover examples with tests right now. I hope the things will change soon.
