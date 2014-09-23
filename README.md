# Sklad: IndexedDB abstraction layer

[![Build Status](https://img.shields.io/travis/1999/sklad.svg?style=flat)](https://travis-ci.org/1999/sklad)
[![Dependency Status](http://img.shields.io/david/1999/sklad.svg?style=flat)](https://david-dm.org/1999/sklad)
[![DevDependency Status](http://img.shields.io/david/dev/1999/sklad.svg?style=flat)](https://david-dm.org/1999/sklad#info=devDependencies)

IndexedDB is HTML5 standard for a local database of records holding simple values and hierarchical objects. It is not the same as a Relational Database, which has tables, with collections rows and columns. IndexedDB has databases, which have objects stores with objects stored there. In fact IndexedDB is a NoSQL database similar to MongoDB and CouchDB. It can store any kind of objects (even Files and Blobs) and search them with indicies which you create when you start working with the database.

The problem of IndexedDB is the same as before: its API is too geeky, unfamiliar and complicated. **Sklad** library allows you to build apps for modern browsers with IndexedDB in a simple and convenient way. This is not ORM - it's just an abstraction layer above IndexedDB native objects.

## Open database ([details](https://github.com/1999/sklad/blob/master/docs/README_sklad_open.md))
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

## Insert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_insert.md))
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

## Upsert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_upsert.md))
```javascript
/**
 * 1) Insert or update one record in the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Mixed} inserted/updated object key
 *
 * 2) Insert or update multiple records in the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {String|Null} err
 *    @param {Object} inserted/updated objects' keys
 */
sklad.open(dbName, options, function (err, database) {
	database.upsert(objStoreName, data, callback);
});
```

## Delete one or mutiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_delete.md))
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

## Clear one or multiple object stores ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_clear.md))
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

## Get records from the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_get.md))
```javascript
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

## Count objects in the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_count.md))
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

# Important notes
There's an [unclear and scaring table](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database) on MDN called "Structuring the database". It means that there are 4 ways of storing your data in the object stores and you should choose which of them fits your needs best.

**Key path** is just a name of the field inside the objects which you store in the object store. For instance, it can be ```foo``` for the object ```{foo: 'bar'}```. **Key generator** is just a name for auto incrementing counter which is used as a primary key. Both of them (key path and key generator) are used as a primary keys for the records stored in the object stores.

## key path used, no key generator
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title', {keyPath: 'field_name'});
```
In this case you **must** store **only objects** in the object store. You **can** specify ```field_name``` in the stored objects and its value will be used as a primary key for them. If you don't specify it, Sklad library will generate this field's value.

**SAMPLE USE CASE:** a database of users with unique IDs and each user can be represented as an object with fields "firstname", "lastname", "uid", "phone" etc.

## no key path, key generator used
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title', {autoIncrement: true});
```
In this case you **can** store **any type of data** in the object store. Primary key for the new created record will be generated by the auto incrementing key generator, but you **can** also specify your own primary key like this:
```javascript
var data = sklad.keyValue('your_unique_key', value);
database.insert('obj_store_title', data, callback);
```

**SAMPLE USE CASE:** a simple set of data or even hierarchical objects which don't need a special field to be unique. This is a closest analogue of SQL-like tables with auto-incrementing IDs.

## key path used, key generator used
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title', {keyPath: 'field_name', autoIncrement: true});
```

In this case you **must** store **only objects** in the object store. You **can** specify ```field_name``` in the stored objects and its value will be used as a primary key for them. If you don't specify it, its value will be an auto incremented value produced by the key generator.

**SAMPLE USE CASE:** set of hierarchical objects, which don't have a unique field.

## no keypath, no key generator
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title');
```
In this case you **can** store **any type of data** in the object store. You **can** also specify a key to be used as a primary key for the record like this:
```javascript
var data = sklad.keyValue('your_unique_key', value);
database.insert('obj_store_title', data, callback);
```

Otherwise Sklad library will generate this value.

**SAMPLE USE CASE:** non-structured data with a need for your own primary keys.

# Examples?
[Of course](http://1999.github.io/sklad). Btw, [detailed docs](https://github.com/1999/sklad/tree/master/docs) contain nice pieces of code using Sklad library.

# Any tests?
PhantomJS is still [missing](https://github.com/ariya/phantomjs/issues/10992) support for IndexedDB, so i can't cover examples with tests right now. I hope the things will change soon.
