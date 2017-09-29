/**
 * Copyright (c) 2013-2017 Dmitry Sorin <info@staypositive.ru>
 * https://github.com/1999/sklad
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @author Dmitrii Sorin <info@staypositive.ru>
 * @license http://www.opensource.org/licenses/mit-license.html MIT License
 */
import {
    createError,
    ensureError,
    idbRequestToPromise,
    KeyValueContainer,
    resolveAllPromises,
    uuid,
} from './util';

import {
    indexedDbRef,
    IDBKeyRangeRef,
    TRANSACTION_READONLY,
    TRANSACTION_READWRITE,
    SORT_ASC as ASC,
    SORT_ASC_UNIQUE as ASC_UNIQUE,
    SORT_DESC as DESC,
    SORT_DESC_UNIQUE as DESC_UNIQUE,
} from './env';

const skladAPI: Sklad = {
    ASC,
    ASC_UNIQUE,
    DESC,
    DESC_UNIQUE,

    /**
     * Deletes database
     */
    async deleteDatabase(dbName: string) {
        if (!indexedDbRef) {
            throw createError('NotSupportedError', 'Your browser doesn\'t support IndexedDB');
        }

        const openDbRequest = indexedDbRef.deleteDatabase(dbName);
        const evt = await idbRequestToPromise(openDbRequest, ['onsuccess', 'onerror', 'onblocked'], []);

        const err = (evt.type === 'blocked')
            ? createError('InvalidStateError', `Database ${dbName} is blocked`)
            : (evt.target as any).error;

        if (err) {
            throw ensureError(err);
        }

        if (evt.type !== 'success') {
            evt.preventDefault();
        }
    },

    keyValue(key, value) {
        return new KeyValueContainer(key, value);
    }
};

// unfortunately `babel-plugin-array-includes` can't convert Array.prototype.includes
// into Array.prototype.indexOf with its code
const indexOf = Array.prototype.indexOf;
const supportsObjStoreGetAll = typeof IDBObjectStore.prototype.getAll === 'function' && typeof IDBObjectStore.prototype.getAllKeys === 'function';
const objStoresMeta = new Map();

/**
 * Checks data before saving it in the object store
 * @return {Boolean} false if saved data type is incorrect, otherwise {Array} object store function arguments
 */
function checkSavedData(dbName, objStore, data) {
    const isKeyValueContainer = data instanceof KeyValueContainer;
    const value = isKeyValueContainer ? data.value : data;
    const objStoreMeta = objStoresMeta.get(dbName).get(objStore.name);
    let key = isKeyValueContainer ? data.key : undefined;

    const keyPath = objStore.keyPath || objStoreMeta.keyPath;
    const autoIncrement = objStore.autoIncrement || objStoreMeta.autoIncrement;

    if (keyPath === null) {
        if (!autoIncrement && key === undefined) {
            key = uuid();
        }
    } else {
        if (typeof data !== 'object') {
            return false;
        }

        // TODO: support dot-separated and array keyPaths
        if (!autoIncrement && data[keyPath] === undefined) {
            data[keyPath] = uuid();
        }
    }

    return key ? [value, key] : [value];
}

/**
 * Check whether database contains all needed stores
 */
function checkContainingStores(objStoreNames: string[]): boolean {
    return objStoreNames.every(function (storeName) {
        return (indexOf.call(this.database.objectStoreNames, storeName) !== -1);
    }, this);
}

/**
 * autoIncrement is broken in IE family. Run this transaction to get its value
 * on every object store
 *
 * @see http://stackoverflow.com/questions/35682165/indexeddb-in-ie11-edge-why-is-objstore-autoincrement-undefined
 * @see https://connect.microsoft.com/IE/Feedback/Details/772726
 */
function getObjStoresMeta(db: IDBDatabase, objStoreNames: string[]): Promise<Event[]> {
    const dbMeta = objStoresMeta.get(db.name);
    const promises: Promise<Event>[] = [];

    objStoreNames.forEach((objStoreName) => {
        if (dbMeta.has(objStoreName)) {
            return;
        }

        const promise: Promise<Event> = new Promise((resolve) => {
            const transaction = db.transaction([objStoreName], TRANSACTION_READWRITE);
            transaction.oncomplete = resolve;
            transaction.onabort = resolve;

            const objStore = transaction.objectStore(objStoreName);

            if (objStore.autoIncrement !== undefined) {
                dbMeta.set(objStoreName, {
                    autoIncrement: objStore.autoIncrement,
                    keyPath: objStore.keyPath
                });

                return;
            }

            let autoIncrement;

            if (objStore.keyPath !== null) {
                // if key path is defined it's possible to insert only objects
                // but if key generator (autoIncrement) is not defined the inserted objects
                // must contain field(s) described in keyPath value otherwise IDBObjectStore.add op fails
                // so if we run ODBObjectStore.add with an empty object and it fails, this means that
                // autoIncrement property was false. Otherwise - true
                // if key path is array autoIncrement property can't be true
                if (Array.isArray(objStore.keyPath)) {
                    autoIncrement = false;
                } else {
                    try {
                        objStore.add({});
                        autoIncrement = true;
                    } catch (ex) {
                        autoIncrement = false;
                    }
                }
            } else {
                // if key path is not defined it's possible to insert any kind of data
                // but if key generator (autoIncrement) is not defined you should set it explicitly
                // so if we run ODBObjectStore.add with one argument and it fails, this means that
                // autoIncrement property was false. Otherwise - true
                try {
                    objStore.add('some value');
                    autoIncrement = true;
                } catch (ex) {
                    autoIncrement = false;
                }
            }

            // save meta properties
            dbMeta.set(objStoreName, {
                autoIncrement: autoIncrement,
                keyPath: objStore.keyPath
            });

            // and abort transaction so that new record is forgotten
            transaction.abort();
        });

        promises.push(promise);
    });

    return Promise.all(promises);
}

const skladConnection = {
    /**
     * 1) Insert one record into the object store
     * @param {String} objStoreName name of object store
     * @param {*} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {*} inserted object key
     *
     * 2) Insert multiple records into the object stores (during one transaction)
     * @param {Object} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Object} inserted objects' keys
     */
    insert: function skladConnection_insert() {
        const isMulti = (arguments.length === 1);
        const objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        let data;
        if (isMulti) {
            data = arguments[0];
        } else {
            data = {};
            data[arguments[0]] = [arguments[1]];
        }

        return getObjStoresMeta(this.database, objStoreNames).then(() => {
            return new Promise((resolve, reject) => {
                const result = {};
                let transaction;
                let abortErr;

                // Safari9 can't run multi-objectstore transactions
                // divide one transaction into many with one object store to fix this
                try {
                    transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
                } catch (ex) {
                    if (ex.name === 'NotFoundError') {
                        const promises = {};

                        objStoreNames.forEach(objStoreName => {
                            const promise = this.insert({
                                [objStoreName]: Array.isArray(data[objStoreName]) ? data[objStoreName] : [data[objStoreName]]
                            }).then(res => res[objStoreName]);

                            promises[objStoreName] = promise;
                        });

                        resolveAllPromises(promises).then(resolve, reject);
                    } else {
                        reject(ex);
                    }

                    return;
                }

                transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_insert_onFinish(evt) {
                    const err = abortErr || evt.target.error;
                    const isSuccess = !err && evt.type === 'complete';

                    if (isSuccess) {
                        resolve(isMulti ? result : result[objStoreNames[0]][0]);
                    } else {
                        reject(ensureError(err));
                    }

                    if (evt.type === 'error') {
                        evt.preventDefault();
                    }
                };

                for (let objStoreName in data) {
                    const objStore = transaction.objectStore(objStoreName);

                    for (let i = 0; i < data[objStoreName].length; i++) {
                        const checkedData = checkSavedData(this.database.name, objStore, data[objStoreName][i]);

                        if (!checkedData) {
                            abortErr = createError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
                            return;
                        }

                        let req;
                        try {
                            req = objStore.add.apply(objStore, checkedData);
                        } catch (ex) {
                            abortErr = ex;
                            continue;
                        }

                        req.onsuccess = function (evt) {
                            result[objStoreName] = result[objStoreName] || [];
                            result[objStoreName][i] = evt.target.result;
                        };
                    }
                }
            });
        });
    },

    /**
     * 1) Insert or update one record in the object store
     * @param {String} objStoreName name of object store
     * @param {*} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {*} inserted/updated object key otherwise
     *
     * 2) Insert or update multiple records in the object stores (during one transaction)
     * @param {Object} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Object} inserted/updated objects' keys otherwise
     */
    upsert: function skladConnection_upsert() {
        const isMulti = (arguments.length === 1);
        const objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        let data;
        if (isMulti) {
            data = arguments[0];
        } else {
            data = {};
            data[arguments[0]] = [arguments[1]];
        }

        return getObjStoresMeta(this.database, objStoreNames).then(() => {
            return new Promise((resolve, reject) => {
                const result = {};
                let transaction;
                let abortErr;

                // Safari9 can't run multi-objectstore transactions
                // divide one transaction into many with one object store to fix this
                try {
                    transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
                } catch (ex) {
                    if (ex.name === 'NotFoundError') {
                        const promises = {};

                        objStoreNames.forEach(objStoreName => {
                            const promise = this.upsert({
                                [objStoreName]: Array.isArray(data[objStoreName]) ? data[objStoreName] : [data[objStoreName]]
                            }).then(res => res[objStoreName]);

                            promises[objStoreName] = promise;
                        });

                        resolveAllPromises(promises).then(resolve).catch(reject);
                    } else {
                        reject(ex);
                    }

                    return;
                }

                transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_upsert_onFinish(evt) {
                    const err = abortErr || evt.target.error;
                    const isSuccess = !err && evt.type === 'complete';

                    if (isSuccess) {
                        resolve(isMulti ? result : result[objStoreNames[0]][0]);
                    } else {
                        reject(ensureError(err));
                    }

                    if (evt.type === 'error') {
                        evt.preventDefault();
                    }
                };

                for (let objStoreName in data) {
                    const objStore = transaction.objectStore(objStoreName);

                    for (let i = 0; i < data[objStoreName].length; i++) {
                        const checkedData = checkSavedData(this.database.name, objStore, data[objStoreName][i]);

                        if (!checkedData) {
                            abortErr = createError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
                            return;
                        }

                        let req;
                        try {
                            req = objStore.put.apply(objStore, checkedData);
                        } catch (ex) {
                            abortErr = ex;
                            continue;
                        }

                        req.onsuccess = function (evt) {
                            result[objStoreName] = result[objStoreName] || [];
                            result[objStoreName][i] = evt.target.result;
                        };
                    }
                }
            });
        });
    },

    /**
     * 1) Delete one record from the object store
     * @param {String} objStoreName name of object store
     * @param {Mixed} key
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *
     * 2) Delete multiple records from the object stores (during one transaction)
     * @param {Object} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *
     * ATTENTION: you can pass only VALID KEYS OR KEY RANGES to delete records
     * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-valid-key
     * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
     */
    delete: function skladConnection_delete() {
        const isMulti = (arguments.length === 1);
        const objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        let data;
        if (isMulti) {
            data = arguments[0];
        } else {
            data = {};
            data[arguments[0]] = [arguments[1]];
        }

        return new Promise((resolve, reject) => {
            let transaction;
            let abortErr;

            // Safari9 can't run multi-objectstore transactions
            // divide one transaction into many with one object store to fix this
            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            } catch (ex) {
                if (ex.name === 'NotFoundError') {
                    const promises = objStoreNames.map(objStoreName => this.delete(objStoreName, data[objStoreName]));
                    Promise.all(promises).then(() => resolve()).catch(reject);
                } else {
                    reject(ex);
                }

                return;
            }

            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_delete_onFinish(evt) {
                const err = abortErr || evt.target.error;

                if (err) {
                    reject(ensureError(err));
                } else {
                    resolve();
                }

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (let objStoreName in data) {
                const objStore = transaction.objectStore(objStoreName);

                data[objStoreName].forEach(recordKey => {
                    if (abortErr) {
                        return;
                    }

                    try {
                        objStore.delete(recordKey);
                    } catch (ex) {
                        abortErr = ex;
                    }
                });
            }
        });
    },

    /**
     * Clear object store(s)
     *
     * @param {Array|String} objStoreNames array of object stores or a single object store
     * @return {Promise}
     *   @param {Error} err
     */
    clear: function skladConnection_clear(objStoreNames) {
        objStoreNames = Array.isArray(objStoreNames) ? objStoreNames : [objStoreNames];

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        return new Promise((resolve, reject) => {
            let transaction;
            let abortErr;

            // Safari9 can't run multi-objectstore transactions
            // divide one transaction into many with one object store to fix this
            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            } catch (ex) {
                if (ex.name === 'NotFoundError') {
                    const promises = objStoreNames.map(objStoreName => this.clear([objStoreName]));
                    Promise.all(promises).then(() => resolve()).catch(reject);
                } else {
                    reject(ex);
                }

                return;
            }

            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_clear_onFinish(evt) {
                const err = abortErr || evt.target.error;

                if (err) {
                    reject(ensureError(err));
                } else {
                    resolve();
                }

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            objStoreNames.forEach(objStoreName => {
                const objStore = transaction.objectStore(objStoreName);

                if (abortErr) {
                    return;
                }

                try {
                    objStore.clear();
                } catch (ex) {
                    abortErr = ex;
                }
            });
        });
    },

    /**
     * 1) Get objects from one object store
     * @param {String} objStoreName name of object store
     * @param {Object} options (optional) object with keys 'index', 'range', 'offset', 'limit' and 'direction'
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Array} stored objects otherwise
     *
     * 2) Get objects from multiple object stores (during one transaction)
     * @param {Object} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Object} stored objects otherwise
     */
    get: function skladConnection_get() {
        const isMulti = (arguments.length === 1 && typeof arguments[0] === 'object');
        const objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        let result = {};
        let data, abortErr;

        if (isMulti) {
            data = arguments[0];
        } else {
            data = {};
            data[arguments[0]] = arguments[1];
        }

        objStoreNames.forEach(function (objStoreName) {
            result[objStoreName] = [];
        });

        return new Promise((resolve, reject) => {
            let transaction;

            // Safari9 can't run multi-objectstore transactions
            // divide one transaction into many with one object store to fix this
            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READONLY);
            } catch (ex) {
                if (ex.name === 'NotFoundError') {
                    const promises = {};

                    objStoreNames.forEach(objStoreName => {
                        const promise = this.get(objStoreName, data[objStoreName]);
                        promises[objStoreName] = promise;
                    });

                    resolveAllPromises(promises).then(resolve).catch(reject);
                } else {
                    reject(ex);
                }

                return;
            }

            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_get_onFinish(evt) {
                const err = abortErr || evt.target.error;
                const isSuccess = !err && evt.type === 'complete';

                if (isSuccess) {
                    resolve(isMulti ? result : result[objStoreNames[0]]);
                } else {
                    reject(ensureError(err));
                }

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (let objStoreName in data) {
                const objStore = transaction.objectStore(objStoreName);
                const options = data[objStoreName] || {};
                const direction = options.direction || skladAPI.ASC;
                const range = options.range instanceof IDBKeyRangeRef ? options.range : null;

                let useGetAll = false;
                let iterateRequest;

                if (supportsObjStoreGetAll) {
                    // getAll doesn't work for index ranges + it doesn't support special directions
                    // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
                    useGetAll = Object.keys(options).every(key => (key !== 'index' && key !== 'direction'));
                }

                if (options.index) {
                    if (!objStore.indexNames.contains(options.index)) {
                        abortErr = createError('NotFoundError', `Object store ${objStore.name} doesn't contain "${options.index}" index`);
                        return;
                    }

                    try {
                        iterateRequest = objStore.index(options.index).openCursor(range, direction);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                } else if (useGetAll) {
                    // If browser supports getAll/getAllKeys methods it could be faster to run these methods
                    // to get all records if there's no `index` or `direction` options set
                    // Unfortunately getAll doesn't expose result keys so we have to run both these methods
                    // to get all keys and values
                    // Anyway it seems like 2 getAll* ops are faster in modern browsers than that one
                    // working with UDBCursor
                    //
                    // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
                    // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAllKeys
                    // @see http://jsperf.com/idb-idbcursor-vs-idbobjectstore-getall-ops/3
                    const args = [range];
                    let offset = 0;

                    if (options.limit) {
                        args.push(options.limit);

                        if (options.offset) {
                            args[1] += options.offset;
                            offset = options.offset;
                        }
                    }

                    try {
                        // get all values request
                        objStore.getAll(...args).onsuccess = function (evt) {
                            const values = evt.target.result;

                            values.forEach((value, index) => {
                                if (index < offset) {
                                    return;
                                }

                                const resultIndex = index - offset;
                                result[objStoreName][resultIndex] = result[objStoreName][resultIndex] || {};
                                result[objStoreName][resultIndex].value = value;
                            });
                        };

                        // get all keys request
                        objStore.getAllKeys(...args).onsuccess = function (evt) {
                            const keys = evt.target.result;

                            keys.forEach((key, index) => {
                                if (index < offset) {
                                    return;
                                }

                                const resultIndex = index - offset;
                                result[objStoreName][resultIndex] = result[objStoreName][resultIndex] || {};
                                result[objStoreName][resultIndex].key = key;
                            });
                        };
                    } catch (ex) {
                        abortErr = ex;
                    }

                    // there are 2 separate IDBRequests running
                    // so there's no need to bind listener to success event of any of them
                    continue;
                } else {
                    try {
                        iterateRequest = objStore.openCursor(range, direction);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                }

                let cursorPositionMoved = false;

                iterateRequest.onsuccess = function (evt) {
                    const cursor = evt.target.result;

                    // no more results
                    if (!cursor) {
                        return;
                    }

                    if (options.offset && !cursorPositionMoved) {
                        cursorPositionMoved = true;
                        cursor.advance(options.offset);

                        return;
                    }

                    result[objStoreName].push({
                        key: cursor.key,
                        value: cursor.value
                    });

                    if (options.limit && options.limit === result[objStoreName].length) {
                        return;
                    }

                    cursor.continue();
                };
            }
        });
    },

    /**
     * 1) Count objects in one object store
     * @param {String} objStoreName name of object store
     * @param {Object} options (optional) object with keys 'index' or/and 'range'
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Number} number of stored objects otherwise
     *
     * 2) Count objects in multiple object stores (during one transaction)
     * @param {Object} data
     * @return {Promise}
     *   @param {Error} [err] if promise is rejected
     *   @param {Object} number of stored objects otherwise
     */
    count: function skladConnection_count() {
        const isMulti = (arguments.length === 1 && typeof arguments[0] === 'object');
        const objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
        let data;

        if (isMulti) {
            data = arguments[0];
        } else {
            data = {};
            data[arguments[0]] = (typeof arguments[1] === 'function') ? null : arguments[1];
        }

        const allObjStoresExist = checkContainingStores.call(this, objStoreNames);
        if (!allObjStoresExist) {
            const err = createError('NotFoundError', `Database ${this.database.name} (version ${this.database.version}) doesn't contain all needed stores`);
            return Promise.reject(err);
        }

        return new Promise((resolve, reject) => {
            const result = {};
            let transaction;
            let countRequest;
            let abortErr;

            // Safari9 can't run multi-objectstore transactions
            // divide one transaction into many with one object store to fix this
            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READONLY);
            } catch (ex) {
                if (ex.name === 'NotFoundError') {
                    const promises = {};

                    objStoreNames.forEach(objStoreName => {
                        const promise = this.count(objStoreName, data[objStoreName]);
                        promises[objStoreName] = promise;
                    });

                    resolveAllPromises(promises).then(resolve).catch(reject);
                } else {
                    reject(ex);
                }

                return;
            }

            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_count_onFinish(evt) {
                const err = abortErr || evt.target.error;
                const isSuccess = !err && evt.type === 'complete';

                if (isSuccess) {
                    resolve(isMulti ? result : result[objStoreNames[0]]);
                } else {
                    reject(ensureError(err));
                }

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (let objStoreName in data) {
                const objStore = transaction.objectStore(objStoreName);
                const options = data[objStoreName] || {};
                const rangeArgs = (options.range instanceof IDBKeyRangeRef) ? [options.range] : [];

                if (options.index) {
                    if (!objStore.indexNames.contains(options.index)) {
                        abortErr = createError('NotFoundError', `Object store ${objStore.name} doesn't contain "${options.index}" index`);
                        return;
                    }

                    try {
                        const index = objStore.index(options.index);
                        countRequest = index.count(...rangeArgs);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                } else {
                    try {
                        countRequest = objStore.count(...rangeArgs);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                }

                countRequest.onsuccess = function (evt) {
                    result[objStoreName] = evt.target.result || 0;
                };
            }
        });
    },

    /**
     * Close IndexedDB connection
     */
    close: function skladConnection_close() {
        this.database.close();
        delete this.database;
    }
};

/**
 * Opens connection to a database
 *
 * @param {String} dbName database name
 * @param {Object} [options = {}] connection options
 * @param {Number} [options.version] database version
 * @param {Object} [options.migration] migration scripts
 * @return {Promise}
 *   @param {Object} [conn] if - promise is resolved
 *   @param {Error} [err] - if promise is rejected
 */
skladAPI.open = function sklad_open(dbName, options = {version: 1}) {
    return new Promise((resolve, reject) => {
        if (!indexedDbRef) {
            reject(createError('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
            return;
        }

        const openConnRequest = indexedDbRef.open(dbName, options.version);
        let isResolvedOrRejected = false;

        openConnRequest.onupgradeneeded = function (evt) {
            if (isResolvedOrRejected) {
                return;
            }

            options.migration = options.migration || {};
            for (let i = evt.oldVersion + 1; i <= evt.newVersion; i++) {
                if (!options.migration[i])
                    continue;

                options.migration[i].call(this, this.result);
            }
        };

        openConnRequest.onerror = function (evt) {
            if (isResolvedOrRejected) {
                return;
            }

            evt.preventDefault();
            reject(ensureError(evt.target.error));

            isResolvedOrRejected = true;
        };

        openConnRequest.onsuccess = function () {
            if (isResolvedOrRejected) {
                return;
            }

            const database = this.result;
            const oldVersion = parseInt(database.version || 0, 10);

            if (typeof database.setVersion === 'function' && oldVersion < options.version) {
                const changeVerRequest = database.setVersion(options.version);

                changeVerRequest.onsuccess = function (evt) {
                    const customUpgradeNeededEvt = new Event('upgradeneeded');
                    customUpgradeNeededEvt.oldVersion = oldVersion;
                    customUpgradeNeededEvt.newVersion = options.version;
                    openConnRequest.onupgradeneeded.call({result: evt.target.source}, customUpgradeNeededEvt);

                    database.close();
                    skladAPI.open(dbName, options).then(resolve, reject);
                };

                changeVerRequest.onerror = function (evt) {
                    const err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                    reject(ensureError(err));
                };

                return;
            }

            // store object stores properties in their own map
            if (!objStoresMeta.has(dbName)) {
                objStoresMeta.set(dbName, new Map);
            }

            resolve(Object.create(skladConnection, {
                database: {
                    configurable: true,
                    enumerable: false,
                    value: database,
                    writable: false
                }
            }));

            isResolvedOrRejected = true;
        };

        openConnRequest.onblocked = function (evt) {
            if (isResolvedOrRejected) {
                return;
            }

            evt.preventDefault();

            reject(createError('InvalidStateError', `Database ${dbName} is blocked`));
            isResolvedOrRejected = true;
        };
    });
};

export default skladAPI;
