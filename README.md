# Sklad: IndexedDB abstraction layer
IndexedDB is HTML5 standard for a local database of records holding simple values and hierarchical objects. It is not the same as a Relational Database, which has tables, with collections rows and columns. IndexedDB has databases, which have objects stores with objects stored there. In fact IndexedDB is a NoSQL database similar to MongoDB and CouchDB. It can store any kind of objects (even Files and Blobs) and search them with indicies which you create when you start working with the database.

The problem of IndexedDB is the same as before: its API is too geeky, unfamiliar and complicated. **Sklad** library allows you to build apps for modern browsers with IndexedDB in a simple and convenient way. This is not ORM - it's just an abstraction layer above IndexedDB native objects.

## Open database ([details](https://github.com/1999/sklad/blob/master/examples/README_sklad_open.md))
```javascript
/**
 * @param {String} dbName database name
 * @param {Object} options (optional) connection options with keys:
 *    {Number} version - database version
 *    {Object} migration - migration scripts
 * @param {Function} callback invokes
 *    @param {String|Null} err
 *    @param {Object} database
 */
sklad.open(dbName, options, function (err, database) {
	// work with database
});
```

## Insert one or multiple records ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_insert.md))
```javascript
/**
 * 1) Insert one record into the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} inserted object key
 *
 * 2) Insert multiple records into the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} inserted objects' keys
 */
sklad.open(dbName, options, function (err, database) {
	database.insert(objStoreName, data, callback);
});
```

## Upsert one of multiple records ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_upsert.md))
```javascript
/**
 * 1) Insert or update one record into the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} inserted object key
 *
 * 2) Insert or update multiple records into the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} inserted objects' keys
 */
sklad.open(dbName, options, function (err, database) {
	database.upsert(objStoreName, data, callback);
});
```

## Delete one or mutiple records ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_delete.md))
```javascript
/**
 * 1) Delete one record from the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} key
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *
 * 2) Delete multiple records from the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
sklad.open(dbName, options, function (err, database) {
	database.delete(objStoreName, key, callback);
});
```

## Clear one or multiple object stores ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_clear.md))
```javascript
/**
 * @param {Array|String} objStoreNames array of object stores or a single object store
         * @param {Function} callback invokes:
         *    @param {String|Null} err
 */
sklad.open(dbName, options, function (err, database) {
	database.clear(objStoreName, callback);
});
```

## Get records from the object store(s) ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_get.md))
/**
 * 1) Get objects from one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index', 'range', 'offset', 'limit' and 'direction'
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Object} stored objects
 *
 * 2) Get objects from multiple object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Object} stored objects
 */
sklad.open(dbName, options, function (err, database) {
	database.get(objStoreName, {direction: sklad.DESC, limit: 10, offset: 5}, callback);
});
```

## Count objects in the object store(s) ([details](https://github.com/1999/sklad/blob/master/examples/README_skladConnection_count.md))
```javascript
/**
 * 1) Count objects in one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index' or/and 'range'
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Number} number of stored objects
 *
 * 2) Count objects in multiple object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {String|Null} err
 *      @param {Object} number of stored objects
 */
sklad.open(dbName, options, function (err, database) {
	database.count(objStoreName, {range: IDBKeyRange.bound(x, y, true, true)}, callback);
});
```

# Any tests?
PhantomJS is still [missing](https://github.com/ariya/phantomjs/issues/10992) support for IndexedDB, so i can't cover examples with tests right now. I hope the things will change soon.
