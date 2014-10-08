/**
 * Copyright (c) 2013-2014 Dmitry Sorin <info@staypositive.ru>
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
 * @author Dmitry Sorin <info@staypositive.ru>
 * @license http://www.opensource.org/licenses/mit-license.html MIT License
 */
(function (root, factory) {
    if (typeof module !== 'undefined' && typeof module.exports === 'object') {
        // CommonJS, just export
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.sklad = factory();
    }
}(this, function () {
    'use strict';

    if (!window.indexedDB)
        window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    if (!window.IDBTransaction)
        window.IDBTransaction = window.mozIDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;

    if (!window.IDBKeyRange)
        window.IDBKeyRange = window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.IDBCursor)
        window.IDBCursor = window.mozIDBCursor || window.webkitIDBCursor || window.msIDBCursor;

    var TRANSACTION_READONLY = window.IDBTransaction.READ_ONLY || 'readonly';
    var TRANSACTION_READWRITE = window.IDBTransaction.READ_WRITE || 'readwrite';

    var skladAPI = {};
    skladAPI.ASC = window.IDBCursor.NEXT || 'next';
    skladAPI.ASC_UNIQUE = window.IDBCursor.NEXT_NO_DUPLICATE || 'nextunique';
    skladAPI.DESC = window.IDBCursor.PREV || 'prev';
    skladAPI.DESC_UNIQUE = window.IDBCursor.PREV_NO_DUPLICATE || 'prevunique';

    /**
     * Generates UUIDs for objects without keys set
     * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
     */
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = (c == 'x') ? r : (r&0x3|0x8);

            return v.toString(16);
        });
    }

    /**
     * Common ancestor for objects created with sklad.keyValue() method
     * Used to distinguish standard objects with "key" and "value" fields from special ones
     */
    var skladKeyValueContainer = Object.create(null);

    /**
     * Checks data before saving it in the object store
     * @return {Boolean} false if saved data type is incorrect, otherwise {Array} object store function arguments
     */
    function checkSavedData(objStore, data) {
        var keyValueContainer = Object.prototype.isPrototypeOf.call(skladKeyValueContainer, data);
        var key = keyValueContainer ? data.key : undefined;
        var value = keyValueContainer ? data.value : data;

        if (objStore.keyPath === null) {
            if (!objStore.autoIncrement && key === undefined) {
                key = uuid();
            }
        } else {
            if (typeof data !== 'object')
                return false;

            if (!objStore.autoIncrement && data[objStore.keyPath] === undefined) {
                data[objStore.keyPath] = uuid();
            }
        }

        return key ? [value, key] : [value];
    }

    // @todo how to create indicies on existing object store / delete them?

    var skladConnection = {
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
        insert: function skladConnection_insert() {
            var isMulti = (arguments.length === 2);
            var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = isMulti ? arguments[1] : arguments[2];
            var result = {};
            var callbackRun = false;
            var data, abortErr;

            if (isMulti) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = (typeof arguments[1] === 'function') ? null : arguments[1];
            }

            var contains = DOMStringList.prototype.contains.bind(this.database.objectStoreNames);
            if (!objStoreNames.every(contains)) {
                var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
                callback(err);

                return;
            }

            var transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_insert_onFinish(evt) {
                if (callbackRun) {
                    return;
                }

                var err = abortErr || evt.target.error;
                var isSuccess = !err && evt.type === 'complete';

                if (isSuccess) {
                    callback(null, isMulti ? result : result[objStoreNames[0]]);
                } else {
                    callback(err);
                }

                callbackRun = true;

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (var objStoreName in data) {
                var objStore = transaction.objectStore(objStoreName);

                for (var i = 0; i < data[objStoreName].length; i++) {
                    var checkedData = checkSavedData(objStore, data[objStoreName][i]);

                    if (!checkedData) {
                        abortErr = new DOMError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
                        return;
                    }

                    (function (objStoreName, i) {
                        try {
                            var req = objStore.add.apply(objStore, checkedData);
                        } catch (ex) {
                            abortErr = ex;
                            return;
                        }

                        req.onsuccess = function (evt) {
                            result[objStoreName] = result[objStoreName] || [];
                            result[objStoreName][i] = evt.target.result;
                        };
                    })(objStoreName, i);
                }
            }
        },

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
        upsert: function skladConnection_upsert() {
            var isMulti = (arguments.length === 2);
            var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = isMulti ? arguments[1] : arguments[2];
            var result = {};
            var callbackRun = false;
            var data, abortErr;

            if (isMulti) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = [arguments[1]];
            }

            var contains = DOMStringList.prototype.contains.bind(this.database.objectStoreNames);
            if (!objStoreNames.every(contains)) {
                var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
                callback(err);

                return;
            }

            var transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_upsert_onFinish(evt) {
                if (callbackRun) {
                    return;
                }

                var err = abortErr || evt.target.error;
                var isSuccess = !err && evt.type === 'complete';

                if (isSuccess) {
                    callback(null, isMulti ? result : result[objStoreNames[0]]);
                } else {
                    callback(err);
                }

                callbackRun = true;

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (var objStoreName in data) {
                var objStore = transaction.objectStore(objStoreName);

                for (var i = 0; i < data[objStoreName].length; i++) {
                    var checkedData = checkSavedData(objStore, data[objStoreName][i]);

                    if (!checkedData) {
                        abortErr = new DOMError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
                        return;
                    }

                    (function (objStoreName, i) {
                        try {
                            var req = objStore.put.apply(objStore, checkedData);
                        } catch (ex) {
                            abortErr = ex;
                            return;
                        }

                        req.onsuccess = function (evt) {
                            result[objStoreName] = result[objStoreName] || [];
                            result[objStoreName][i] = evt.target.result;
                        };
                    })(objStoreName, i);
                }
            }
        },

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
        delete: function skladConnection_delete() {
            var isMulti = (arguments.length === 2);
            var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = isMulti ? arguments[1] : arguments[2];
            var callbackRun = false;
            var data;

            if (isMulti) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = [arguments[1]];
            }

            var contains = DOMStringList.prototype.contains.bind(this.database.objectStoreNames);
            if (!objStoreNames.every(contains)) {
                var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
                callback(err);

                return;
            }

            var transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_delete_onFinish(evt) {
                if (callbackRun) {
                    return;
                }

                var err = abortErr || evt.target.error;
                var isSuccess = !err && evt.type === 'complete';

                callback(isSuccess ? undefined : err);
                callbackRun = true;

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (var objStoreName in data) {
                var objStore = transaction.objectStore(objStoreName);

                for (var i = 0; i < data[objStoreName].length; i++) {
                    try {
                        objStore.delete(data[objStoreName][i]);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                }
            }
        },

        /**
         * Clear object store(s)
         *
         * @param {Array|String} objStoreNames array of object stores or a single object store
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        clear: function skladConnection_clear(objStoreNames, callback) {
            var objStoreNames = Array.isArray(objStoreNames) ? objStoreNames : [objStoreNames];
            var callbackRun = false;

            var contains = DOMStringList.prototype.contains.bind(this.database.objectStoreNames);
            if (!objStoreNames.every(contains)) {
                var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
                callback(err);

                return;
            }

            var transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_clear_onFinish(evt) {
                if (callbackRun) {
                    return;
                }

                var err = abortErr || evt.target.error;
                var isSuccess = !err && evt.type === 'complete';

                callback(isSuccess ? undefined : err);
                callbackRun = true;

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (var i = 0; i < objStoreNames.length; i++) {
                var objStore = transaction.objectStore(objStoreNames[i]);

                try {
                    objStore.clear();
                } catch (ex) {
                    abortErr = ex;
                    return;
                }
            }
        },

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
        get: function skladConnection_get() {
            var multiGet = (arguments.length === 2 && typeof arguments[1] === 'function');
            var objStoreNames = multiGet ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = multiGet ? arguments[1] : (arguments[2] || arguments[1]);
            var contains = this.database.objectStoreNames.contains.bind(this.database.objectStoreNames);
            var objects = {};
            var transaction, data, options;
            var iterateRequest, objStore, range, direction;
            var err;

            if (!objStoreNames.every(contains))
                return callback('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed object stores');

            if (multiGet) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = (typeof arguments[1] === 'function') ? null : arguments[1];
            }

            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READONLY);
            } catch (ex) {
                return callback(ex);
            }

            transaction.oncomplete = function (evt) {
                callback(null, multiGet ? objects : objects[objStoreNames[0]]);
            };

            transaction.onabort = function (evt) {
                callback(err);
            };

            transaction.onerror = function (evt) {
                var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                callback('Transaction error: ' + err);
            };

            for (var objStoreName in data) {
                objStore = transaction.objectStore(objStoreName);
                options = data[objStoreName] || {};

                direction = options.direction || skladAPI.ASC;
                range = (options.range && options.range instanceof window.IDBKeyRange) ? options.range : null;

                if (options.index) {
                    if (!objStore.indexNames.contains(options.index)) {
                        err = 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index';
                        transaction.abort();

                        break;
                    }

                    try {
                        iterateRequest = objStore.index(options.index).openCursor(range, direction);
                    } catch (ex) {
                        err = ex;
                        transaction.abort();

                        break;
                    }
                } else {
                    try {
                        iterateRequest = objStore.openCursor(range, direction);
                    } catch (ex) {
                        err = ex;
                        transaction.abort();

                        break;
                    }
                }

                (function (objStoreName, options) {
                    var objectsGot = 0;
                    var cursorPositionMoved = false;

                    iterateRequest.onsuccess = function (evt) {
                        var cursor = evt.target.result;
                        if (!cursor)
                            return;

                        if (options.offset && !cursorPositionMoved) {
                            cursorPositionMoved = true;
                            return cursor.advance(options.offset);
                        }

                        objects[objStoreName] = objects[objStoreName] || {};
                        objects[objStoreName][cursor.key] = cursor.value;
                        objectsGot += 1;

                        if (options.limit === objectsGot)
                            return;

                        cursor.continue();
                    };

                    iterateRequest.onerror = function (evt) {
                        err = iterateRequest.error;
                        transaction.abort();
                    };
                })(objStoreName, options);
            }
        },

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
        count: function skladConnection_count() {
            var isMulti = (arguments.length === 2 && typeof arguments[0] === 'object' && typeof arguments[1] === 'function');
            var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = isMulti ? arguments[1] : (arguments[2] || arguments[1]);
            var callbackRun = false;
            var result = {};
            var countRequest, data, abortErr;

            if (isMulti) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = (typeof arguments[1] === 'function') ? null : arguments[1];
            }

            var contains = DOMStringList.prototype.contains.bind(this.database.objectStoreNames);
            if (!objStoreNames.every(contains)) {
                var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
                callback(err);

                return;
            }

            var transaction = this.database.transaction(objStoreNames, TRANSACTION_READONLY);
            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_count_onFinish(evt) {
                if (callbackRun) {
                    return;
                }

                var err = abortErr || evt.target.error;
                var isSuccess = !err && evt.type === 'complete';

                if (isSuccess) {
                    callback(null, isMulti ? result : result[objStoreNames[0]]);
                } else {
                    callback(err);
                }

                callbackRun = true;

                if (evt.type === 'error') {
                    evt.preventDefault();
                }
            };

            for (var objStoreName in data) {
                var objStore = transaction.objectStore(objStoreName);
                var options = data[objStoreName] || {};
                var range = (options.range instanceof window.IDBKeyRange) ? options.range : null;

                if (options.index) {
                    if (!objStore.indexNames.contains(options.index)) {
                        abortErr = new DOMError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
                        return;
                    }

                    try {
                        countRequest = objStore.index(options.index).count(range);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                } else {
                    try {
                        countRequest = objStore.count(range);
                    } catch (ex) {
                        abortErr = ex;
                        return;
                    }
                }

                (function (objStoreName) {
                    countRequest.onsuccess = function (evt) {
                        result[objStoreName] = evt.target.result || 0;
                    };
                })(objStoreName);
            }
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
     * @param {Object} options (optional) connection options with keys:
     *    {Number} version - database version
     *    {Object} migration - migration scripts
     * @param {Function} callback invokes
     *    @param {String|Null} err
     *    @param {Object} database
     */
    skladAPI.open = function sklad_open(dbName, options, callback) {
        if (!window.indexedDB) {
            var err = new DOMError('NotSupportedError', 'Your browser doesn\'t support IndexedDB');
            callback(err);

            return;
        }

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        options.version = options.version || 1;

        var openConnRequest = window.indexedDB.open(dbName, options.version);
        var callbackRun = false;

        openConnRequest.onupgradeneeded = function (evt) {
            if (callbackRun) {
                return;
            }

            options.migration = options.migration || {};
            for (var i = evt.oldVersion + 1; i <= evt.newVersion; i++) {
                if (!options.migration[i])
                    continue;

                options.migration[i](this.result);
            }
        };

        openConnRequest.onerror = function (evt) {
            if (callbackRun) {
                return;
            }

            evt.preventDefault();
            callback(evt.target.error);

            callbackRun = true;
        };

        openConnRequest.onsuccess = function (evt) {
            if (callbackRun) {
                return;
            }

            var database = this.result;
            var oldVersion = parseInt(database.version || 0, 10);

            if (typeof database.setVersion === 'function' && oldVersion < options.version) {
                var changeVerRequest = database.setVersion(options.version);

                changeVerRequest.onsuccess = function (evt) {
                    var customUpgradeNeededEvt = new Event('upgradeneeded');
                    customUpgradeNeededEvt.oldVersion = oldVersion;
                    customUpgradeNeededEvt.newVersion = options.version;
                    openConnRequest.onupgradeneeded.call({result: evt.target.source}, customUpgradeNeededEvt);

                    database.close();
                    skladAPI.open(dbName, options, callback);
                };

                changeVerRequest.onerror = function (evt) {
                    var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                    callback(err);
                };

                return;
            }

            callback(null, Object.create(skladConnection, {
                database: {
                    configurable: true,
                    enumerable: false,
                    value: database,
                    writable: false
                }
            }));

            callbackRun = true;
        };

        openConnRequest.onblocked = function (evt) {
            if (callbackRun) {
                return;
            }

            evt.preventDefault();

            var err = new DOMError('InvalidStateError', 'Database ' + dbName + ' is blocked');
            callback(err);

            callbackRun = true;
        };
    };

    skladAPI.keyValue = function sklad_keyValue(key, value) {
        return Object.create(skladKeyValueContainer, {
            key: {value: key, configurable: false, writable: false},
            value: {value: value, configurable: false, writable: false}
        });
    };

    return skladAPI;
}));
