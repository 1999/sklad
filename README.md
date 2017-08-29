# Sklad: Promise-based API for IndexedDB

[![Build Status](https://img.shields.io/travis/1999/sklad/master.svg)](https://travis-ci.org/1999/sklad)
[![DevDependency Status](http://img.shields.io/david/dev/1999/sklad/master.svg)](https://david-dm.org/1999/sklad#info=devDependencies)
[![Greenkeeper badge](https://badges.greenkeeper.io/1999/sklad.svg)](https://greenkeeper.io/)

Sklad library makes work with IndexedDB less weird by providing a tiny Promise-based API on top of IndexedDB. If your browser doesn't support promises you can include [polyfill](https://www.npmjs.com/package/promise-polyfill) for this.

Starting from 4.0.0 Sklad library is working in all major browsers: Chrome, Firefox, IE11, Microsoft Edge, Safari9 and Android browser. Still there are some browser issues for IE11, Microsoft Edge and Safari9 which can't be patched inside library. Read [changelog](https://github.com/1999/sklad/blob/master/CHANGELOG.md#400) for more info.

If you're using Sklad with a bundler like Webpack or Rollup, you can either `import sklad from 'sklad/es2015'` or even import as is if your bundler supports [jsnext:main](https://github.com/rollup/rollup/wiki/jsnext:main). Otherwise UMD code will be used.

## Open database ([details](https://github.com/1999/sklad/blob/master/docs/README_sklad_open.md))
```javascript
const conn = await sklad.open(dbName, {
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
});
```

## Insert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_insert.md))
```javascript
const conn = await sklad.open(dbName, options);

// insert one document into store
const insertedKey = await conn.insert(objStoreName, 'hello world');

// insert data into multiple stores inside one transaction
const insertedKeys = await conn.insert({
    users: [
        {email: 'example1@gmail.com', firstname: 'John'},
        {email: 'example2@gmail.com', firstname: 'Jack'},
        {email: 'example3@gmail.com', firstname: 'Peter'},
    ],
    foo_obj_store: ['truly', 'madly', 'deeply']
});

assert.equal(insertedKeys, {
    users: [id1, id2, id3],
    foo_obj_store: [id4, id5, id6]
});
```

## Upsert one or multiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_upsert.md))
```javascript
const conn = await sklad.open(dbName, options);

// upsert one document inside store
const upsertedKey = await conn.upsert(objStoreName, {id: 'BMTH', bandMembersCount: 5})

// upsert data in multiple stores inside one transaction
const upsertedKeys = await conn.upsert({
    users: [
        {email: 'example1@gmail.com', firstname: 'John'},
        {email: 'example2@gmail.com', firstname: 'Jack'},
        {email: 'example3@gmail.com', firstname: 'Peter'},
    ],
    foo_obj_store: ['truly', 'madly', 'deeply']
});

assert.equal(insertedKeys, {
    users: [id1, id2, id3],
    foo_obj_store: [id4, id5, id6]
});
```

## Delete one or mutiple records ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_delete.md))
```javascript
const conn = await sklad.open(dbName, options);

// delete document from the object store
await conn.delete(objStoreName, 'key');

// delete multiple documents from different object stores inside one transaction
await conn.delete({
    objStoreName1: ['key_1', 'key_2', 'key_3'],
    objStoreName2: ['key1']
});
```

## Clear one or multiple object stores ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_clear.md))
```javascript
const conn = await sklad.open(dbName, options);

// clear everything in one object store
await conn.clear(objStoreName);

// clear everything in multiple object stores
await conn.clear([objStoreName1, objStoreName2]);
```

## Get records from the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_get.md))
Beware: if you use `index` or `direction` options in your request then fast `IDBObjectStore.prototype.getAll()` API is not used. This is still okay in most cases. More info [here](https://github.com/1999/sklad/releases/tag/4.1.0).

```javascript
const conn = await sklad.open(dbName, options);

// get documents from one object store
const resOneStore = await conn.get(objStoreName, {
    index: 'missing_index', // index name, optional
    direction: sklad.ASC_UNIQUE, // one of: ASC, ASC_UNIQUE, DESC, DESC_UNIQUE, optional
    limit: 4, // optional
    offset: 1, // optional
    range: IDBKeyRange.only('some_key') // range, instance of IDBKeyRange, optional
});

assert.equal(resOneStore, {
    [objStoreName]: [
        {key: ..., value: ...},
        {key: ..., value: ...},
        ...
    ]
});

// get documents from multiple stores in one transaction
const resMultipleStores = await conn.get({
    objStoreName1: {},
    objStoreName1: {limit: 1, offset: 1}
});

assert.equal(resMultipleStores, {
    objStoreName1: [{key: ..., value: ...}, ...],
    objStoreName2: [{key: ..., value: ...}, ...]
});
```

## Count objects in the object store(s) ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_count.md))
```javascript
const conn = await sklad.open(dbName, options);

// count documents inside one object store
const total = await conn.count(objStoreName, {
    range: IDBKeyRange.bound(x, y, true, true), // range, instance of IDBKeyRange, optional
    index: 'index_name' // index name, optional
});

// count documents inside multiple object stores
const res = await conn.count({
    objStoreName1: null,
    objStoreName2: {index: 'index_name'}
});

assert.equal(res, {
    objStoreName1: NUMBER_OF_DOCUMENTS_INSIDE_objStoreName1,
    objStoreName2: NUMBER_OF_DOCUMENTS_INSIDE_objStoreName2
});
```

## Close existing database connection ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_close.md))
```javascript
const conn = await sklad.open(dbName, options);
conn.close(); // it's sync
```

## Delete database
```javascript
await sklad.deleteDatabase(dbName)
```

# Structuring the database
You can specify `keyPath` and `autoIncrement` fields in `IDBDatabase.prototype.createObjectStore()` inside migration code. **Key path** (`keyPath`) is just a name of the field inside the objects which you store in the object store. For instance, it can be `foo` for object `{foo: 'bar'}`. **Key generator** (`autoIncrement`) is just a name for auto incrementing counter which is used as a primary key. Both of them (key path and key generator) can be used as primary keys for the records stored in the object stores.

More info on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Structuring_the_database).

## key path used, no key generator (objects with mandatory field)
```javascript
const objStore = database.createObjectStore('obj_store_title', {keyPath: 'field_name'});
```
In this case you **must** store **only objects** in the object store. You **can** specify `field_name` in the stored objects and its value will be used as a primary key for them. If you don't specify it, Sklad library will generate this field's value for you.

**SAMPLE USE CASE:** a database of users with unique logins and each user can be represented as an object with fields "firstname", "lastname", "login", "phone" etc.

## no key path, key generator used (any data, autoincremented primary key)
```javascript
const objStore = database.createObjectStore('obj_store_title', {autoIncrement: true});
```
In this case you **can** store any type of data in the object store. Primary key for the new created record will be generated by the auto incrementing key generator, but you also **can** specify your own primary key like this:
```javascript
const data = sklad.keyValue('your_unique_key', value);
database.insert('obj_store_title', data).then(...);
```

**SAMPLE USE CASE:** a simple set of data or even hierarchical objects which don't need a special field to be unique.

## key path used, key generator used (objects with optional primary key field)
```javascript
const objStore = database.createObjectStore('obj_store_title', {
    keyPath: 'field_name',
    autoIncrement: true
});
```
In this case you **must** store only objects in the object store. You **can** specify `field_name` in the stored objects and its value will be used as a primary key for them. If you don't specify it, its value will be an auto incremented value produced by the key generator.

**SAMPLE USE CASE:** set of hierarchical objects, which don't have a unique field.

## no keypath, no key generator (any data, primary key anarchy)
```javascript
const objStore = database.createObjectStore('obj_store_title');
```
In this case you **can** store **any type of data** in the object store. You **can** also specify a key to be used as a primary key for the record like this:
```javascript
var data = sklad.keyValue('your_unique_key', value);
database.insert('obj_store_title', data).then(...);
```

Otherwise Sklad library will generate this value for you.

**SAMPLE USE CASE:** non-structured data with a need for your own primary keys.

# Examples
[Detailed docs](https://github.com/1999/sklad/tree/master/docs) contain nice pieces of code using Sklad library.

# Tests
Tests are written with Jasmine testing framework and run with Karma runner. You need to have SauceLabs account to run tests in multiple browsers.

# Development/release process
 * Watcher is started with `yarn watch`
 * Release files are built with `yarn release`
