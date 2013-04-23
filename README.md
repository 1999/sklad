# Sklad: IndexedDB abstraction layer
IndexedDB is HTML5 standard for a local database of records holding simple values and hierarchical objects. It is not the same as a Relational Database, which has tables, with collections rows and columns. IndexedDB has databases, which have objects stores with objects stored there. In fact IndexedDB is a NoSQL database similar to MongoDB and CouchDB. It can store any kind of objects (even Files and Blobs) and search them with indicies which you create when you start working with the database.

The problem of IndexedDB is the same as before: its API is too geeky, unfamiliar and complicated. **Sklad** library allows you to build apps for modern browsers with IndexedDB in a simple and convenient way. This is not ORM - it's just an abstraction layer above IndexedDB native objects.

## Open database ([details](https://github.com/1999/sklad/blob/master/examples/README_sklad_open.md))
```javascript
/**
 * @param {String} dbName database name
 * @param {Object} options (optional) object with {Number} "version" and {Object} "migration" fields
 * @param {Function} callback invokes:
 *    @param {Error|Null} err
 *    @param {Object} database (with skladConnection as the prototype)
 */
sklad.open('dbName', options, function (err, database) {
  // work with database
});
```

## Insert record ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_insert.md))
```javascript
/**
 * @param {String} objStoreName name of the object store
 * @param {String|Date|Float|Array} key (optional) key
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {Error|Null} err
 *    @param {String|Date|Float|Array} inserted object key
 */
insert: function skladConnection_insert(objStoreName, key, data, callback) {}
```

## Upsert record ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_upsert.md))
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {String|Date|Float|Array} key (optional) key
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {Error|Null} err
 *    @param {String} saved object key
 */
upsert: function skladConnection_upsert(objStoreName, key, data, callback) {}
```

## Delete record ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_delete.md))
```javascript
/**
 * Delete record from the database
 *
 * @param {String} objStoreName name of object store
 * @param {String} key object's key
 * @param {Function} callback invokes:
 *    @param {Error|Null} err
 */
delete: function skladConnection_delete(objStoreName, key, callback) {}
```

## Get records from the database ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_get.md))
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {Object} options object with keys "index", "range" and "direction"
 * @param {Function} callback invokes:
 *      @param {Error|Null} err
 *      @param {Array} stored objects
 */
get: function skladConnection_get(objStoreName, options, callback) {},
```

## Count objects in the database ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_count.md))
```javascript
/**
 * @param {String} objStoreName name of object store
 * @param {Object} options object with keys "index" and "range"
 * @param {Function} callback invokes:
 *    @param {Error|Null} err
 *    @param {Number} number of stored objects
 */
count: function skladConnection_count(objStoreName, options, callback) {}
```

# Any tests?
PhantomJS is still [missing](https://github.com/ariya/phantomjs/issues/10992) support for IndexedDB, so i can't cover examples with tests right now. I hope the things will change soon.
