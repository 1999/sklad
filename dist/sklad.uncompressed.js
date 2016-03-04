(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["sklad"] = factory();
	else
		root["sklad"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Copyright (c) 2013-2016 Dmitry Sorin <info@staypositive.ru>
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
	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var KinoPromise = __webpack_require__(1);
	
	if (!window.indexedDB) {
	    window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	}
	
	if (!window.IDBTransaction) {
	    window.IDBTransaction = window.mozIDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	}
	
	if (!window.IDBKeyRange) {
	    window.IDBKeyRange = window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	}
	
	if (!window.IDBCursor) {
	    window.IDBCursor = window.mozIDBCursor || window.webkitIDBCursor || window.msIDBCursor;
	}
	
	var TRANSACTION_READONLY = window.IDBTransaction.READ_ONLY || 'readonly';
	var TRANSACTION_READWRITE = window.IDBTransaction.READ_WRITE || 'readwrite';
	
	var skladAPI = {};
	skladAPI.ASC = window.IDBCursor.NEXT || 'next';
	skladAPI.ASC_UNIQUE = window.IDBCursor.NEXT_NO_DUPLICATE || 'nextunique';
	skladAPI.DESC = window.IDBCursor.PREV || 'prev';
	skladAPI.DESC_UNIQUE = window.IDBCursor.PREV_NO_DUPLICATE || 'prevunique';
	
	// unfortunately `babel-plugin-array-includes` can't convert Array.prototype.includes
	// into Array.prototype.indexOf with its code
	var indexOf = Array.prototype.indexOf;
	var supportsObjStoreGetAll = typeof IDBObjectStore.prototype.getAll === 'function';
	var objStoresMeta = new Map();
	
	/**
	 * Generates UUIDs for objects without keys set
	 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
	 */
	function uuid() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	        var r = Math.random() * 16 | 0;
	        var v = c === 'x' ? r : r & 0x3 | 0x8;
	
	        return v.toString(16);
	    });
	}
	
	function createError(name, message) {
	    var errObj = new Error(message);
	    errObj.name = name;
	
	    return errObj;
	}
	
	function ensureError(err) {
	    if (err instanceof Error) {
	        return err;
	    }
	
	    return createError(err.name, err.message);
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
	function checkSavedData(dbName, objStore, data) {
	    var keyValueContainer = Object.prototype.isPrototypeOf.call(skladKeyValueContainer, data);
	    var value = keyValueContainer ? data.value : data;
	    var objStoreMeta = objStoresMeta.get(dbName).get(objStore.name);
	    var key = keyValueContainer ? data.key : undefined;
	
	    var keyPath = objStore.keyPath || objStoreMeta.keyPath;
	    var autoIncrement = objStore.autoIncrement || objStoreMeta.autoIncrement;
	
	    if (keyPath === null) {
	        if (!autoIncrement && key === undefined) {
	            key = uuid();
	        }
	    } else {
	        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
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
	 *
	 * @param {Array<String>} objStoreNames
	 * @return {Boolean}
	 */
	function checkContainingStores(objStoreNames) {
	    return objStoreNames.every(function (storeName) {
	        return indexOf.call(this.database.objectStoreNames, storeName) !== -1;
	    }, this);
	}
	
	/**
	 * autoIncrement is broken in IE family. Run this transaction to get its value
	 * on every object store
	 *
	 * @param {IDBDatabase} db
	 * @param {Array<String>} objStoreNames
	 * @return {Promise}
	 *
	 * @see http://stackoverflow.com/questions/35682165/indexeddb-in-ie11-edge-why-is-objstore-autoincrement-undefined
	 * @see https://connect.microsoft.com/IE/Feedback/Details/772726
	 */
	function getObjStoresMeta(db, objStoreNames) {
	    var dbMeta = objStoresMeta.get(db.name);
	    var promises = [];
	
	    objStoreNames.forEach(function (objStoreName) {
	        if (dbMeta.has(objStoreName)) {
	            return;
	        }
	
	        var promise = new Promise(function (resolve) {
	            var transaction = db.transaction([objStoreName], TRANSACTION_READWRITE);
	            transaction.oncomplete = resolve;
	            transaction.onabort = resolve;
	
	            var objStore = transaction.objectStore(objStoreName);
	
	            if (objStore.autoIncrement !== undefined) {
	                dbMeta.set(objStoreName, {
	                    autoIncrement: objStore.autoIncrement,
	                    keyPath: objStore.keyPath
	                });
	
	                return;
	            }
	
	            var autoIncrement = undefined;
	
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
	
	var skladConnection = {
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
	        var _this = this;
	
	        var isMulti = arguments.length === 1;
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        var data = undefined;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return getObjStoresMeta(this.database, objStoreNames).then(function () {
	            return new Promise(function (resolve, reject) {
	                var result = {};
	                var transaction = undefined;
	                var abortErr = undefined;
	
	                // Safari9 can't run multi-objectstore transactions
	                // divide one transaction into many with one object store to fix this
	                try {
	                    transaction = _this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	                } catch (ex) {
	                    if (ex.name === 'NotFoundError') {
	                        (function () {
	                            var promises = {};
	
	                            objStoreNames.forEach(function (objStoreName) {
	                                var promise = _this.insert(_defineProperty({}, objStoreName, Array.isArray(data[objStoreName]) ? data[objStoreName] : [data[objStoreName]])).then(function (res) {
	                                    return res[objStoreName];
	                                });
	
	                                promises[objStoreName] = promise;
	                            });
	
	                            KinoPromise.all(promises).then(resolve).catch(reject);
	                        })();
	                    } else {
	                        reject(ex);
	                    }
	
	                    return;
	                }
	
	                transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_insert_onFinish(evt) {
	                    var err = abortErr || evt.target.error;
	                    var isSuccess = !err && evt.type === 'complete';
	
	                    if (isSuccess) {
	                        resolve(isMulti ? result : result[objStoreNames[0]][0]);
	                    } else {
	                        reject(ensureError(err));
	                    }
	
	                    if (evt.type === 'error') {
	                        evt.preventDefault();
	                    }
	                };
	
	                var _loop = function _loop(objStoreName) {
	                    var objStore = transaction.objectStore(objStoreName);
	
	                    var _loop2 = function _loop2(i) {
	                        var checkedData = checkSavedData(_this.database.name, objStore, data[objStoreName][i]);
	
	                        if (!checkedData) {
	                            abortErr = createError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
	                            return {
	                                v: {
	                                    v: undefined
	                                }
	                            };
	                        }
	
	                        var req = undefined;
	                        try {
	                            req = objStore.add.apply(objStore, checkedData);
	                        } catch (ex) {
	                            abortErr = ex;
	                            return 'continue';
	                        }
	
	                        req.onsuccess = function (evt) {
	                            result[objStoreName] = result[objStoreName] || [];
	                            result[objStoreName][i] = evt.target.result;
	                        };
	                    };
	
	                    for (var i = 0; i < data[objStoreName].length; i++) {
	                        var _ret3 = _loop2(i);
	
	                        switch (_ret3) {
	                            case 'continue':
	                                continue;
	
	                            default:
	                                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
	                        }
	                    }
	                };
	
	                for (var objStoreName in data) {
	                    var _ret2 = _loop(objStoreName);
	
	                    if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
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
	        var _this2 = this;
	
	        var isMulti = arguments.length === 1;
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        var data = undefined;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return getObjStoresMeta(this.database, objStoreNames).then(function () {
	            return new Promise(function (resolve, reject) {
	                var result = {};
	                var transaction = undefined;
	                var abortErr = undefined;
	
	                // Safari9 can't run multi-objectstore transactions
	                // divide one transaction into many with one object store to fix this
	                try {
	                    transaction = _this2.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	                } catch (ex) {
	                    if (ex.name === 'NotFoundError') {
	                        (function () {
	                            var promises = {};
	
	                            objStoreNames.forEach(function (objStoreName) {
	                                var promise = _this2.upsert(_defineProperty({}, objStoreName, Array.isArray(data[objStoreName]) ? data[objStoreName] : [data[objStoreName]])).then(function (res) {
	                                    return res[objStoreName];
	                                });
	
	                                promises[objStoreName] = promise;
	                            });
	
	                            KinoPromise.all(promises).then(resolve).catch(reject);
	                        })();
	                    } else {
	                        reject(ex);
	                    }
	
	                    return;
	                }
	
	                transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_upsert_onFinish(evt) {
	                    var err = abortErr || evt.target.error;
	                    var isSuccess = !err && evt.type === 'complete';
	
	                    if (isSuccess) {
	                        resolve(isMulti ? result : result[objStoreNames[0]][0]);
	                    } else {
	                        reject(ensureError(err));
	                    }
	
	                    if (evt.type === 'error') {
	                        evt.preventDefault();
	                    }
	                };
	
	                var _loop3 = function _loop3(objStoreName) {
	                    var objStore = transaction.objectStore(objStoreName);
	
	                    var _loop4 = function _loop4(i) {
	                        var checkedData = checkSavedData(_this2.database.name, objStore, data[objStoreName][i]);
	
	                        if (!checkedData) {
	                            abortErr = createError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
	                            return {
	                                v: {
	                                    v: undefined
	                                }
	                            };
	                        }
	
	                        var req = undefined;
	                        try {
	                            req = objStore.put.apply(objStore, checkedData);
	                        } catch (ex) {
	                            abortErr = ex;
	                            return 'continue';
	                        }
	
	                        req.onsuccess = function (evt) {
	                            result[objStoreName] = result[objStoreName] || [];
	                            result[objStoreName][i] = evt.target.result;
	                        };
	                    };
	
	                    for (var i = 0; i < data[objStoreName].length; i++) {
	                        var _ret6 = _loop4(i);
	
	                        switch (_ret6) {
	                            case 'continue':
	                                continue;
	
	                            default:
	                                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
	                        }
	                    }
	                };
	
	                for (var objStoreName in data) {
	                    var _ret5 = _loop3(objStoreName);
	
	                    if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
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
	        var _this3 = this;
	
	        var isMulti = arguments.length === 1;
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        var data = undefined;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return new Promise(function (resolve, reject) {
	            var transaction = undefined;
	            var abortErr = undefined;
	
	            // Safari9 can't run multi-objectstore transactions
	            // divide one transaction into many with one object store to fix this
	            try {
	                transaction = _this3.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            } catch (ex) {
	                if (ex.name === 'NotFoundError') {
	                    var promises = objStoreNames.map(function (objStoreName) {
	                        return _this3.delete(objStoreName, data[objStoreName]);
	                    });
	                    Promise.all(promises).then(function () {
	                        return resolve();
	                    }).catch(reject);
	                } else {
	                    reject(ex);
	                }
	
	                return;
	            }
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_delete_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	
	                if (err) {
	                    reject(ensureError(err));
	                } else {
	                    resolve();
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop5 = function _loop5(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	
	                data[objStoreName].forEach(function (recordKey) {
	                    if (abortErr) {
	                        return;
	                    }
	
	                    try {
	                        objStore.delete(recordKey);
	                    } catch (ex) {
	                        abortErr = ex;
	                    }
	                });
	            };
	
	            for (var objStoreName in data) {
	                _loop5(objStoreName);
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
	        var _this4 = this;
	
	        objStoreNames = Array.isArray(objStoreNames) ? objStoreNames : [objStoreNames];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        return new Promise(function (resolve, reject) {
	            var transaction = undefined;
	            var abortErr = undefined;
	
	            // Safari9 can't run multi-objectstore transactions
	            // divide one transaction into many with one object store to fix this
	            try {
	                transaction = _this4.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            } catch (ex) {
	                if (ex.name === 'NotFoundError') {
	                    var promises = objStoreNames.map(function (objStoreName) {
	                        return _this4.clear([objStoreName]);
	                    });
	                    Promise.all(promises).then(function () {
	                        return resolve();
	                    }).catch(reject);
	                } else {
	                    reject(ex);
	                }
	
	                return;
	            }
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_clear_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	
	                if (err) {
	                    reject(ensureError(err));
	                } else {
	                    resolve();
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            objStoreNames.forEach(function (objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	
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
	        var _this5 = this;
	
	        var isMulti = arguments.length === 2 && _typeof(arguments[0]) === 'object' && typeof arguments[1] === 'function';
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        var result = {};
	        var data = undefined,
	            abortErr = undefined;
	
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = typeof arguments[1] === 'function' ? null : arguments[1];
	        }
	
	        objStoreNames.forEach(function (objStoreName) {
	            result[objStoreName] = [];
	        });
	
	        return new Promise(function (resolve, reject) {
	            var transaction = undefined;
	
	            // Safari9 can't run multi-objectstore transactions
	            // divide one transaction into many with one object store to fix this
	            try {
	                transaction = _this5.database.transaction(objStoreNames, TRANSACTION_READONLY);
	            } catch (ex) {
	                if (ex.name === 'NotFoundError') {
	                    (function () {
	                        var promises = {};
	
	                        objStoreNames.forEach(function (objStoreName) {
	                            var promise = _this5.get(objStoreName, data[objStoreName]);
	                            promises[objStoreName] = promise;
	                        });
	
	                        KinoPromise.all(promises).then(resolve).catch(reject);
	                    })();
	                } else {
	                    reject(ex);
	                }
	
	                return;
	            }
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_get_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]]);
	                } else {
	                    reject(ensureError(err));
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop6 = function _loop6(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	                var options = data[objStoreName] || {};
	                var direction = options.direction || skladAPI.ASC;
	                var range = options.range instanceof window.IDBKeyRange ? options.range : null;
	
	                var useGetAll = false;
	                var iterateRequest = undefined;
	
	                if (supportsObjStoreGetAll) {
	                    useGetAll = Object.keys(options).every(function (key) {
	                        return key === 'limit' || key === 'range';
	                    });
	                }
	
	                if (options.index) {
	                    if (!objStore.indexNames.contains(options.index)) {
	                        abortErr = createError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
	                        return {
	                            v: undefined
	                        };
	                    }
	
	                    try {
	                        iterateRequest = objStore.index(options.index).openCursor(range, direction);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: undefined
	                        };
	                    }
	                } /* else if (useGetAll) {
	                     // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
	                     try {
	                         objStore.getAll(range, options.limit || Number.POSITIVE_INFINITY).onsuccess = function (evt) {
	                             const result = evt.target.result;
	                             console.log(JSON.stringify(result, null, '    '));
	                              // result[objStoreName].push({
	                             //     key: cursor.key,
	                             //     value: cursor.value
	                             // });
	                         };
	                     } catch (ex) {
	                         abortErr = ex;
	                         return;
	                     }
	                  }*/else {
	                        try {
	                            iterateRequest = objStore.openCursor(range, direction);
	                        } catch (ex) {
	                            abortErr = ex;
	                            return {
	                                v: undefined
	                            };
	                        }
	                    }
	
	                var cursorPositionMoved = false;
	
	                iterateRequest.onsuccess = function (evt) {
	                    var cursor = evt.target.result;
	
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
	            };
	
	            for (var objStoreName in data) {
	                var _ret9 = _loop6(objStoreName);
	
	                if ((typeof _ret9 === 'undefined' ? 'undefined' : _typeof(_ret9)) === "object") return _ret9.v;
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
	        var _this6 = this;
	
	        var isMulti = arguments.length === 1 && _typeof(arguments[0]) === 'object';
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	        var data = undefined;
	
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = typeof arguments[1] === 'function' ? null : arguments[1];
	        }
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        return new Promise(function (resolve, reject) {
	            var result = {};
	            var transaction = undefined;
	            var countRequest = undefined;
	            var abortErr = undefined;
	
	            // Safari9 can't run multi-objectstore transactions
	            // divide one transaction into many with one object store to fix this
	            try {
	                transaction = _this6.database.transaction(objStoreNames, TRANSACTION_READONLY);
	            } catch (ex) {
	                if (ex.name === 'NotFoundError') {
	                    (function () {
	                        var promises = {};
	
	                        objStoreNames.forEach(function (objStoreName) {
	                            var promise = _this6.count(objStoreName, data[objStoreName]);
	                            promises[objStoreName] = promise;
	                        });
	
	                        KinoPromise.all(promises).then(resolve).catch(reject);
	                    })();
	                } else {
	                    reject(ex);
	                }
	
	                return;
	            }
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_count_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]]);
	                } else {
	                    reject(ensureError(err));
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop7 = function _loop7(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	                var options = data[objStoreName] || {};
	                var rangeArgs = options.range instanceof window.IDBKeyRange ? [options.range] : [];
	
	                if (options.index) {
	                    if (!objStore.indexNames.contains(options.index)) {
	                        abortErr = createError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
	                        return {
	                            v: undefined
	                        };
	                    }
	
	                    try {
	                        var index = objStore.index(options.index);
	                        countRequest = index.count.apply(index, rangeArgs);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: undefined
	                        };
	                    }
	                } else {
	                    try {
	                        countRequest = objStore.count.apply(objStore, rangeArgs);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: undefined
	                        };
	                    }
	                }
	
	                countRequest.onsuccess = function (evt) {
	                    result[objStoreName] = evt.target.result || 0;
	                };
	            };
	
	            for (var objStoreName in data) {
	                var _ret11 = _loop7(objStoreName);
	
	                if ((typeof _ret11 === 'undefined' ? 'undefined' : _typeof(_ret11)) === "object") return _ret11.v;
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
	skladAPI.open = function sklad_open(dbName) {
	    var options = arguments.length <= 1 || arguments[1] === undefined ? { version: 1 } : arguments[1];
	
	    return new Promise(function (resolve, reject) {
	        if (!window.indexedDB) {
	            reject(createError('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openConnRequest = window.indexedDB.open(dbName, options.version);
	        var isResolvedOrRejected = false;
	
	        openConnRequest.onupgradeneeded = function (evt) {
	            if (isResolvedOrRejected) {
	                return;
	            }
	
	            options.migration = options.migration || {};
	            for (var i = evt.oldVersion + 1; i <= evt.newVersion; i++) {
	                if (!options.migration[i]) continue;
	
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
	
	        openConnRequest.onsuccess = function (evt) {
	            if (isResolvedOrRejected) {
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
	                    openConnRequest.onupgradeneeded.call({ result: evt.target.source }, customUpgradeNeededEvt);
	
	                    database.close();
	                    skladAPI.open(dbName, options).then(resolve, reject);
	                };
	
	                changeVerRequest.onerror = function (evt) {
	                    var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
	                    reject(ensureError(err));
	                };
	
	                return;
	            }
	
	            // store object stores properties in their own map
	            objStoresMeta.set(dbName, new Map());
	
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
	
	            reject(createError('InvalidStateError', 'Database ' + dbName + ' is blocked'));
	            isResolvedOrRejected = true;
	        };
	    });
	};
	
	/**
	 * Deletes database
	 *
	 * @param {String} dbName
	 * @return {Promise}
	 *   @param {Error} [err] if promise is rejected
	 */
	skladAPI.deleteDatabase = function sklad_deleteDatabase(dbName) {
	    return new Promise(function (resolve, reject) {
	        if (!window.indexedDB) {
	            reject(createError('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openDbRequest = window.indexedDB.deleteDatabase(dbName);
	
	        openDbRequest.onsuccess = openDbRequest.onerror = openDbRequest.onblocked = function sklad_deleteDatabase_onFinish(evt) {
	            var err = evt.type === 'blocked' ? createError('InvalidStateError', 'Database ' + dbName + ' is blocked') : evt.target.error;
	
	            if (err) {
	                reject(ensureError(err));
	            } else {
	                resolve();
	            }
	
	            if (evt.type !== 'success') {
	                evt.preventDefault();
	            }
	        };
	    });
	};
	
	skladAPI.keyValue = function sklad_keyValue(key, value) {
	    return Object.create(skladKeyValueContainer, {
	        key: { value: key, configurable: false, writable: false },
	        value: { value: value, configurable: false, writable: false }
	    });
	};
	
	exports.default = skladAPI;
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var KinoPromise = function (_Promise) {
	    _inherits(KinoPromise, _Promise);
	
	    function KinoPromise() {
	        _classCallCheck(this, KinoPromise);
	
	        return _possibleConstructorReturn(this, Object.getPrototypeOf(KinoPromise).apply(this, arguments));
	    }
	
	    _createClass(KinoPromise, [{
	        key: 'spread',
	        value: function spread(onFulfilled, onRejected) {
	            var onFulfilledInternal = function onFulfilledInternal(res) {
	                if (Array.isArray(res)) {
	                    return onFulfilled.apply(null, res);
	                }
	            };
	
	            return this.then(onFulfilledInternal, onRejected);
	        }
	    }]);
	
	    return KinoPromise;
	}(Promise);
	
	KinoPromise.all = function KinoPromise_static_all(promises) {
	    if (arguments.length > 1 || (typeof promises === 'undefined' ? 'undefined' : _typeof(promises)) !== 'object') {
	        return Promise.all.apply(Promise, arguments);
	    }
	
	    return new KinoPromise(function (resolve, reject) {
	        var isPromisesList = Array.isArray(promises);
	        var promisesArray = undefined;
	        var promisesKeys = undefined;
	
	        if (isPromisesList) {
	            promisesArray = promises;
	        } else {
	            promisesKeys = Object.keys(promises);
	            promisesArray = promisesKeys.map(function (key) {
	                return promises[key];
	            });
	        }
	
	        Promise.all(promisesArray).then(function (res) {
	            // transform output into an object
	            var output = undefined;
	
	            if (isPromisesList) {
	                output = res;
	            } else {
	                output = res.reduce(function (output, chunk, index) {
	                    output[promisesKeys[index]] = chunk;
	                    return output;
	                }, {});
	            }
	
	            resolve(output);
	        }).catch(reject);
	    });
	};
	
	module.exports = KinoPromise;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBlNDdjYjg2YWVjMDNkNDU4MjhhMyIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9raW5vcHJvbWlzZS9saWIvZXMyMDE1LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNiQTs7Ozs7Ozs7OztBQUVBLEtBQU0sY0FBYyxvQkFBUSxDQUFSLENBQWQ7O0FBRU4sS0FBSSxDQUFDLE9BQU8sU0FBUCxFQUFrQjtBQUNuQixZQUFPLFNBQVAsR0FBbUIsT0FBTyxZQUFQLElBQXVCLE9BQU8sZUFBUCxJQUEwQixPQUFPLFdBQVAsQ0FEakQ7RUFBdkI7O0FBSUEsS0FBSSxDQUFDLE9BQU8sY0FBUCxFQUF1QjtBQUN4QixZQUFPLGNBQVAsR0FBd0IsT0FBTyxpQkFBUCxJQUE0QixPQUFPLG9CQUFQLElBQStCLE9BQU8sZ0JBQVAsQ0FEM0Q7RUFBNUI7O0FBSUEsS0FBSSxDQUFDLE9BQU8sV0FBUCxFQUFvQjtBQUNyQixZQUFPLFdBQVAsR0FBcUIsT0FBTyxjQUFQLElBQXlCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxhQUFQLENBRHJEO0VBQXpCOztBQUlBLEtBQUksQ0FBQyxPQUFPLFNBQVAsRUFBa0I7QUFDbkIsWUFBTyxTQUFQLEdBQW1CLE9BQU8s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Q0FBZixDQURHO0FBRUgsNkJBQWdCLGFBQWEsR0FBYixDQUFpQjt3QkFBTyxTQUFTLEdBQVQ7Y0FBUCxDQUFqQyxDQUZHO1VBRlA7O0FBT0EsaUJBQVEsR0FBUixDQUFZLGFBQVosRUFBMkIsSUFBM0IsQ0FBZ0MsZUFBTzs7QUFFbkMsaUJBQUksa0JBQUosQ0FGbUM7O0FBSW5DLGlCQUFJLGNBQUosRUFBb0I7QUFDaEIsMEJBQVMsR0FBVCxDQURnQjtjQUFwQixNQUVPO0FBQ0gsMEJBQVMsSUFBSSxNQUFKLENBQVcsVUFBQyxNQUFELEVBQVMsS0FBVCxFQUFnQixLQUFoQixFQUEwQjtBQUMxQyw0QkFBTyxhQUFhLEtBQWIsQ0FBUCxJQUE4QixLQUE5QixDQUQwQztBQUUxQyw0QkFBTyxNQUFQLENBRjBDO2tCQUExQixFQUdqQixFQUhNLENBQVQsQ0FERztjQUZQOztBQVNBLHFCQUFRLE1BQVIsRUFibUM7VUFBUCxDQUFoQyxDQWNHLEtBZEgsQ0FjUyxNQWRULEVBWjhDO01BQTNCLENBQXZCLENBTHdEO0VBQTFDOztBQW1DbEIsUUFBTyxPQUFQLEdBQWlCLFdBQWpCLEMiLCJmaWxlIjoic2tsYWQudW5jb21wcmVzc2VkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiBcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb25cbiAqKi8iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIGU0N2NiODZhZWMwM2Q0NTgyOGEzXG4gKiovIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNiBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogaHR0cHM6Ly9naXRodWIuY29tLzE5OTkvc2tsYWRcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIEBhdXRob3IgRG1pdHJ5IFNvcmluIDxpbmZvQHN0YXlwb3NpdGl2ZS5ydT5cbiAqIEBsaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbCBNSVQgTGljZW5zZVxuICovXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IEtpbm9Qcm9taXNlID0gcmVxdWlyZSgna2lub3Byb21pc2UvbGliL2VzMjAxNS5qcycpO1xuXG5pZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICB3aW5kb3cuaW5kZXhlZERCID0gd2luZG93Lm1vekluZGV4ZWREQiB8fCB3aW5kb3cud2Via2l0SW5kZXhlZERCIHx8IHdpbmRvdy5tc0luZGV4ZWREQjtcbn1cblxuaWYgKCF3aW5kb3cuSURCVHJhbnNhY3Rpb24pIHtcbiAgICB3aW5kb3cuSURCVHJhbnNhY3Rpb24gPSB3aW5kb3cubW96SURCVHJhbnNhY3Rpb24gfHwgd2luZG93LndlYmtpdElEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy5tc0lEQlRyYW5zYWN0aW9uO1xufVxuXG5pZiAoIXdpbmRvdy5JREJLZXlSYW5nZSkge1xuICAgIHdpbmRvdy5JREJLZXlSYW5nZSA9IHdpbmRvdy5tb3pJREJLZXlSYW5nZSB8fCB3aW5kb3cud2Via2l0SURCS2V5UmFuZ2UgfHwgd2luZG93Lm1zSURCS2V5UmFuZ2U7XG59XG5cbmlmICghd2luZG93LklEQkN1cnNvcikge1xuICAgIHdpbmRvdy5JREJDdXJzb3IgPSB3aW5kb3cubW96SURCQ3Vyc29yIHx8IHdpbmRvdy53ZWJraXRJREJDdXJzb3IgfHwgd2luZG93Lm1zSURCQ3Vyc29yO1xufVxuXG5jb25zdCBUUkFOU0FDVElPTl9SRUFET05MWSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX09OTFkgfHwgJ3JlYWRvbmx5JztcbmNvbnN0IFRSQU5TQUNUSU9OX1JFQURXUklURSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX1dSSVRFIHx8ICdyZWFkd3JpdGUnO1xuXG5jb25zdCBza2xhZEFQSSA9IHt9O1xuc2tsYWRBUEkuQVNDID0gd2luZG93LklEQkN1cnNvci5ORVhUIHx8ICduZXh0JztcbnNrbGFkQVBJLkFTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLk5FWFRfTk9fRFVQTElDQVRFIHx8ICduZXh0dW5pcXVlJztcbnNrbGFkQVBJLkRFU0MgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVYgfHwgJ3ByZXYnO1xuc2tsYWRBUEkuREVTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVZfTk9fRFVQTElDQVRFIHx8ICdwcmV2dW5pcXVlJztcblxuLy8gdW5mb3J0dW5hdGVseSBgYmFiZWwtcGx1Z2luLWFycmF5LWluY2x1ZGVzYCBjYW4ndCBjb252ZXJ0IEFycmF5LnByb3RvdHlwZS5pbmNsdWRlc1xuLy8gaW50byBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB3aXRoIGl0cyBjb2RlXG5jb25zdCBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5jb25zdCBzdXBwb3J0c09ialN0b3JlR2V0QWxsID0gdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPT09ICdmdW5jdGlvbic7XG5jb25zdCBvYmpTdG9yZXNNZXRhID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEdlbmVyYXRlcyBVVUlEcyBmb3Igb2JqZWN0cyB3aXRob3V0IGtleXMgc2V0XG4gKiBAbGluayBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9ob3ctdG8tY3JlYXRlLWEtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQvMjExNzUyMyMyMTE3NTIzXG4gKi9cbmZ1bmN0aW9uIHV1aWQoKSB7XG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICAgICAgY29uc3QgdiA9IChjID09PSAneCcpID8gciA6IChyJjB4M3wweDgpO1xuXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3IobmFtZSwgbWVzc2FnZSkge1xuICAgIGNvbnN0IGVyck9iaiA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICBlcnJPYmoubmFtZSA9IG5hbWU7XG5cbiAgICByZXR1cm4gZXJyT2JqO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVFcnJvcihlcnIpIHtcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGVycjtcbiAgICB9XG5cbiAgICByZXR1cm4gY3JlYXRlRXJyb3IoZXJyLm5hbWUsIGVyci5tZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBDb21tb24gYW5jZXN0b3IgZm9yIG9iamVjdHMgY3JlYXRlZCB3aXRoIHNrbGFkLmtleVZhbHVlKCkgbWV0aG9kXG4gKiBVc2VkIHRvIGRpc3Rpbmd1aXNoIHN0YW5kYXJkIG9iamVjdHMgd2l0aCBcImtleVwiIGFuZCBcInZhbHVlXCIgZmllbGRzIGZyb20gc3BlY2lhbCBvbmVzXG4gKi9cbmNvbnN0IHNrbGFkS2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4vKipcbiAqIENoZWNrcyBkYXRhIGJlZm9yZSBzYXZpbmcgaXQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICogQHJldHVybiB7Qm9vbGVhbn0gZmFsc2UgaWYgc2F2ZWQgZGF0YSB0eXBlIGlzIGluY29ycmVjdCwgb3RoZXJ3aXNlIHtBcnJheX0gb2JqZWN0IHN0b3JlIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICovXG5mdW5jdGlvbiBjaGVja1NhdmVkRGF0YShkYk5hbWUsIG9ialN0b3JlLCBkYXRhKSB7XG4gICAgY29uc3Qga2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YuY2FsbChza2xhZEtleVZhbHVlQ29udGFpbmVyLCBkYXRhKTtcbiAgICBjb25zdCB2YWx1ZSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS52YWx1ZSA6IGRhdGE7XG4gICAgY29uc3Qgb2JqU3RvcmVNZXRhID0gb2JqU3RvcmVzTWV0YS5nZXQoZGJOYW1lKS5nZXQob2JqU3RvcmUubmFtZSk7XG4gICAgbGV0IGtleSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS5rZXkgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBrZXlQYXRoID0gb2JqU3RvcmUua2V5UGF0aCB8fCBvYmpTdG9yZU1ldGEua2V5UGF0aDtcbiAgICBjb25zdCBhdXRvSW5jcmVtZW50ID0gb2JqU3RvcmUuYXV0b0luY3JlbWVudCB8fCBvYmpTdG9yZU1ldGEuYXV0b0luY3JlbWVudDtcblxuICAgIGlmIChrZXlQYXRoID09PSBudWxsKSB7XG4gICAgICAgIGlmICghYXV0b0luY3JlbWVudCAmJiBrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAga2V5ID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogc3VwcG9ydCBkb3Qtc2VwYXJhdGVkIGFuZCBhcnJheSBrZXlQYXRoc1xuICAgICAgICBpZiAoIWF1dG9JbmNyZW1lbnQgJiYgZGF0YVtrZXlQYXRoXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkYXRhW2tleVBhdGhdID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleSA/IFt2YWx1ZSwga2V5XSA6IFt2YWx1ZV07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBkYXRhYmFzZSBjb250YWlucyBhbGwgbmVlZGVkIHN0b3Jlc1xuICpcbiAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPn0gb2JqU3RvcmVOYW1lc1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDb250YWluaW5nU3RvcmVzKG9ialN0b3JlTmFtZXMpIHtcbiAgICByZXR1cm4gb2JqU3RvcmVOYW1lcy5ldmVyeShmdW5jdGlvbiAoc3RvcmVOYW1lKSB7XG4gICAgICAgIHJldHVybiAoaW5kZXhPZi5jYWxsKHRoaXMuZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcywgc3RvcmVOYW1lKSAhPT0gLTEpO1xuICAgIH0sIHRoaXMpO1xufVxuXG4vKipcbiAqIGF1dG9JbmNyZW1lbnQgaXMgYnJva2VuIGluIElFIGZhbWlseS4gUnVuIHRoaXMgdHJhbnNhY3Rpb24gdG8gZ2V0IGl0cyB2YWx1ZVxuICogb24gZXZlcnkgb2JqZWN0IHN0b3JlXG4gKlxuICogQHBhcmFtIHtJREJEYXRhYmFzZX0gZGJcbiAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPn0gb2JqU3RvcmVOYW1lc1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqXG4gKiBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2ODIxNjUvaW5kZXhlZGRiLWluLWllMTEtZWRnZS13aHktaXMtb2Jqc3RvcmUtYXV0b2luY3JlbWVudC11bmRlZmluZWRcbiAqIEBzZWUgaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvRmVlZGJhY2svRGV0YWlscy83NzI3MjZcbiAqL1xuZnVuY3Rpb24gZ2V0T2JqU3RvcmVzTWV0YShkYiwgb2JqU3RvcmVOYW1lcykge1xuICAgIGNvbnN0IGRiTWV0YSA9IG9ialN0b3Jlc01ldGEuZ2V0KGRiLm5hbWUpO1xuICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgaWYgKGRiTWV0YS5oYXMob2JqU3RvcmVOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihbb2JqU3RvcmVOYW1lXSwgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSByZXNvbHZlO1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25hYm9ydCA9IHJlc29sdmU7XG5cbiAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKG9ialN0b3JlLmF1dG9JbmNyZW1lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGRiTWV0YS5zZXQob2JqU3RvcmVOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQ6IG9ialN0b3JlLmF1dG9JbmNyZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGg6IG9ialN0b3JlLmtleVBhdGhcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGF1dG9JbmNyZW1lbnQ7XG5cbiAgICAgICAgICAgIGlmIChvYmpTdG9yZS5rZXlQYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYga2V5IHBhdGggaXMgZGVmaW5lZCBpdCdzIHBvc3NpYmxlIHRvIGluc2VydCBvbmx5IG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyBidXQgaWYga2V5IGdlbmVyYXRvciAoYXV0b0luY3JlbWVudCkgaXMgbm90IGRlZmluZWQgdGhlIGluc2VydGVkIG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyBtdXN0IGNvbnRhaW4gZmllbGQocykgZGVzY3JpYmVkIGluIGtleVBhdGggdmFsdWUgb3RoZXJ3aXNlIElEQk9iamVjdFN0b3JlLmFkZCBvcCBmYWlsc1xuICAgICAgICAgICAgICAgIC8vIHNvIGlmIHdlIHJ1biBPREJPYmplY3RTdG9yZS5hZGQgd2l0aCBhbiBlbXB0eSBvYmplY3QgYW5kIGl0IGZhaWxzLCB0aGlzIG1lYW5zIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBhdXRvSW5jcmVtZW50IHByb3BlcnR5IHdhcyBmYWxzZS4gT3RoZXJ3aXNlIC0gdHJ1ZVxuICAgICAgICAgICAgICAgIC8vIGlmIGtleSBwYXRoIGlzIGFycmF5IGF1dG9JbmNyZW1lbnQgcHJvcGVydHkgY2FuJ3QgYmUgdHJ1ZVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ialN0b3JlLmtleVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuYWRkKHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBrZXkgcGF0aCBpcyBub3QgZGVmaW5lZCBpdCdzIHBvc3NpYmxlIHRvIGluc2VydCBhbnkga2luZCBvZiBkYXRhXG4gICAgICAgICAgICAgICAgLy8gYnV0IGlmIGtleSBnZW5lcmF0b3IgKGF1dG9JbmNyZW1lbnQpIGlzIG5vdCBkZWZpbmVkIHlvdSBzaG91bGQgc2V0IGl0IGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgICAvLyBzbyBpZiB3ZSBydW4gT0RCT2JqZWN0U3RvcmUuYWRkIHdpdGggb25lIGFyZ3VtZW50IGFuZCBpdCBmYWlscywgdGhpcyBtZWFucyB0aGF0XG4gICAgICAgICAgICAgICAgLy8gYXV0b0luY3JlbWVudCBwcm9wZXJ0eSB3YXMgZmFsc2UuIE90aGVyd2lzZSAtIHRydWVcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5hZGQoJ3NvbWUgdmFsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2F2ZSBtZXRhIHByb3BlcnRpZXNcbiAgICAgICAgICAgIGRiTWV0YS5zZXQob2JqU3RvcmVOYW1lLCB7XG4gICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudDogYXV0b0luY3JlbWVudCxcbiAgICAgICAgICAgICAgICBrZXlQYXRoOiBvYmpTdG9yZS5rZXlQYXRoXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYW5kIGFib3J0IHRyYW5zYWN0aW9uIHNvIHRoYXQgbmV3IHJlY29yZCBpcyBmb3Jnb3R0ZW5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLmFib3J0KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuXG5jb25zdCBza2xhZENvbm5lY3Rpb24gPSB7XG4gICAgLyoqXG4gICAgICogMSkgSW5zZXJ0IG9uZSByZWNvcmQgaW50byB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkIG9iamVjdCBrZXlcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBtdWx0aXBsZSByZWNvcmRzIGludG8gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkIG9iamVjdHMnIGtleXNcbiAgICAgKi9cbiAgICBpbnNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRPYmpTdG9yZXNNZXRhKHRoaXMuZGF0YWJhc2UsIG9ialN0b3JlTmFtZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29ialN0b3JlTmFtZV06IEFycmF5LmlzQXJyYXkoZGF0YVtvYmpTdG9yZU5hbWVdKSA/IGRhdGFbb2JqU3RvcmVOYW1lXSA6IFtkYXRhW29ialN0b3JlTmFtZV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXMgPT4gcmVzW29ialN0b3JlTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKHRoaXMuZGF0YWJhc2UubmFtZSwgb2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLmFkZC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvciB1cGRhdGUgb25lIHJlY29yZCBpbiB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0IGtleSBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBvciB1cGRhdGUgbXVsdGlwbGUgcmVjb3JkcyBpbiB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gaW5zZXJ0ZWQvdXBkYXRlZCBvYmplY3RzJyBrZXlzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHVwc2VydDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldE9ialN0b3Jlc01ldGEodGhpcy5kYXRhYmFzZSwgb2JqU3RvcmVOYW1lcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy51cHNlcnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb2JqU3RvcmVOYW1lXTogQXJyYXkuaXNBcnJheShkYXRhW29ialN0b3JlTmFtZV0pID8gZGF0YVtvYmpTdG9yZU5hbWVdIDogW2RhdGFbb2JqU3RvcmVOYW1lXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKHJlcyA9PiByZXNbb2JqU3RvcmVOYW1lXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tvYmpTdG9yZU5hbWVdID0gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5vUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV1bMF0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhW29ialN0b3JlTmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWREYXRhID0gY2hlY2tTYXZlZERhdGEodGhpcy5kYXRhYmFzZS5uYW1lLCBvYmpTdG9yZSwgZGF0YVtvYmpTdG9yZU5hbWVdW2ldKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2VkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgJ1lvdSBtdXN0IHN1cHBseSBvYmplY3RzIHRvIGJlIHNhdmVkIGluIHRoZSBvYmplY3Qgc3RvcmUgd2l0aCBzZXQga2V5UGF0aCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxID0gb2JqU3RvcmUucHV0LmFwcGx5KG9ialN0b3JlLCBjaGVja2VkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtpXSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgRGVsZXRlIG9uZSByZWNvcmQgZnJvbSB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGtleVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiAyKSBEZWxldGUgbXVsdGlwbGUgcmVjb3JkcyBmcm9tIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKlxuICAgICAqIEFUVEVOVElPTjogeW91IGNhbiBwYXNzIG9ubHkgVkFMSUQgS0VZUyBPUiBLRVkgUkFOR0VTIHRvIGRlbGV0ZSByZWNvcmRzXG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4tdmFsaWQta2V5XG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4ta2V5LXJhbmdlXG4gICAgICovXG4gICAgZGVsZXRlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlKCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IG9ialN0b3JlTmFtZXMubWFwKG9ialN0b3JlTmFtZSA9PiB0aGlzLmRlbGV0ZShvYmpTdG9yZU5hbWUsIGRhdGFbb2JqU3RvcmVOYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9kZWxldGVfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBkYXRhW29ialN0b3JlTmFtZV0uZm9yRWFjaChyZWNvcmRLZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWJvcnRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5kZWxldGUocmVjb3JkS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIG9iamVjdCBzdG9yZShzKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IG9ialN0b3JlTmFtZXMgYXJyYXkgb2Ygb2JqZWN0IHN0b3JlcyBvciBhIHNpbmdsZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gZXJyXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcihvYmpTdG9yZU5hbWVzKSB7XG4gICAgICAgIG9ialN0b3JlTmFtZXMgPSBBcnJheS5pc0FycmF5KG9ialN0b3JlTmFtZXMpID8gb2JqU3RvcmVOYW1lcyA6IFtvYmpTdG9yZU5hbWVzXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBvYmpTdG9yZU5hbWVzLm1hcChvYmpTdG9yZU5hbWUgPT4gdGhpcy5jbGVhcihbb2JqU3RvcmVOYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcl9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJvcnRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEdldCBvYmplY3RzIGZyb20gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JywgJ3JhbmdlJywgJ29mZnNldCcsICdsaW1pdCcgYW5kICdkaXJlY3Rpb24nXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7QXJyYXl9IHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgR2V0IG9iamVjdHMgZnJvbSBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9nZXQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICAgICAgbGV0IGRhdGEsIGFib3J0RXJyO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAob2JqU3RvcmVOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5nZXQob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZ2V0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucy5kaXJlY3Rpb24gfHwgc2tsYWRBUEkuQVNDO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gb3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIHdpbmRvdy5JREJLZXlSYW5nZSA/IG9wdGlvbnMucmFuZ2UgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgbGV0IHVzZUdldEFsbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBpdGVyYXRlUmVxdWVzdDtcblxuICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c09ialN0b3JlR2V0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZUdldEFsbCA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLmV2ZXJ5KGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXkgPT09ICdsaW1pdCcgfHwga2V5ID09PSAncmFuZ2UnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0vKiBlbHNlIGlmICh1c2VHZXRBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSURCT2JqZWN0U3RvcmUvZ2V0QWxsXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5nZXRBbGwocmFuZ2UsIG9wdGlvbnMubGltaXQgfHwgTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0LCBudWxsLCAnICAgICcpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlc3VsdFtvYmpTdG9yZU5hbWVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHZhbHVlOiBjdXJzb3IudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSovIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JQb3NpdGlvbk1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0ICYmICFjdXJzb3JQb3NpdGlvbk1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JQb3NpdGlvbk1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG9wdGlvbnMub2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPT09IHJlc3VsdFtvYmpTdG9yZU5hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIENvdW50IG9iamVjdHMgaW4gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JyBvci9hbmQgJ3JhbmdlJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge051bWJlcn0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgQ291bnQgb2JqZWN0cyBpbiBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgY291bnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG4gICAgICAgIGxldCBkYXRhO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgY291bnRSZXF1ZXN0O1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5jb3VudChvYmpTdG9yZU5hbWUsIGRhdGFbb2JqU3RvcmVOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tvYmpTdG9yZU5hbWVdID0gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2VBcmdzID0gKG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UpID8gW29wdGlvbnMucmFuZ2VdIDogW107XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IGluZGV4LmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IG9ialN0b3JlLmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkNvbm5SZXF1ZXN0ID0gd2luZG93LmluZGV4ZWREQi5vcGVuKGRiTmFtZSwgb3B0aW9ucy52ZXJzaW9uKTtcbiAgICAgICAgbGV0IGlzUmVzb2x2ZWRPclJlamVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb24gPSBvcHRpb25zLm1pZ3JhdGlvbiB8fCB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBldnQub2xkVmVyc2lvbiArIDE7IGkgPD0gZXZ0Lm5ld1ZlcnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5taWdyYXRpb25baV0pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb25baV0uY2FsbCh0aGlzLCB0aGlzLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGV2dC50YXJnZXQuZXJyb3IpKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWZXJzaW9uID0gcGFyc2VJbnQoZGF0YWJhc2UudmVyc2lvbiB8fCAwLCAxMCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YWJhc2Uuc2V0VmVyc2lvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBvbGRWZXJzaW9uIDwgb3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlVmVyUmVxdWVzdCA9IGRhdGFiYXNlLnNldFZlcnNpb24ob3B0aW9ucy52ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0ID0gbmV3IEV2ZW50KCd1cGdyYWRlbmVlZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQubmV3VmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZC5jYWxsKHtyZXN1bHQ6IGV2dC50YXJnZXQuc291cmNlfSwgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgc2tsYWRBUEkub3BlbihkYk5hbWUsIG9wdGlvbnMpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBldnQudGFyZ2V0LmVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LndlYmtpdEVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1vekVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1zRXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQuZXJyb3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0b3JlIG9iamVjdCBzdG9yZXMgcHJvcGVydGllcyBpbiB0aGVpciBvd24gbWFwXG4gICAgICAgICAgICBvYmpTdG9yZXNNZXRhLnNldChkYk5hbWUsIG5ldyBNYXAoKSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoT2JqZWN0LmNyZWF0ZShza2xhZENvbm5lY3Rpb24sIHtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZToge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YWJhc2UsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICByZWplY3QoY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYCkpO1xuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZVxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5kZWxldGVEYXRhYmFzZSA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlKGRiTmFtZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkRiUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTtcblxuICAgICAgICBvcGVuRGJSZXF1ZXN0Lm9uc3VjY2VzcyA9IG9wZW5EYlJlcXVlc3Qub25lcnJvciA9IG9wZW5EYlJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gc2tsYWRfZGVsZXRlRGF0YWJhc2Vfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSAoZXZ0LnR5cGUgPT09ICdibG9ja2VkJylcbiAgICAgICAgICAgICAgICA/IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsIGBEYXRhYmFzZSAke2RiTmFtZX0gaXMgYmxvY2tlZGApXG4gICAgICAgICAgICAgICAgOiBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldnQudHlwZSAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuXG5za2xhZEFQSS5rZXlWYWx1ZSA9IGZ1bmN0aW9uIHNrbGFkX2tleVZhbHVlKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShza2xhZEtleVZhbHVlQ29udGFpbmVyLCB7XG4gICAgICAgIGtleToge3ZhbHVlOiBrZXksIGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgIHZhbHVlOiB7dmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9XG4gICAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBza2xhZEFQSTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vbGliL3NrbGFkLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5jbGFzcyBLaW5vUHJvbWlzZSBleHRlbmRzIFByb21pc2Uge1xuICAgIHNwcmVhZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICBsZXQgb25GdWxmaWxsZWRJbnRlcm5hbCA9IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb25GdWxmaWxsZWQuYXBwbHkobnVsbCwgcmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG9uRnVsZmlsbGVkSW50ZXJuYWwsIG9uUmVqZWN0ZWQpO1xuICAgIH1cbn1cblxuS2lub1Byb21pc2UuYWxsID0gZnVuY3Rpb24gS2lub1Byb21pc2Vfc3RhdGljX2FsbChwcm9taXNlcykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSB8fCB0eXBlb2YgcHJvbWlzZXMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbC5hcHBseShQcm9taXNlLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgS2lub1Byb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBsZXQgaXNQcm9taXNlc0xpc3QgPSBBcnJheS5pc0FycmF5KHByb21pc2VzKTtcbiAgICAgICAgbGV0IHByb21pc2VzQXJyYXk7XG4gICAgICAgIGxldCBwcm9taXNlc0tleXM7XG5cbiAgICAgICAgaWYgKGlzUHJvbWlzZXNMaXN0KSB7XG4gICAgICAgICAgICBwcm9taXNlc0FycmF5ID0gcHJvbWlzZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlc0tleXMgPSBPYmplY3Qua2V5cyhwcm9taXNlcyk7XG4gICAgICAgICAgICBwcm9taXNlc0FycmF5ID0gcHJvbWlzZXNLZXlzLm1hcChrZXkgPT4gcHJvbWlzZXNba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlc0FycmF5KS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAvLyB0cmFuc2Zvcm0gb3V0cHV0IGludG8gYW4gb2JqZWN0XG4gICAgICAgICAgICBsZXQgb3V0cHV0O1xuXG4gICAgICAgICAgICBpZiAoaXNQcm9taXNlc0xpc3QpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlcy5yZWR1Y2UoKG91dHB1dCwgY2h1bmssIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtwcm9taXNlc0tleXNbaW5kZXhdXSA9IGNodW5rO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZShvdXRwdXQpO1xuICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBLaW5vUHJvbWlzZTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9raW5vcHJvbWlzZS9saWIvZXMyMDE1LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==