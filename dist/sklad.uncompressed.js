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
	var supportsObjStoreGetAll = typeof IDBObjectStore.prototype.getAll === 'function' && typeof IDBObjectStore.prototype.getAllKeys === 'function';
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
	
	            var autoIncrement = void 0;
	
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
	
	        var data = void 0;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return getObjStoresMeta(this.database, objStoreNames).then(function () {
	            return new Promise(function (resolve, reject) {
	                var result = {};
	                var transaction = void 0;
	                var abortErr = void 0;
	
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
	                                    v: void 0
	                                }
	                            };
	                        }
	
	                        var req = void 0;
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
	
	        var data = void 0;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return getObjStoresMeta(this.database, objStoreNames).then(function () {
	            return new Promise(function (resolve, reject) {
	                var result = {};
	                var transaction = void 0;
	                var abortErr = void 0;
	
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
	                                    v: void 0
	                                }
	                            };
	                        }
	
	                        var req = void 0;
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
	
	        var data = void 0;
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = [arguments[1]];
	        }
	
	        return new Promise(function (resolve, reject) {
	            var transaction = void 0;
	            var abortErr = void 0;
	
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
	            var transaction = void 0;
	            var abortErr = void 0;
	
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
	
	        var isMulti = arguments.length === 1 && _typeof(arguments[0]) === 'object';
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = createError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        var result = {};
	        var data = void 0,
	            abortErr = void 0;
	
	        if (isMulti) {
	            data = arguments[0];
	        } else {
	            data = {};
	            data[arguments[0]] = arguments[1];
	        }
	
	        objStoreNames.forEach(function (objStoreName) {
	            result[objStoreName] = [];
	        });
	
	        return new Promise(function (resolve, reject) {
	            var transaction = void 0;
	
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
	                var iterateRequest = void 0;
	
	                if (supportsObjStoreGetAll) {
	                    // getAll doesn't work for index ranges + it doesn't support special directions
	                    // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
	                    useGetAll = Object.keys(options).every(function (key) {
	                        return key !== 'index' && key !== 'direction';
	                    });
	                }
	
	                if (options.index) {
	                    if (!objStore.indexNames.contains(options.index)) {
	                        abortErr = createError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
	                        return {
	                            v: void 0
	                        };
	                    }
	
	                    try {
	                        iterateRequest = objStore.index(options.index).openCursor(range, direction);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: void 0
	                        };
	                    }
	                } else if (useGetAll) {
	                    var _ret10 = function () {
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
	                        var args = [range];
	                        var offset = 0;
	
	                        if (options.limit) {
	                            args.push(options.limit);
	
	                            if (options.offset) {
	                                args[1] += options.offset;
	                                offset = options.offset;
	                            }
	                        }
	
	                        try {
	                            // get all values request
	                            objStore.getAll.apply(objStore, args).onsuccess = function (evt) {
	                                var values = evt.target.result;
	
	                                values.forEach(function (value, index) {
	                                    if (index < offset) {
	                                        return;
	                                    }
	
	                                    var resultIndex = index - offset;
	                                    result[objStoreName][resultIndex] = result[objStoreName][resultIndex] || {};
	                                    result[objStoreName][resultIndex].value = value;
	                                });
	                            };
	
	                            // get all keys request
	                            objStore.getAllKeys.apply(objStore, args).onsuccess = function (evt) {
	                                var keys = evt.target.result;
	
	                                keys.forEach(function (key, index) {
	                                    if (index < offset) {
	                                        return;
	                                    }
	
	                                    var resultIndex = index - offset;
	                                    result[objStoreName][resultIndex] = result[objStoreName][resultIndex] || {};
	                                    result[objStoreName][resultIndex].key = key;
	                                });
	                            };
	                        } catch (ex) {
	                            abortErr = ex;
	                        } finally {
	                            // there are 2 separate IDBRequests running
	                            // so there's no need to bind listener to success event of any of them
	                            return {
	                                v: 'continue'
	                            };
	                        }
	                    }();
	
	                    if ((typeof _ret10 === 'undefined' ? 'undefined' : _typeof(_ret10)) === "object") return _ret10.v;
	                } else {
	                    try {
	                        iterateRequest = objStore.openCursor(range, direction);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: void 0
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
	
	                switch (_ret9) {
	                    case 'continue':
	                        continue;
	
	                    default:
	                        if ((typeof _ret9 === 'undefined' ? 'undefined' : _typeof(_ret9)) === "object") return _ret9.v;
	                }
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
	        var data = void 0;
	
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
	            var transaction = void 0;
	            var countRequest = void 0;
	            var abortErr = void 0;
	
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
	                            v: void 0
	                        };
	                    }
	
	                    try {
	                        var index = objStore.index(options.index);
	                        countRequest = index.count.apply(index, rangeArgs);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: void 0
	                        };
	                    }
	                } else {
	                    try {
	                        countRequest = objStore.count.apply(objStore, rangeArgs);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: void 0
	                        };
	                    }
	                }
	
	                countRequest.onsuccess = function (evt) {
	                    result[objStoreName] = evt.target.result || 0;
	                };
	            };
	
	            for (var objStoreName in data) {
	                var _ret12 = _loop7(objStoreName);
	
	                if ((typeof _ret12 === 'undefined' ? 'undefined' : _typeof(_ret12)) === "object") return _ret12.v;
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
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	
	function _toConsumableArray(arr) {
	    if (Array.isArray(arr)) {
	        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
	            arr2[i] = arr[i];
	        }return arr2;
	    } else {
	        return Array.from(arr);
	    }
	}
	
	var KinoPromise = function (_Promise) {
	    _inherits(KinoPromise, _Promise);
	
	    function KinoPromise() {
	        _classCallCheck(this, KinoPromise);
	
	        return _possibleConstructorReturn(this, Object.getPrototypeOf(KinoPromise).apply(this, arguments));
	    }
	
	    _createClass(KinoPromise, [{
	        key: 'spread',
	        value: function spread(onFulfilled, onRejected) {
	            function onFulfilledInternal(res) {
	                if (Array.isArray(res)) {
	                    return onFulfilled.apply(undefined, _toConsumableArray(res));
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
	        var promisesArray = void 0;
	        var promisesKeys = void 0;
	
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
	            var output = void 0;
	
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
	
	exports.default = KinoPromise;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBmOGVhYzBjZWI3YzZjNGQxN2JlNSIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9raW5vcHJvbWlzZS9idWlsZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTztBQ1ZBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYkE7Ozs7Ozs7Ozs7QUFFQSxLQUFNLGNBQWMsb0JBQVEsQ0FBUixDQUFkOztBQUVOLEtBQUksQ0FBQyxPQUFPLFNBQVAsRUFBa0I7QUFDbkIsWUFBTyxTQUFQLEdBQW1CLE9BQU8sWUFBUCxJQUF1QixPQUFPLGVBQVAsSUFBMEIsT0FBTyxXQUFQLENBRGpEO0VBQXZCOztBQUlBLEtBQUksQ0FBQyxPQUFPLGNBQVAsRUFBdUI7QUFDeEIsWUFBTyxjQUFQLEdBQXdCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxvQkFBUCxJQUErQixPQUFPLGdCQUFQLENBRDNEO0VBQTVCOztBQUlBLEtBQUksQ0FBQyxPQUFPLFdBQVAsRUFBb0I7QUFDckIsWUFBTyxXQUFQLEdBQXFCLE9BQU8sY0FBUCxJQUF5QixPQUFPLGlCQUFQLElBQTRCLE9BQU8sYUFBUCxDQURyRDtFQUF6Qjs7QUFJQSxLQUFJLENBQUMsT0FBTyxTQUFQLEVBQWtCO0FBQ25CLFlBQU8sU0FBUCxHQUFtQixPQUFPLFlBQVAs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LENBREc7Y0FGUDs7QUFTQSxxQkFBUSxNQUFSLEVBYm1DO1VBQVAsQ0FBaEMsQ0FjRyxLQWRILENBY1MsTUFkVCxFQVp3QztNQUFyQixDQUF2QixDQUx3RDtFQUExQzs7QUFtQ2xCLFNBQVEsT0FBUixHQUFrQixXQUFsQjtBQUNBLFFBQU8sT0FBUCxHQUFpQixRQUFRLFNBQVIsQ0FBakIsQyIsImZpbGUiOiJza2xhZC51bmNvbXByZXNzZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgZjhlYWMwY2ViN2M2YzRkMTdiZTVcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE2IERtaXRyeSBTb3JpbiA8aW5mb0BzdGF5cG9zaXRpdmUucnU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vMTk5OS9za2xhZFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogQGF1dGhvciBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogQGxpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sIE1JVCBMaWNlbnNlXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgS2lub1Byb21pc2UgPSByZXF1aXJlKCdraW5vcHJvbWlzZScpO1xuXG5pZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICB3aW5kb3cuaW5kZXhlZERCID0gd2luZG93Lm1vekluZGV4ZWREQiB8fCB3aW5kb3cud2Via2l0SW5kZXhlZERCIHx8IHdpbmRvdy5tc0luZGV4ZWREQjtcbn1cblxuaWYgKCF3aW5kb3cuSURCVHJhbnNhY3Rpb24pIHtcbiAgICB3aW5kb3cuSURCVHJhbnNhY3Rpb24gPSB3aW5kb3cubW96SURCVHJhbnNhY3Rpb24gfHwgd2luZG93LndlYmtpdElEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy5tc0lEQlRyYW5zYWN0aW9uO1xufVxuXG5pZiAoIXdpbmRvdy5JREJLZXlSYW5nZSkge1xuICAgIHdpbmRvdy5JREJLZXlSYW5nZSA9IHdpbmRvdy5tb3pJREJLZXlSYW5nZSB8fCB3aW5kb3cud2Via2l0SURCS2V5UmFuZ2UgfHwgd2luZG93Lm1zSURCS2V5UmFuZ2U7XG59XG5cbmlmICghd2luZG93LklEQkN1cnNvcikge1xuICAgIHdpbmRvdy5JREJDdXJzb3IgPSB3aW5kb3cubW96SURCQ3Vyc29yIHx8IHdpbmRvdy53ZWJraXRJREJDdXJzb3IgfHwgd2luZG93Lm1zSURCQ3Vyc29yO1xufVxuXG5jb25zdCBUUkFOU0FDVElPTl9SRUFET05MWSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX09OTFkgfHwgJ3JlYWRvbmx5JztcbmNvbnN0IFRSQU5TQUNUSU9OX1JFQURXUklURSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX1dSSVRFIHx8ICdyZWFkd3JpdGUnO1xuXG5jb25zdCBza2xhZEFQSSA9IHt9O1xuc2tsYWRBUEkuQVNDID0gd2luZG93LklEQkN1cnNvci5ORVhUIHx8ICduZXh0JztcbnNrbGFkQVBJLkFTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLk5FWFRfTk9fRFVQTElDQVRFIHx8ICduZXh0dW5pcXVlJztcbnNrbGFkQVBJLkRFU0MgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVYgfHwgJ3ByZXYnO1xuc2tsYWRBUEkuREVTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVZfTk9fRFVQTElDQVRFIHx8ICdwcmV2dW5pcXVlJztcblxuLy8gdW5mb3J0dW5hdGVseSBgYmFiZWwtcGx1Z2luLWFycmF5LWluY2x1ZGVzYCBjYW4ndCBjb252ZXJ0IEFycmF5LnByb3RvdHlwZS5pbmNsdWRlc1xuLy8gaW50byBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB3aXRoIGl0cyBjb2RlXG5jb25zdCBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5jb25zdCBzdXBwb3J0c09ialN0b3JlR2V0QWxsID0gdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGxLZXlzID09PSAnZnVuY3Rpb24nO1xuY29uc3Qgb2JqU3RvcmVzTWV0YSA9IG5ldyBNYXAoKTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgVVVJRHMgZm9yIG9iamVjdHMgd2l0aG91dCBrZXlzIHNldFxuICogQGxpbmsgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvaG93LXRvLWNyZWF0ZS1hLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0LzIxMTc1MjMjMjExNzUyM1xuICovXG5mdW5jdGlvbiB1dWlkKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgIGNvbnN0IHYgPSAoYyA9PT0gJ3gnKSA/IHIgOiAociYweDN8MHg4KTtcblxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKG5hbWUsIG1lc3NhZ2UpIHtcbiAgICBjb25zdCBlcnJPYmogPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyT2JqLm5hbWUgPSBuYW1lO1xuXG4gICAgcmV0dXJuIGVyck9iajtcbn1cblxuZnVuY3Rpb24gZW5zdXJlRXJyb3IoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZUVycm9yKGVyci5uYW1lLCBlcnIubWVzc2FnZSk7XG59XG5cbi8qKlxuICogQ29tbW9uIGFuY2VzdG9yIGZvciBvYmplY3RzIGNyZWF0ZWQgd2l0aCBza2xhZC5rZXlWYWx1ZSgpIG1ldGhvZFxuICogVXNlZCB0byBkaXN0aW5ndWlzaCBzdGFuZGFyZCBvYmplY3RzIHdpdGggXCJrZXlcIiBhbmQgXCJ2YWx1ZVwiIGZpZWxkcyBmcm9tIHNwZWNpYWwgb25lc1xuICovXG5jb25zdCBza2xhZEtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBDaGVja3MgZGF0YSBiZWZvcmUgc2F2aW5nIGl0IGluIHRoZSBvYmplY3Qgc3RvcmVcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZhbHNlIGlmIHNhdmVkIGRhdGEgdHlwZSBpcyBpbmNvcnJlY3QsIG90aGVyd2lzZSB7QXJyYXl9IG9iamVjdCBzdG9yZSBmdW5jdGlvbiBhcmd1bWVudHNcbiAqL1xuZnVuY3Rpb24gY2hlY2tTYXZlZERhdGEoZGJOYW1lLCBvYmpTdG9yZSwgZGF0YSkge1xuICAgIGNvbnN0IGtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mLmNhbGwoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwgZGF0YSk7XG4gICAgY29uc3QgdmFsdWUgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEudmFsdWUgOiBkYXRhO1xuICAgIGNvbnN0IG9ialN0b3JlTWV0YSA9IG9ialN0b3Jlc01ldGEuZ2V0KGRiTmFtZSkuZ2V0KG9ialN0b3JlLm5hbWUpO1xuICAgIGxldCBrZXkgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEua2V5IDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qga2V5UGF0aCA9IG9ialN0b3JlLmtleVBhdGggfHwgb2JqU3RvcmVNZXRhLmtleVBhdGg7XG4gICAgY29uc3QgYXV0b0luY3JlbWVudCA9IG9ialN0b3JlLmF1dG9JbmNyZW1lbnQgfHwgb2JqU3RvcmVNZXRhLmF1dG9JbmNyZW1lbnQ7XG5cbiAgICBpZiAoa2V5UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoIWF1dG9JbmNyZW1lbnQgJiYga2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGtleSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHN1cHBvcnQgZG90LXNlcGFyYXRlZCBhbmQgYXJyYXkga2V5UGF0aHNcbiAgICAgICAgaWYgKCFhdXRvSW5jcmVtZW50ICYmIGRhdGFba2V5UGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGF0YVtrZXlQYXRoXSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXkgPyBbdmFsdWUsIGtleV0gOiBbdmFsdWVdO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZGF0YWJhc2UgY29udGFpbnMgYWxsIG5lZWRlZCBzdG9yZXNcbiAqXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ29udGFpbmluZ1N0b3JlcyhvYmpTdG9yZU5hbWVzKSB7XG4gICAgcmV0dXJuIG9ialN0b3JlTmFtZXMuZXZlcnkoZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICByZXR1cm4gKGluZGV4T2YuY2FsbCh0aGlzLmRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMsIHN0b3JlTmFtZSkgIT09IC0xKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqXG4gKiBhdXRvSW5jcmVtZW50IGlzIGJyb2tlbiBpbiBJRSBmYW1pbHkuIFJ1biB0aGlzIHRyYW5zYWN0aW9uIHRvIGdldCBpdHMgdmFsdWVcbiAqIG9uIGV2ZXJ5IG9iamVjdCBzdG9yZVxuICpcbiAqIEBwYXJhbSB7SURCRGF0YWJhc2V9IGRiXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKlxuICogQHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjgyMTY1L2luZGV4ZWRkYi1pbi1pZTExLWVkZ2Utd2h5LWlzLW9ianN0b3JlLWF1dG9pbmNyZW1lbnQtdW5kZWZpbmVkXG4gKiBAc2VlIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL0ZlZWRiYWNrL0RldGFpbHMvNzcyNzI2XG4gKi9cbmZ1bmN0aW9uIGdldE9ialN0b3Jlc01ldGEoZGIsIG9ialN0b3JlTmFtZXMpIHtcbiAgICBjb25zdCBkYk1ldGEgPSBvYmpTdG9yZXNNZXRhLmdldChkYi5uYW1lKTtcbiAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgIGlmIChkYk1ldGEuaGFzKG9ialN0b3JlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oW29ialN0b3JlTmFtZV0sIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uYWJvcnQgPSByZXNvbHZlO1xuXG4gICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChvYmpTdG9yZS5hdXRvSW5jcmVtZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50OiBvYmpTdG9yZS5hdXRvSW5jcmVtZW50LFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoOiBvYmpTdG9yZS5rZXlQYXRoXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhdXRvSW5jcmVtZW50O1xuXG4gICAgICAgICAgICBpZiAob2JqU3RvcmUua2V5UGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGtleSBwYXRoIGlzIGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgb25seSBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gYnV0IGlmIGtleSBnZW5lcmF0b3IgKGF1dG9JbmNyZW1lbnQpIGlzIG5vdCBkZWZpbmVkIHRoZSBpbnNlcnRlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBjb250YWluIGZpZWxkKHMpIGRlc2NyaWJlZCBpbiBrZXlQYXRoIHZhbHVlIG90aGVyd2lzZSBJREJPYmplY3RTdG9yZS5hZGQgb3AgZmFpbHNcbiAgICAgICAgICAgICAgICAvLyBzbyBpZiB3ZSBydW4gT0RCT2JqZWN0U3RvcmUuYWRkIHdpdGggYW4gZW1wdHkgb2JqZWN0IGFuZCBpdCBmYWlscywgdGhpcyBtZWFucyB0aGF0XG4gICAgICAgICAgICAgICAgLy8gYXV0b0luY3JlbWVudCBwcm9wZXJ0eSB3YXMgZmFsc2UuIE90aGVyd2lzZSAtIHRydWVcbiAgICAgICAgICAgICAgICAvLyBpZiBrZXkgcGF0aCBpcyBhcnJheSBhdXRvSW5jcmVtZW50IHByb3BlcnR5IGNhbid0IGJlIHRydWVcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpTdG9yZS5rZXlQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmFkZCh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYga2V5IHBhdGggaXMgbm90IGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgYW55IGtpbmQgb2YgZGF0YVxuICAgICAgICAgICAgICAgIC8vIGJ1dCBpZiBrZXkgZ2VuZXJhdG9yIChhdXRvSW5jcmVtZW50KSBpcyBub3QgZGVmaW5lZCB5b3Ugc2hvdWxkIHNldCBpdCBleHBsaWNpdGx5XG4gICAgICAgICAgICAgICAgLy8gc28gaWYgd2UgcnVuIE9EQk9iamVjdFN0b3JlLmFkZCB3aXRoIG9uZSBhcmd1bWVudCBhbmQgaXQgZmFpbHMsIHRoaXMgbWVhbnMgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGF1dG9JbmNyZW1lbnQgcHJvcGVydHkgd2FzIGZhbHNlLiBPdGhlcndpc2UgLSB0cnVlXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuYWRkKCdzb21lIHZhbHVlJyk7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbWV0YSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQ6IGF1dG9JbmNyZW1lbnQsXG4gICAgICAgICAgICAgICAga2V5UGF0aDogb2JqU3RvcmUua2V5UGF0aFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGFuZCBhYm9ydCB0cmFuc2FjdGlvbiBzbyB0aGF0IG5ldyByZWNvcmQgaXMgZm9yZ290dGVuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hYm9ydCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cblxuY29uc3Qgc2tsYWRDb25uZWN0aW9uID0ge1xuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvbmUgcmVjb3JkIGludG8gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZCBvYmplY3Qga2V5XG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgbXVsdGlwbGUgcmVjb3JkcyBpbnRvIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBpbnNlcnRlZCBvYmplY3RzJyBrZXlzXG4gICAgICovXG4gICAgaW5zZXJ0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0T2JqU3RvcmVzTWV0YSh0aGlzLmRhdGFiYXNlLCBvYmpTdG9yZU5hbWVzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvYmpTdG9yZU5hbWVdOiBBcnJheS5pc0FycmF5KGRhdGFbb2JqU3RvcmVOYW1lXSkgPyBkYXRhW29ialN0b3JlTmFtZV0gOiBbZGF0YVtvYmpTdG9yZU5hbWVdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4ocmVzID0+IHJlc1tvYmpTdG9yZU5hbWVdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXVswXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbb2JqU3RvcmVOYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZERhdGEgPSBjaGVja1NhdmVkRGF0YSh0aGlzLmRhdGFiYXNlLm5hbWUsIG9ialN0b3JlLCBkYXRhW29ialN0b3JlTmFtZV1baV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBjcmVhdGVFcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCAnWW91IG11c3Qgc3VwcGx5IG9iamVjdHMgdG8gYmUgc2F2ZWQgaW4gdGhlIG9iamVjdCBzdG9yZSB3aXRoIHNldCBrZXlQYXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEgPSBvYmpTdG9yZS5hZGQuYXBwbHkob2JqU3RvcmUsIGNoZWNrZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW2ldID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBJbnNlcnQgb3IgdXBkYXRlIG9uZSByZWNvcmQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZC91cGRhdGVkIG9iamVjdCBrZXkgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgb3IgdXBkYXRlIG11bHRpcGxlIHJlY29yZHMgaW4gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0cycga2V5cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB1cHNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRPYmpTdG9yZXNNZXRhKHRoaXMuZGF0YWJhc2UsIG9ialN0b3JlTmFtZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMudXBzZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29ialN0b3JlTmFtZV06IEFycmF5LmlzQXJyYXkoZGF0YVtvYmpTdG9yZU5hbWVdKSA/IGRhdGFbb2JqU3RvcmVOYW1lXSA6IFtkYXRhW29ialN0b3JlTmFtZV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXMgPT4gcmVzW29ialN0b3JlTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKHRoaXMuZGF0YWJhc2UubmFtZSwgb2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLnB1dC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIERlbGV0ZSBvbmUgcmVjb3JkIGZyb20gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge01peGVkfSBrZXlcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqXG4gICAgICogMikgRGVsZXRlIG11bHRpcGxlIHJlY29yZHMgZnJvbSB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiBBVFRFTlRJT046IHlvdSBjYW4gcGFzcyBvbmx5IFZBTElEIEtFWVMgT1IgS0VZIFJBTkdFUyB0byBkZWxldGUgcmVjb3Jkc1xuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLXZhbGlkLWtleVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLWtleS1yYW5nZVxuICAgICAqL1xuICAgIGRlbGV0ZTogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2RlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBvYmpTdG9yZU5hbWVzLm1hcChvYmpTdG9yZU5hbWUgPT4gdGhpcy5kZWxldGUob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZGF0YVtvYmpTdG9yZU5hbWVdLmZvckVhY2gocmVjb3JkS2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZGVsZXRlKHJlY29yZEtleSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBvYmplY3Qgc3RvcmUocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBvYmpTdG9yZU5hbWVzIGFycmF5IG9mIG9iamVjdCBzdG9yZXMgb3IgYSBzaW5nbGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IGVyclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXIob2JqU3RvcmVOYW1lcykge1xuICAgICAgICBvYmpTdG9yZU5hbWVzID0gQXJyYXkuaXNBcnJheShvYmpTdG9yZU5hbWVzKSA/IG9ialN0b3JlTmFtZXMgOiBbb2JqU3RvcmVOYW1lc107XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gb2JqU3RvcmVOYW1lcy5tYXAob2JqU3RvcmVOYW1lID0+IHRoaXMuY2xlYXIoW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXJfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBHZXQgb2JqZWN0cyBmcm9tIG9uZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCBrZXlzICdpbmRleCcsICdyYW5nZScsICdvZmZzZXQnLCAnbGltaXQnIGFuZCAnZGlyZWN0aW9uJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge0FycmF5fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEdldCBvYmplY3RzIGZyb20gbXVsdGlwbGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZ2V0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGFyZ3VtZW50c1swXSA9PT0gJ29iamVjdCcpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xuICAgICAgICBsZXQgZGF0YSwgYWJvcnRFcnI7XG5cbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG9ialN0b3JlTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuZ2V0KG9ialN0b3JlTmFtZSwgZGF0YVtvYmpTdG9yZU5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBLaW5vUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnMuZGlyZWN0aW9uIHx8IHNrbGFkQVBJLkFTQztcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGxldCB1c2VHZXRBbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgaXRlcmF0ZVJlcXVlc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNPYmpTdG9yZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBnZXRBbGwgZG9lc24ndCB3b3JrIGZvciBpbmRleCByYW5nZXMgKyBpdCBkb2Vzbid0IHN1cHBvcnQgc3BlY2lhbCBkaXJlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lEQk9iamVjdFN0b3JlL2dldEFsbFxuICAgICAgICAgICAgICAgICAgICB1c2VHZXRBbGwgPSBPYmplY3Qua2V5cyhvcHRpb25zKS5ldmVyeShrZXkgPT4gKGtleSAhPT0gJ2luZGV4JyAmJiBrZXkgIT09ICdkaXJlY3Rpb24nKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVzZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBicm93c2VyIHN1cHBvcnRzIGdldEFsbC9nZXRBbGxLZXlzIG1ldGhvZHMgaXQgY291bGQgYmUgZmFzdGVyIHRvIHJ1biB0aGVzZSBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGdldCBhbGwgcmVjb3JkcyBpZiB0aGVyZSdzIG5vIGBpbmRleGAgb3IgYGRpcmVjdGlvbmAgb3B0aW9ucyBzZXRcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5mb3J0dW5hdGVseSBnZXRBbGwgZG9lc24ndCBleHBvc2UgcmVzdWx0IGtleXMgc28gd2UgaGF2ZSB0byBydW4gYm90aCB0aGVzZSBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGdldCBhbGwga2V5cyBhbmQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIEFueXdheSBpdCBzZWVtcyBsaWtlIDIgZ2V0QWxsKiBvcHMgYXJlIGZhc3RlciBpbiBtb2Rlcm4gYnJvd3NlcnMgdGhhbiB0aGF0IG9uZVxuICAgICAgICAgICAgICAgICAgICAvLyB3b3JraW5nIHdpdGggVURCQ3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lEQk9iamVjdFN0b3JlL2dldEFsbFxuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxLZXlzXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vaWRiLWlkYmN1cnNvci12cy1pZGJvYmplY3RzdG9yZS1nZXRhbGwtb3BzLzNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IFtyYW5nZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2gob3B0aW9ucy5saW1pdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0gKz0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGFsbCB2YWx1ZXMgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZ2V0QWxsKC4uLmFyZ3MpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRJbmRleCA9IGluZGV4IC0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGFsbCBrZXlzIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbEtleXMoLi4uYXJncykub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdEluZGV4ID0gaW5kZXggLSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1bcmVzdWx0SW5kZXhdLmtleSA9IGtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIDIgc2VwYXJhdGUgSURCUmVxdWVzdHMgcnVubmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gdGhlcmUncyBubyBuZWVkIHRvIGJpbmQgbGlzdGVuZXIgdG8gc3VjY2VzcyBldmVudCBvZiBhbnkgb2YgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JQb3NpdGlvbk1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0ICYmICFjdXJzb3JQb3NpdGlvbk1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JQb3NpdGlvbk1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG9wdGlvbnMub2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPT09IHJlc3VsdFtvYmpTdG9yZU5hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIENvdW50IG9iamVjdHMgaW4gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JyBvci9hbmQgJ3JhbmdlJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge051bWJlcn0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgQ291bnQgb2JqZWN0cyBpbiBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgY291bnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG4gICAgICAgIGxldCBkYXRhO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgY291bnRSZXF1ZXN0O1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5jb3VudChvYmpTdG9yZU5hbWUsIGRhdGFbb2JqU3RvcmVOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tvYmpTdG9yZU5hbWVdID0gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2VBcmdzID0gKG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UpID8gW29wdGlvbnMucmFuZ2VdIDogW107XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IGluZGV4LmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IG9ialN0b3JlLmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkNvbm5SZXF1ZXN0ID0gd2luZG93LmluZGV4ZWREQi5vcGVuKGRiTmFtZSwgb3B0aW9ucy52ZXJzaW9uKTtcbiAgICAgICAgbGV0IGlzUmVzb2x2ZWRPclJlamVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb24gPSBvcHRpb25zLm1pZ3JhdGlvbiB8fCB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBldnQub2xkVmVyc2lvbiArIDE7IGkgPD0gZXZ0Lm5ld1ZlcnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5taWdyYXRpb25baV0pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb25baV0uY2FsbCh0aGlzLCB0aGlzLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGV2dC50YXJnZXQuZXJyb3IpKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWZXJzaW9uID0gcGFyc2VJbnQoZGF0YWJhc2UudmVyc2lvbiB8fCAwLCAxMCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YWJhc2Uuc2V0VmVyc2lvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBvbGRWZXJzaW9uIDwgb3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlVmVyUmVxdWVzdCA9IGRhdGFiYXNlLnNldFZlcnNpb24ob3B0aW9ucy52ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0ID0gbmV3IEV2ZW50KCd1cGdyYWRlbmVlZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQubmV3VmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZC5jYWxsKHtyZXN1bHQ6IGV2dC50YXJnZXQuc291cmNlfSwgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgc2tsYWRBUEkub3BlbihkYk5hbWUsIG9wdGlvbnMpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBldnQudGFyZ2V0LmVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LndlYmtpdEVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1vekVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1zRXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQuZXJyb3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0b3JlIG9iamVjdCBzdG9yZXMgcHJvcGVydGllcyBpbiB0aGVpciBvd24gbWFwXG4gICAgICAgICAgICBvYmpTdG9yZXNNZXRhLnNldChkYk5hbWUsIG5ldyBNYXAoKSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoT2JqZWN0LmNyZWF0ZShza2xhZENvbm5lY3Rpb24sIHtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZToge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YWJhc2UsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICByZWplY3QoY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYCkpO1xuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZVxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5kZWxldGVEYXRhYmFzZSA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlKGRiTmFtZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkRiUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTtcblxuICAgICAgICBvcGVuRGJSZXF1ZXN0Lm9uc3VjY2VzcyA9IG9wZW5EYlJlcXVlc3Qub25lcnJvciA9IG9wZW5EYlJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gc2tsYWRfZGVsZXRlRGF0YWJhc2Vfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSAoZXZ0LnR5cGUgPT09ICdibG9ja2VkJylcbiAgICAgICAgICAgICAgICA/IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsIGBEYXRhYmFzZSAke2RiTmFtZX0gaXMgYmxvY2tlZGApXG4gICAgICAgICAgICAgICAgOiBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldnQudHlwZSAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuXG5za2xhZEFQSS5rZXlWYWx1ZSA9IGZ1bmN0aW9uIHNrbGFkX2tleVZhbHVlKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShza2xhZEtleVZhbHVlQ29udGFpbmVyLCB7XG4gICAgICAgIGtleToge3ZhbHVlOiBrZXksIGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgIHZhbHVlOiB7dmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9XG4gICAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBza2xhZEFQSTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vbGliL3NrbGFkLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBhcnIyW2ldID0gYXJyW2ldOyByZXR1cm4gYXJyMjsgfSBlbHNlIHsgcmV0dXJuIEFycmF5LmZyb20oYXJyKTsgfSB9XG5cbmNsYXNzIEtpbm9Qcm9taXNlIGV4dGVuZHMgUHJvbWlzZSB7XG4gICAgc3ByZWFkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkSW50ZXJuYWwocmVzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uRnVsZmlsbGVkLmFwcGx5KHVuZGVmaW5lZCwgX3RvQ29uc3VtYWJsZUFycmF5KHJlcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4ob25GdWxmaWxsZWRJbnRlcm5hbCwgb25SZWplY3RlZCk7XG4gICAgfVxufVxuXG5LaW5vUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiBLaW5vUHJvbWlzZV9zdGF0aWNfYWxsKHByb21pc2VzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBwcm9taXNlcyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsLmFwcGx5KFByb21pc2UsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBLaW5vUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGlzUHJvbWlzZXNMaXN0ID0gQXJyYXkuaXNBcnJheShwcm9taXNlcyk7XG4gICAgICAgIGxldCBwcm9taXNlc0FycmF5O1xuICAgICAgICBsZXQgcHJvbWlzZXNLZXlzO1xuXG4gICAgICAgIGlmIChpc1Byb21pc2VzTGlzdCkge1xuICAgICAgICAgICAgcHJvbWlzZXNBcnJheSA9IHByb21pc2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZXNLZXlzID0gT2JqZWN0LmtleXMocHJvbWlzZXMpO1xuICAgICAgICAgICAgcHJvbWlzZXNBcnJheSA9IHByb21pc2VzS2V5cy5tYXAoa2V5ID0+IHByb21pc2VzW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXNBcnJheSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgLy8gdHJhbnNmb3JtIG91dHB1dCBpbnRvIGFuIG9iamVjdFxuICAgICAgICAgICAgbGV0IG91dHB1dDtcblxuICAgICAgICAgICAgaWYgKGlzUHJvbWlzZXNMaXN0KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gcmVzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZXMucmVkdWNlKChvdXRwdXQsIGNodW5rLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbcHJvbWlzZXNLZXlzW2luZGV4XV0gPSBjaHVuaztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc29sdmUob3V0cHV0KTtcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IEtpbm9Qcm9taXNlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34va2lub3Byb21pc2UvYnVpbGQuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9