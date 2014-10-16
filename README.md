# Sklad: IndexedDB abstraction layer

[![Build Status](https://img.shields.io/travis/1999/sklad.svg?style=flat)](https://travis-ci.org/1999/sklad)
[![DevDependency Status](http://img.shields.io/david/dev/1999/sklad.svg?style=flat)](https://david-dm.org/1999/sklad#info=devDependencies)

IndexedDB is HTML5 standard for a local database of records holding practically any kind of data - from simple numbers to even Blobs. It is not the same as a relational database which has tables with collections rows and columns. IndexedDB has databases, which have objects stores with data stored there. In fact IndexedDB is a NoSQL database similar to MongoDB and CouchDB. It can also search for data with indexes which you create when start working with the database..

The problem of IndexedDB is following: its API is too geeky, unfamiliar and complicated. **Sklad** library allows you to build apps for modern browsers with IndexedDB in a simple and convenient way. This is not ORM - it's just a thin abstraction layer on top of IndexedDB native API.

## Open database ([details](https://github.com/1999/sklad/blob/master/docs/README_sklad_open.md))
```javascript
/**
 * @param {String} dbName database name
 * @param {Object} [options = {}] connection options
 * @param {Number} [options.version] database version
 * @param {Object} [options.migration] migration scripts
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Object} conn
 */
sklad.open(dbName, {
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
}, function (err, conn) {
	// work with database connection
});
```

## Insert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_insert.md))
```javascript
/**
 * 1) Insert one record into the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Mixed} inserted object key
 *
 * 2) Insert multiple records into the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Object} inserted objects' keys
 */
sklad.open(dbName, options, function (err, conn) {
	conn.insert(objStoreName, data, callback);
});
```

## Upsert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_upsert.md))
```javascript
/**
 * 1) Insert or update one record in the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Mixed} inserted/updated object key
 *
 * 2) Insert or update multiple records in the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *    @param {Object} inserted/updated objects' keys
 */
sklad.open(dbName, options, function (err, conn) {
	conn.upsert(objStoreName, data, callback);
});
```

## Delete one or mutiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_delete.md))
```javascript
/**
 * 1) Delete one record from the object store
 * @param {String} objStoreName name of object store
 * @param {Mixed} key
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 *
 * 2) Delete multiple records from the object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *    @param {DOMError|Null} err
 */
sklad.open(dbName, options, function (err, conn) {
	conn.delete(objStoreName, key, callback);
});
```

## Clear one or multiple object stores ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_clear.md))
```javascript
/**
 * @param {Array|String} objStoreNames array of object stores or a single object store
         * @param {Function} callback invokes:
         *    @param {DOMError|Null} err
 */
sklad.open(dbName, options, function (err, conn) {
	conn.clear(objStoreName, callback);
});
```

## Get records from the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_get.md))
```javascript
/**
 * 1) Get objects from one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index', 'range', 'offset', 'limit' and 'direction'
 * @param {Function} callback invokes:
 *      @param {DOMError|Null} err
 *      @param {Array} stored objects
 *
 * 2) Get objects from multiple object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {DOMError|Null} err
 *      @param {Object} stored objects
 */
sklad.open(dbName, options, function (err, conn) {
	conn.get(objStoreName, {direction: sklad.DESC, limit: 10, offset: 5}, callback);
});
```

## Count objects in the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_count.md))
```javascript
/**
 * 1) Count objects in one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index' or/and 'range'
 * @param {Function} callback invokes:
 *      @param {DOMError|Null} err
 *      @param {Number} number of stored objects
 *
 * 2) Count objects in multiple object stores (during one transaction)
 * @param {Object} data
 * @param {Function} callback invokes:
 *      @param {DOMError|Null} err
 *      @param {Object} number of stored objects
 */
sklad.open(dbName, options, function (err, conn) {
	conn.count(objStoreName, {range: IDBKeyRange.bound(x, y, true, true)}, callback);
});
```

## Close existing database connection ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_close.md))
```javascript
sklad.open(dbName, options, function (err, conn) {
    conn.close();
});
```

## Delete database
```javascript
/**
 * @param {String} dbName
 * @param {Function} callback invokes:
 *     @param {DOMError|Null} err
 */
sklad.deleteDatabase(dbName, callback);
```

# Important notes
There's an [unclear and scaring table](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database) on MDN called "Structuring the database". It means that there are 4 ways of storing your data in the object stores and you should choose which of them fits your needs best.

**Key path** is just a name of the field inside the objects which you store in the object store. For instance, it can be ```foo``` for the object ```{foo: 'bar'}```. **Key generator** is just a name for auto incrementing counter which is used as a primary key. Both of them (key path and key generator) are used as a primary keys for the records stored in the object stores.

## key path used, no key generator (objects with mandatory field)
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title', {keyPath: 'field_name'});
```
In this case you **must** store **only objects** in the object store. You **can** specify ```field_name``` in the stored objects and its value will be used as a primary key for them. If you don't specify it, Sklad library will generate this field's value.

**SAMPLE USE CASE:** a database of users with unique logins and each user can be represented as an object with fields "firstname", "lastname", "login", "phone" etc.

## no key path, key generator used (any data, autoincremented primary key)
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

## key path used, key generator used (objects with optional primary key field)
```javascript
// ...inside migration scripts
var objStore = database.createObjectStore('obj_store_title', {keyPath: 'field_name', autoIncrement: true});
```

In this case you **must** store **only objects** in the object store. You **can** specify ```field_name``` in the stored objects and its value will be used as a primary key for them. If you don't specify it, its value will be an auto incremented value produced by the key generator.

**SAMPLE USE CASE:** set of hierarchical objects, which don't have a unique field.

## no keypath, no key generator (any data, primary key anarchy)
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
Tests are located in [tests](https://github.com/1999/sklad/tree/master/tests) folder. You can run them with `npm test`. Tests are written with Jasmine testing framework and run with Karma runner.
