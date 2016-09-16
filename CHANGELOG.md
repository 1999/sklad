## 4.2.2

 * fix: race condition when using multiple connections for one database

## 4.2.1

 * if you're using ES2015 modules, you can now import `sklad/es2015`
 * support for Rollup's [jsnext:main](https://github.com/rollup/rollup/wiki/jsnext:main) introduced

## 4.2.0

 * new: support for service workers introduced
 * bower config removed, you should install `sklad` with npm or access it via https://unpkg.com/ instead
 * main exported file is now ES5-compatible code

## 4.1.1

 * broken get operations within multiple stores fixed

## 4.1.0

`Get` operations are now using [IDBObjectStore.prototype.getAll](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll) internally in all browsers which support this API. Currently these browsers are stable Chromium-based and Firefox. This API is activated when you run fetch operations without index and special direction (e.g. when only `limit`, `offset` or `range` are specified). [JSPerf test](http://jsperf.com/idb-idbcursor-vs-idbobjectstore-getall-ops/3) shows that you get 200%-1000% speed increase for your get operations when using this API, so it's time to update `sklad` to this version :)

## 4.0.0

A huge work has been done to support library in all major browsers. Now Sklad supports stable versions of Chrome, Firefox, IE11 in Win8/10, Microsoft Edge, Safari9 desktop/mobile and Android browser. All tests run in SauceLabs platform for continuous integration through TravisCI. Special thanks goes to [Paul Kilmurray](https://github.com/kilbot), you're the man!

Short list of changes:

* **breaking change**: promises now reject with Error instances, not DOMError. The reason for this is that interface is supported only in Firefox/Chrome. If you checked `name` field of `err` to understand what kind of error occured, nothing changes for you ([related commit](https://github.com/1999/sklad/commit/5ddd46ae53bb81dfe880f3f77d84751ee566837e))
* **new**: support for IE11 and Microsoft Edge introduced
* **new**: support for Safari9 introduced
* **new**: support for Firefox introduced
* I got rid of separate Makefile and now all targets are described inside `package.json` which is more natural to Javascript project ([related commit](https://github.com/1999/sklad/commit/cc30b51b40f978623648a01e7cd3d27862127adc))

Check this PR if you want to see all changes: https://github.com/1999/sklad/pull/15/files

### IE support
`sklad` is now working in IE11 and Microsoft Edge browsers. Still there is one browser bug which cannot be fixed inside library: both IE11 and Edge don't support multiEntry indexes ([more info](https://dev.windows.com/en-us/microsoft-edge/platform/status/indexeddbarraysandmultientrysupport)). Other library features like working with data, upgrading database and others work as expected. An absence of `autoIncrement` field in IDBObjectStore (both IE11 and Edge) is patched inside library ([related commit](https://github.com/1999/sklad/commit/91c6259cde40df213e324d4143007e0f521b4fef), [bug](https://connect.microsoft.com/IE/Feedback/Details/772726)).

IE11 is missing support for native Promise, so you should add some. I was using [promise-polyfill](https://www.npmjs.com/package/promise-polyfill) inside my tests mostly because it's simple and doesn't replace native Promise with its own implementation.

### Safari9 support
Safari8 IndexedDB implementation is [buggy](https://github.com/dfahlander/Dexie.js/wiki/IndexedDB-on-Safari) and is not available to be replaced/shimmed with [indexeddbshim](https://www.npmjs.com/package/indexeddbshim) so I had to give up on its support. Still IndexedDB implementation in Safari9 is quite okay and `sklad` is now working in these browsers (desktop/mobile). Still there are some browser bugs which you should keep in mind:

 * Safari doesn't throw ConstraintErrors for unique keys ([link](https://bugs.webkit.org/show_bug.cgi?id=149107), [test](https://github.com/1999/sklad/blob/4c441ecff0fb47d0933c3a6a388dbfce7e2c4bbd/tests/insert.js#L55))
 * Safari 9.0.0 doesn't expose existing indexes in 2+ `upgradeneeded` ([link](https://bugs.webkit.org/show_bug.cgi?id=155045)). So you can't use indexNames of object store inside versionchange transaction.
 * Safari 9.0.3 replaces indexes in 2+ versionchange transaction ([link](http://jsbin.com/duribuvece/edit?js,console)). This is fixed in current Webkit Nightly. So you should better create all indexes during first migration.

Safari also fails to work with multiple object stores inside one transaction, but I made a patch for this inside `sklad` library ([related commit](https://github.com/1999/sklad/commit/41b61173b0c55f6b15791f59034a616e238793de)).

### Firefox support
Tests are now passing in Firefox.

## 3.0.0

 * Sklad is now built with Webpack. Library code is now transpiled from ES2015 into ES5 which leads to some overhead. New release has new major version only for safety reasons: no new changes are introduced, all tests passed :smiley:

## 2.0.0

 * new: promises support added
 * **breaking change**: old node-style API is now used only in 1.x branch releases

## 1.3.0

 * insert, delete, upsert and clear methods don't fail if no callbck is supplied ([#10](https://github.com/1999/sklad/issues/10))

## 1.2.1

 * obsolete `DOMStringList.prototype.contains` replaced with `Array.prototype.indexOf` search ([#7](https://github.com/1999/sklad/issues/7))

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
