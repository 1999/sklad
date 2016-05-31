# Sklad: IndexedDB abstraction layer

[![Build Status](https://img.shields.io/travis/1999/sklad.svg?style=flat)](https://travis-ci.org/1999/sklad)
[![DevDependency Status](http://img.shields.io/david/dev/1999/sklad.svg?style=flat)](https://david-dm.org/1999/sklad#info=devDependencies)

IndexedDB is HTML5 standard for a local database of records holding practically any kind of data - from simple numbers to even Blobs. It is not the same as a relational database which has tables with collections rows and columns. IndexedDB has databases, which have objects stores with data stored there. In fact IndexedDB is a NoSQL database similar to MongoDB and CouchDB. It can also search for data with indexes which you create when you start working with the database.

**Sklad library makes work with IndexedDB less weird by providing a tiny Promise-based API** on top of IndexedDB. It also requires promises support. If your browser doesn't support promises you can include [polyfill](https://www.npmjs.com/package/promise-polyfill) for this.

Starting from 4.0.0 Sklad library is working in all major browsers: Chrome, Firefox, IE11, Microsoft Edge, Safari9 and Android browser. Still there are some browser issues for IE11, Microsoft Edge and Safari9 which can't be patched inside library. Read [changelog](https://github.com/1999/sklad/blob/master/CHANGELOG.md#400) for more info.

## Open database ([details](https://github.com/1999/sklad/blob/master/docs/README_sklad_open.md))
```javascript
sklad.open(dbName, {
    version: 2,
    migration: {
        '1': (database) => {
            // This migration part starts when your code runs first time in the browser.
            // This is a migration from "didn't exist" to "1" database version
            const objStore = database.createObjectStore('users', {autoIncrement: true});
            objStore.createIndex('fb_search', 'facebook_id', {unique: true});
        },
        '2': (database) => {
            // This migration part starts when your database migrates from "1" to "2" version
            const objStore = database.createObjectStore('users_likes', {keyPath: 'date'});
        }
    }
}).then(conn => {
    // work with database connection
}).catch(err => {
    // handle error
});
```

## Insert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_insert.md))
```javascript
sklad.open(dbName, options).then(conn => {
    // insert one document into store
    conn.insert(objStoreName, 'hello world').then(insertedKey => ...);

    // insert data into multiple stores inside one transaction
    conn.insert({
        users: [
            {email: 'example1@gmail.com', firstname: 'John'},
            {email: 'example2@gmail.com', firstname: 'Jack'},
            {email: 'example3@gmail.com', firstname: 'Peter'},
        ],
        foo_obj_store: ['truly', 'madly', 'deeply']
    }).then(insertedKeys => {
        assert.equal(insertedKeys, {
            users: [id1, id2, id3],
            foo_obj_store: [id4, id5, id6]
        });
    });
});
```

## Upsert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_upsert.md))
```javascript
sklad.open(dbName, options).then(conn => {
    // upsert one document inside store
    conn.insert(objStoreName, {id: 'BMTH', bandMembersCount: 5}).then(upsertedKey => ...);

    // upsert data in multiple stores inside one transaction
    conn.upsert({
        users: [
            {email: 'example1@gmail.com', firstname: 'John'},
            {email: 'example2@gmail.com', firstname: 'Jack'},
            {email: 'example3@gmail.com', firstname: 'Peter'},
        ],
        foo_obj_store: ['truly', 'madly', 'deeply']
    }).then(upsertedKeys => {
        assert.equal(insertedKeys, {
            users: [id1, id2, id3],
            foo_obj_store: [id4, id5, id6]
        });
    });
});
```

## Delete one or mutiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_delete.md))
```javascript
sklad.open(dbName, options).then(conn => {
    // delete document from the object store
    conn.delete(objStoreName, 'key').then(() => {
        // record has been deleted
    });

    // delete multiple documents from different object stores inside one transaction
    conn.delete({
        objStoreName1: ['key_1', 'key_2', 'key_3'],
        objStoreName2: ['key1']
    }).then(() => {
        // all records have been deleted
    });
});
```

## Clear one or multiple object stores ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_clear.md))
```javascript
/**
 * @param {Array|String} objStoreNames array of object stores or a single object store
 * @return {Promise}
 *   @param {DOMError} err
 */
sklad.open(dbName, options).then(conn => {
	conn.clear(objStoreName).then(...);
});
```

## Get records from the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_get.md))
```javascript
/**
 * 1) Get objects from one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index', 'range', 'offset', 'limit' and 'direction'
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} stored objects otherwise
 *
 * 2) Get objects from multiple object stores (during one transaction)
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} stored objects otherwise
 */
sklad.open(dbName, options).then(conn => {
	conn.get(objStoreName, {direction: sklad.DESC, limit: 10, offset: 5}).then(records => {
        // ...
    });
});
```

## Count objects in the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_count.md))
```javascript
/**
 * 1) Count objects in one object store
 * @param {String} objStoreName name of object store
 * @param {Object} options (optional) object with keys 'index' or/and 'range'
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Number} number of stored objects otherwise
 *
 * 2) Count objects in multiple object stores (during one transaction)
 * @param {Object} data
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 *   @param {Object} number of stored objects otherwise
 */
sklad.open(dbName, options).then(conn => {
	conn.count(objStoreName, {range: IDBKeyRange.bound(x, y, true, true)}).then(total => {
        // ...
    });
});
```

## Close existing database connection ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_close.md))
```javascript
sklad.open(dbName, options).then(conn => {
    conn.close();
});
```

## Delete database
```javascript
/**
 * Deletes database
 *
 * @param {String} dbName
 * @return {Promise}
 *   @param {DOMError} [err] if promise is rejected
 */
sklad.deleteDatabase(dbName).then(...);
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
database.insert('obj_store_title', data).then(...);
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
database.insert('obj_store_title', data).then(...);
```

Otherwise Sklad library will generate this value.

**SAMPLE USE CASE:** non-structured data with a need for your own primary keys.

# Examples?
[Of course](http://1999.github.io/sklad). Btw, [detailed docs](https://github.com/1999/sklad/tree/master/docs) contain nice pieces of code using Sklad library.

# Any tests?
Tests are located in [tests](https://github.com/1999/sklad/tree/master/tests) folder. You can run them with `npm test`. Tests are written with Jasmine testing framework and run with Karma runner. You need to have SauceLabs account to run tests in multiple browsers.

# Development/release process
 * Watcher is started with `npm run watch`
 * Release files are built with `npm run release`
