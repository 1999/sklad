# Sklad: IndexedDB abstraction layer ![Travis CI](https://secure.travis-ci.org/1999/sklad.png?branch=master)

## Open database
```javascript
/**
 * Opens a connection to database
 * @param {String} dbName database name
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} database
 */
sklad.open("dbName", function (err, database) {
  // work with database
});
```

## Insert record
```javascript
/**
 * Insert record to database
 * @param {String} objStoreName name of object store
 * @param {Mixed} obj object to be inserted
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {String} inserted object key
 */
database.insert(objStoreName, obj, function (err, key) {
  // work with inserted key
});
```

## Upsert record
```javascript
/**
 * Update or insert record to database
 * @param {String} objStoreName name of object store
 * @param {Mixed} obj object to be inserted
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {String} inserted object key
 */
database.save(objStoreName, obj, function (err, key) {
  // work with inserted/updated key
});
```

## Delete object
```javascript
/**
 * Delete record from database
 * @param {String} objStoreName name of object store
 * @param {String} key object's key
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
database.delete(objStoreName, key, function (err) {
  // do smth
});
```

## Get record by keypath
```javascript
/**
 * Get object by its key path
 * @param {String} objStoreName name of object store
 * @param {String} keypath object's key
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} stored object
 */
database.getObject(objStoreName, keypath, function (err, obj) {
  // work with obj
});
```

## Get all stored objects
```javascript
/**
 * Get all objects from database
 * @param {String} objStoreName name of object store
 * @param {Object} options
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
database.getAll(objStoreName, options, function (err) {
  // do smth
});
```

## Get objects by key range
```javascript
/**
 * Get objects specified by index & range
 * @param {String} objStoreName name of object store
 * @param {String} indexName
 * @param {Object} options
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
database.query(objStoreName, indexName, options, function (err) {
  // do smth
});
```

## Create index
```javascript
/**
 * Create index on top of the object store
 * @param {String} objStoreName name of object store
 * @param {String} indexName
 * @param {Object} options
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
database.createIndex(objStoreName, indexName, options, function (err) {
  // do smth
});
```

## Delete index
```javascript
/**
 * Delete index from the the object store
 * @param {String} objStoreName name of object store
 * @param {String} indexName
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 */
database.deleteIndex(objStoreName, indexName, function (err) {
  // do smth
});
```
