## 1.2.0

 * new: `this` in migration scripts now refers to IDBOpenDBRequest so that you can create indexes on top of already created object stores. Check out [docs](https://github.com/1999/sklad/blob/master/docs/README_sklad_open.md) for more info.

## 1.1.0

 * new: `sklad.deleteDatabase()` method

## 1.0.0

 * new: full tests coverage with Travis CI: [Travis CI](https://travis-ci.org/1999/sklad), [tests](https://github.com/1999/sklad/tree/master/tests)
 * new: CommonJS module syntax support
 * new: `skladConnection.close()` method to explicitly close existing connection ([#3](https://github.com/1999/sklad/issues/3))
 * new: semver support
 * new: `blocked` event support with `InvalidStateError` DOMError
 * fix: callbacks with errors could run more than once
 * fix: external docs page contains close to truth examples ([#2](https://github.com/1999/sklad/issues/2))
 * **breaking change**: callbacks are now invoked with [DOMError](https://developer.mozilla.org/en/docs/Web/API/DOMError) instance as a first argument if error happens during operation, previously it could be either `String` or `Error`. Check out [docs](https://github.com/1999/sklad/tree/master/docs) for examples.
 * **breaking change**: `skladConnection.get()` invokes callback with not objects but array with objects with `key` and `value` keys ([details](https://github.com/1999/sklad/blob/master/docs/README_skladConnection_get.md)). Previously it was an object and this was a design error.

## 0.2.1

 * new: AMD module syntax support

## 0.2.0

 * new: [setVersion API](https://developer.mozilla.org/en-US/docs/Web/API/IDBVersionChangeRequest.setVersion) support. This API was used in old Chromes to run migrations

## 0.1.0

 * first release version
 * published in bower registry
