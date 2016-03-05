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
	
	        var isMulti = arguments.length === 2 && _typeof(arguments[0]) === 'object' && typeof arguments[1] === 'function';
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
	            data[arguments[0]] = typeof arguments[1] === 'function' ? null : arguments[1];
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
	                    useGetAll = Object.keys(options).every(function (key) {
	                        return key === 'limit' || key === 'range';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBmYmZkODcwNmZlNDJkNjZlNmQ1YSIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9raW5vcHJvbWlzZS9idWlsZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTztBQ1ZBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYkE7Ozs7Ozs7Ozs7QUFFQSxLQUFNLGNBQWMsb0JBQVEsQ0FBUixDQUFkOztBQUVOLEtBQUksQ0FBQyxPQUFPLFNBQVAsRUFBa0I7QUFDbkIsWUFBTyxTQUFQLEdBQW1CLE9BQU8sWUFBUCxJQUF1QixPQUFPLGVBQVAsSUFBMEIsT0FBTyxXQUFQLENBRGpEO0VBQXZCOztBQUlBLEtBQUksQ0FBQyxPQUFPLGNBQVAsRUFBdUI7QUFDeEIsWUFBTyxjQUFQLEdBQXdCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxvQkFBUCxJQUErQixPQUFPLGdCQUFQLENBRDNEO0VBQTVCOztBQUlBLEtBQUksQ0FBQyxPQUFPLFdBQVAsRUFBb0I7QUFDckIsWUFBTyxXQUFQLEdBQXFCLE9BQU8sY0FBUCxJQUF5QixPQUFPLGlCQUFQLElBQTRCLE9BQU8sYUFBUCxDQURyRDtFQUF6Qjs7QUFJQSxLQUFJLENBQUMsT0FBTyxTQUFQLEVBQWtCO0FBQ25CLFlBQU8sU0FBUCxHQUFtQixPQUFPLFlBQVAs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Iiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiBcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb25cbiAqKi8iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIGZiZmQ4NzA2ZmU0MmQ2NmU2ZDVhXG4gKiovIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNiBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogaHR0cHM6Ly9naXRodWIuY29tLzE5OTkvc2tsYWRcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIEBhdXRob3IgRG1pdHJ5IFNvcmluIDxpbmZvQHN0YXlwb3NpdGl2ZS5ydT5cbiAqIEBsaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbCBNSVQgTGljZW5zZVxuICovXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IEtpbm9Qcm9taXNlID0gcmVxdWlyZSgna2lub3Byb21pc2UnKTtcblxuaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgd2luZG93LmluZGV4ZWREQiA9IHdpbmRvdy5tb3pJbmRleGVkREIgfHwgd2luZG93LndlYmtpdEluZGV4ZWREQiB8fCB3aW5kb3cubXNJbmRleGVkREI7XG59XG5cbmlmICghd2luZG93LklEQlRyYW5zYWN0aW9uKSB7XG4gICAgd2luZG93LklEQlRyYW5zYWN0aW9uID0gd2luZG93Lm1veklEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy53ZWJraXRJREJUcmFuc2FjdGlvbiB8fCB3aW5kb3cubXNJREJUcmFuc2FjdGlvbjtcbn1cblxuaWYgKCF3aW5kb3cuSURCS2V5UmFuZ2UpIHtcbiAgICB3aW5kb3cuSURCS2V5UmFuZ2UgPSB3aW5kb3cubW96SURCS2V5UmFuZ2UgfHwgd2luZG93LndlYmtpdElEQktleVJhbmdlIHx8IHdpbmRvdy5tc0lEQktleVJhbmdlO1xufVxuXG5pZiAoIXdpbmRvdy5JREJDdXJzb3IpIHtcbiAgICB3aW5kb3cuSURCQ3Vyc29yID0gd2luZG93Lm1veklEQkN1cnNvciB8fCB3aW5kb3cud2Via2l0SURCQ3Vyc29yIHx8IHdpbmRvdy5tc0lEQkN1cnNvcjtcbn1cblxuY29uc3QgVFJBTlNBQ1RJT05fUkVBRE9OTFkgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9PTkxZIHx8ICdyZWFkb25seSc7XG5jb25zdCBUUkFOU0FDVElPTl9SRUFEV1JJVEUgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9XUklURSB8fCAncmVhZHdyaXRlJztcblxuY29uc3Qgc2tsYWRBUEkgPSB7fTtcbnNrbGFkQVBJLkFTQyA9IHdpbmRvdy5JREJDdXJzb3IuTkVYVCB8fCAnbmV4dCc7XG5za2xhZEFQSS5BU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5ORVhUX05PX0RVUExJQ0FURSB8fCAnbmV4dHVuaXF1ZSc7XG5za2xhZEFQSS5ERVNDID0gd2luZG93LklEQkN1cnNvci5QUkVWIHx8ICdwcmV2JztcbnNrbGFkQVBJLkRFU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5QUkVWX05PX0RVUExJQ0FURSB8fCAncHJldnVuaXF1ZSc7XG5cbi8vIHVuZm9ydHVuYXRlbHkgYGJhYmVsLXBsdWdpbi1hcnJheS1pbmNsdWRlc2AgY2FuJ3QgY29udmVydCBBcnJheS5wcm90b3R5cGUuaW5jbHVkZXNcbi8vIGludG8gQXJyYXkucHJvdG90eXBlLmluZGV4T2Ygd2l0aCBpdHMgY29kZVxuY29uc3QgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xuY29uc3Qgc3VwcG9ydHNPYmpTdG9yZUdldEFsbCA9IHR5cGVvZiBJREJPYmplY3RTdG9yZS5wcm90b3R5cGUuZ2V0QWxsID09PSAnZnVuY3Rpb24nO1xuY29uc3Qgb2JqU3RvcmVzTWV0YSA9IG5ldyBNYXAoKTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgVVVJRHMgZm9yIG9iamVjdHMgd2l0aG91dCBrZXlzIHNldFxuICogQGxpbmsgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvaG93LXRvLWNyZWF0ZS1hLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0LzIxMTc1MjMjMjExNzUyM1xuICovXG5mdW5jdGlvbiB1dWlkKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgIGNvbnN0IHYgPSAoYyA9PT0gJ3gnKSA/IHIgOiAociYweDN8MHg4KTtcblxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKG5hbWUsIG1lc3NhZ2UpIHtcbiAgICBjb25zdCBlcnJPYmogPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyT2JqLm5hbWUgPSBuYW1lO1xuXG4gICAgcmV0dXJuIGVyck9iajtcbn1cblxuZnVuY3Rpb24gZW5zdXJlRXJyb3IoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZUVycm9yKGVyci5uYW1lLCBlcnIubWVzc2FnZSk7XG59XG5cbi8qKlxuICogQ29tbW9uIGFuY2VzdG9yIGZvciBvYmplY3RzIGNyZWF0ZWQgd2l0aCBza2xhZC5rZXlWYWx1ZSgpIG1ldGhvZFxuICogVXNlZCB0byBkaXN0aW5ndWlzaCBzdGFuZGFyZCBvYmplY3RzIHdpdGggXCJrZXlcIiBhbmQgXCJ2YWx1ZVwiIGZpZWxkcyBmcm9tIHNwZWNpYWwgb25lc1xuICovXG5jb25zdCBza2xhZEtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBDaGVja3MgZGF0YSBiZWZvcmUgc2F2aW5nIGl0IGluIHRoZSBvYmplY3Qgc3RvcmVcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZhbHNlIGlmIHNhdmVkIGRhdGEgdHlwZSBpcyBpbmNvcnJlY3QsIG90aGVyd2lzZSB7QXJyYXl9IG9iamVjdCBzdG9yZSBmdW5jdGlvbiBhcmd1bWVudHNcbiAqL1xuZnVuY3Rpb24gY2hlY2tTYXZlZERhdGEoZGJOYW1lLCBvYmpTdG9yZSwgZGF0YSkge1xuICAgIGNvbnN0IGtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mLmNhbGwoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwgZGF0YSk7XG4gICAgY29uc3QgdmFsdWUgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEudmFsdWUgOiBkYXRhO1xuICAgIGNvbnN0IG9ialN0b3JlTWV0YSA9IG9ialN0b3Jlc01ldGEuZ2V0KGRiTmFtZSkuZ2V0KG9ialN0b3JlLm5hbWUpO1xuICAgIGxldCBrZXkgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEua2V5IDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qga2V5UGF0aCA9IG9ialN0b3JlLmtleVBhdGggfHwgb2JqU3RvcmVNZXRhLmtleVBhdGg7XG4gICAgY29uc3QgYXV0b0luY3JlbWVudCA9IG9ialN0b3JlLmF1dG9JbmNyZW1lbnQgfHwgb2JqU3RvcmVNZXRhLmF1dG9JbmNyZW1lbnQ7XG5cbiAgICBpZiAoa2V5UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoIWF1dG9JbmNyZW1lbnQgJiYga2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGtleSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHN1cHBvcnQgZG90LXNlcGFyYXRlZCBhbmQgYXJyYXkga2V5UGF0aHNcbiAgICAgICAgaWYgKCFhdXRvSW5jcmVtZW50ICYmIGRhdGFba2V5UGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGF0YVtrZXlQYXRoXSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXkgPyBbdmFsdWUsIGtleV0gOiBbdmFsdWVdO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZGF0YWJhc2UgY29udGFpbnMgYWxsIG5lZWRlZCBzdG9yZXNcbiAqXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ29udGFpbmluZ1N0b3JlcyhvYmpTdG9yZU5hbWVzKSB7XG4gICAgcmV0dXJuIG9ialN0b3JlTmFtZXMuZXZlcnkoZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICByZXR1cm4gKGluZGV4T2YuY2FsbCh0aGlzLmRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMsIHN0b3JlTmFtZSkgIT09IC0xKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqXG4gKiBhdXRvSW5jcmVtZW50IGlzIGJyb2tlbiBpbiBJRSBmYW1pbHkuIFJ1biB0aGlzIHRyYW5zYWN0aW9uIHRvIGdldCBpdHMgdmFsdWVcbiAqIG9uIGV2ZXJ5IG9iamVjdCBzdG9yZVxuICpcbiAqIEBwYXJhbSB7SURCRGF0YWJhc2V9IGRiXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKlxuICogQHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjgyMTY1L2luZGV4ZWRkYi1pbi1pZTExLWVkZ2Utd2h5LWlzLW9ianN0b3JlLWF1dG9pbmNyZW1lbnQtdW5kZWZpbmVkXG4gKiBAc2VlIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL0ZlZWRiYWNrL0RldGFpbHMvNzcyNzI2XG4gKi9cbmZ1bmN0aW9uIGdldE9ialN0b3Jlc01ldGEoZGIsIG9ialN0b3JlTmFtZXMpIHtcbiAgICBjb25zdCBkYk1ldGEgPSBvYmpTdG9yZXNNZXRhLmdldChkYi5uYW1lKTtcbiAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgIGlmIChkYk1ldGEuaGFzKG9ialN0b3JlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oW29ialN0b3JlTmFtZV0sIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uYWJvcnQgPSByZXNvbHZlO1xuXG4gICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChvYmpTdG9yZS5hdXRvSW5jcmVtZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50OiBvYmpTdG9yZS5hdXRvSW5jcmVtZW50LFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoOiBvYmpTdG9yZS5rZXlQYXRoXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhdXRvSW5jcmVtZW50O1xuXG4gICAgICAgICAgICBpZiAob2JqU3RvcmUua2V5UGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGtleSBwYXRoIGlzIGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgb25seSBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gYnV0IGlmIGtleSBnZW5lcmF0b3IgKGF1dG9JbmNyZW1lbnQpIGlzIG5vdCBkZWZpbmVkIHRoZSBpbnNlcnRlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBjb250YWluIGZpZWxkKHMpIGRlc2NyaWJlZCBpbiBrZXlQYXRoIHZhbHVlIG90aGVyd2lzZSBJREJPYmplY3RTdG9yZS5hZGQgb3AgZmFpbHNcbiAgICAgICAgICAgICAgICAvLyBzbyBpZiB3ZSBydW4gT0RCT2JqZWN0U3RvcmUuYWRkIHdpdGggYW4gZW1wdHkgb2JqZWN0IGFuZCBpdCBmYWlscywgdGhpcyBtZWFucyB0aGF0XG4gICAgICAgICAgICAgICAgLy8gYXV0b0luY3JlbWVudCBwcm9wZXJ0eSB3YXMgZmFsc2UuIE90aGVyd2lzZSAtIHRydWVcbiAgICAgICAgICAgICAgICAvLyBpZiBrZXkgcGF0aCBpcyBhcnJheSBhdXRvSW5jcmVtZW50IHByb3BlcnR5IGNhbid0IGJlIHRydWVcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpTdG9yZS5rZXlQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmFkZCh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYga2V5IHBhdGggaXMgbm90IGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgYW55IGtpbmQgb2YgZGF0YVxuICAgICAgICAgICAgICAgIC8vIGJ1dCBpZiBrZXkgZ2VuZXJhdG9yIChhdXRvSW5jcmVtZW50KSBpcyBub3QgZGVmaW5lZCB5b3Ugc2hvdWxkIHNldCBpdCBleHBsaWNpdGx5XG4gICAgICAgICAgICAgICAgLy8gc28gaWYgd2UgcnVuIE9EQk9iamVjdFN0b3JlLmFkZCB3aXRoIG9uZSBhcmd1bWVudCBhbmQgaXQgZmFpbHMsIHRoaXMgbWVhbnMgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGF1dG9JbmNyZW1lbnQgcHJvcGVydHkgd2FzIGZhbHNlLiBPdGhlcndpc2UgLSB0cnVlXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuYWRkKCdzb21lIHZhbHVlJyk7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbWV0YSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQ6IGF1dG9JbmNyZW1lbnQsXG4gICAgICAgICAgICAgICAga2V5UGF0aDogb2JqU3RvcmUua2V5UGF0aFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGFuZCBhYm9ydCB0cmFuc2FjdGlvbiBzbyB0aGF0IG5ldyByZWNvcmQgaXMgZm9yZ290dGVuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hYm9ydCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cblxuY29uc3Qgc2tsYWRDb25uZWN0aW9uID0ge1xuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvbmUgcmVjb3JkIGludG8gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZCBvYmplY3Qga2V5XG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgbXVsdGlwbGUgcmVjb3JkcyBpbnRvIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBpbnNlcnRlZCBvYmplY3RzJyBrZXlzXG4gICAgICovXG4gICAgaW5zZXJ0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0T2JqU3RvcmVzTWV0YSh0aGlzLmRhdGFiYXNlLCBvYmpTdG9yZU5hbWVzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvYmpTdG9yZU5hbWVdOiBBcnJheS5pc0FycmF5KGRhdGFbb2JqU3RvcmVOYW1lXSkgPyBkYXRhW29ialN0b3JlTmFtZV0gOiBbZGF0YVtvYmpTdG9yZU5hbWVdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4ocmVzID0+IHJlc1tvYmpTdG9yZU5hbWVdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXVswXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbb2JqU3RvcmVOYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZERhdGEgPSBjaGVja1NhdmVkRGF0YSh0aGlzLmRhdGFiYXNlLm5hbWUsIG9ialN0b3JlLCBkYXRhW29ialN0b3JlTmFtZV1baV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBjcmVhdGVFcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCAnWW91IG11c3Qgc3VwcGx5IG9iamVjdHMgdG8gYmUgc2F2ZWQgaW4gdGhlIG9iamVjdCBzdG9yZSB3aXRoIHNldCBrZXlQYXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEgPSBvYmpTdG9yZS5hZGQuYXBwbHkob2JqU3RvcmUsIGNoZWNrZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW2ldID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBJbnNlcnQgb3IgdXBkYXRlIG9uZSByZWNvcmQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZC91cGRhdGVkIG9iamVjdCBrZXkgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgb3IgdXBkYXRlIG11bHRpcGxlIHJlY29yZHMgaW4gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0cycga2V5cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB1cHNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRPYmpTdG9yZXNNZXRhKHRoaXMuZGF0YWJhc2UsIG9ialN0b3JlTmFtZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMudXBzZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29ialN0b3JlTmFtZV06IEFycmF5LmlzQXJyYXkoZGF0YVtvYmpTdG9yZU5hbWVdKSA/IGRhdGFbb2JqU3RvcmVOYW1lXSA6IFtkYXRhW29ialN0b3JlTmFtZV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXMgPT4gcmVzW29ialN0b3JlTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKHRoaXMuZGF0YWJhc2UubmFtZSwgb2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLnB1dC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIERlbGV0ZSBvbmUgcmVjb3JkIGZyb20gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge01peGVkfSBrZXlcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqXG4gICAgICogMikgRGVsZXRlIG11bHRpcGxlIHJlY29yZHMgZnJvbSB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiBBVFRFTlRJT046IHlvdSBjYW4gcGFzcyBvbmx5IFZBTElEIEtFWVMgT1IgS0VZIFJBTkdFUyB0byBkZWxldGUgcmVjb3Jkc1xuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLXZhbGlkLWtleVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLWtleS1yYW5nZVxuICAgICAqL1xuICAgIGRlbGV0ZTogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2RlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBvYmpTdG9yZU5hbWVzLm1hcChvYmpTdG9yZU5hbWUgPT4gdGhpcy5kZWxldGUob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZGF0YVtvYmpTdG9yZU5hbWVdLmZvckVhY2gocmVjb3JkS2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZGVsZXRlKHJlY29yZEtleSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBvYmplY3Qgc3RvcmUocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBvYmpTdG9yZU5hbWVzIGFycmF5IG9mIG9iamVjdCBzdG9yZXMgb3IgYSBzaW5nbGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IGVyclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXIob2JqU3RvcmVOYW1lcykge1xuICAgICAgICBvYmpTdG9yZU5hbWVzID0gQXJyYXkuaXNBcnJheShvYmpTdG9yZU5hbWVzKSA/IG9ialN0b3JlTmFtZXMgOiBbb2JqU3RvcmVOYW1lc107XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gb2JqU3RvcmVOYW1lcy5tYXAob2JqU3RvcmVOYW1lID0+IHRoaXMuY2xlYXIoW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXJfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBHZXQgb2JqZWN0cyBmcm9tIG9uZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCBrZXlzICdpbmRleCcsICdyYW5nZScsICdvZmZzZXQnLCAnbGltaXQnIGFuZCAnZGlyZWN0aW9uJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge0FycmF5fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEdldCBvYmplY3RzIGZyb20gbXVsdGlwbGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZ2V0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDIgJiYgdHlwZW9mIGFyZ3VtZW50c1swXSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ2Z1bmN0aW9uJyk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBkYXRhLCBhYm9ydEVycjtcblxuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9ICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG9ialN0b3JlTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuZ2V0KG9ialN0b3JlTmFtZSwgZGF0YVtvYmpTdG9yZU5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBLaW5vUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnMuZGlyZWN0aW9uIHx8IHNrbGFkQVBJLkFTQztcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGxldCB1c2VHZXRBbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgaXRlcmF0ZVJlcXVlc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNPYmpTdG9yZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICB1c2VHZXRBbGwgPSBPYmplY3Qua2V5cyhvcHRpb25zKS5ldmVyeShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5ID09PSAnbGltaXQnIHx8IGtleSA9PT0gJ3JhbmdlJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LyogZWxzZSBpZiAodXNlR2V0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lEQk9iamVjdFN0b3JlL2dldEFsbFxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZ2V0QWxsKHJhbmdlLCBvcHRpb25zLmxpbWl0IHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSkub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgbnVsbCwgJyAgICAnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXN1bHRbb2JqU3RvcmVOYW1lXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAga2V5OiBjdXJzb3Iua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0qLyBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgY3Vyc29yUG9zaXRpb25Nb3ZlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBubyBtb3JlIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9mZnNldCAmJiAhY3Vyc29yUG9zaXRpb25Nb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yUG9zaXRpb25Nb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IuYWR2YW5jZShvcHRpb25zLm9mZnNldCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBjdXJzb3Iua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN1cnNvci52YWx1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCAmJiBvcHRpb25zLmxpbWl0ID09PSByZXN1bHRbb2JqU3RvcmVOYW1lXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBDb3VudCBvYmplY3RzIGluIG9uZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCBrZXlzICdpbmRleCcgb3IvYW5kICdyYW5nZSdcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtOdW1iZXJ9IG51bWJlciBvZiBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIENvdW50IG9iamVjdHMgaW4gbXVsdGlwbGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGNvdW50OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0Jyk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuICAgICAgICBsZXQgZGF0YTtcblxuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9ICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgbGV0IGNvdW50UmVxdWVzdDtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuY291bnQob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlQXJncyA9IChvcHRpb25zLnJhbmdlIGluc3RhbmNlb2Ygd2luZG93LklEQktleVJhbmdlKSA/IFtvcHRpb25zLnJhbmdlXSA6IFtdO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3QgPSBpbmRleC5jb3VudCguLi5yYW5nZUFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3QgPSBvYmpTdG9yZS5jb3VudCguLi5yYW5nZUFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gZXZ0LnRhcmdldC5yZXN1bHQgfHwgMDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xvc2UgSW5kZXhlZERCIGNvbm5lY3Rpb25cbiAgICAgKi9cbiAgICBjbG9zZTogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2Nsb3NlKCkge1xuICAgICAgICB0aGlzLmRhdGFiYXNlLmNsb3NlKCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmRhdGFiYXNlO1xuICAgIH1cbn07XG5cbi8qKlxuICogT3BlbnMgY29ubmVjdGlvbiB0byBhIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZSBkYXRhYmFzZSBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMgPSB7fV0gY29ubmVjdGlvbiBvcHRpb25zXG4gKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMudmVyc2lvbl0gZGF0YWJhc2UgdmVyc2lvblxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLm1pZ3JhdGlvbl0gbWlncmF0aW9uIHNjcmlwdHNcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKiAgIEBwYXJhbSB7T2JqZWN0fSBbY29ubl0gaWYgLSBwcm9taXNlIGlzIHJlc29sdmVkXG4gKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIC0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5vcGVuID0gZnVuY3Rpb24gc2tsYWRfb3BlbihkYk5hbWUsIG9wdGlvbnMgPSB7dmVyc2lvbjogMX0pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgICAgICAgIHJlamVjdChjcmVhdGVFcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5Db25uUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3BlbihkYk5hbWUsIG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGxldCBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uID0gb3B0aW9ucy5taWdyYXRpb24gfHwge307XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZXZ0Lm9sZFZlcnNpb24gKyAxOyBpIDw9IGV2dC5uZXdWZXJzaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMubWlncmF0aW9uW2ldKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uW2ldLmNhbGwodGhpcywgdGhpcy5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihldnQudGFyZ2V0LmVycm9yKSk7XG5cbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcGVuQ29ublJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IHRoaXMucmVzdWx0O1xuICAgICAgICAgICAgY29uc3Qgb2xkVmVyc2lvbiA9IHBhcnNlSW50KGRhdGFiYXNlLnZlcnNpb24gfHwgMCwgMTApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGFiYXNlLnNldFZlcnNpb24gPT09ICdmdW5jdGlvbicgJiYgb2xkVmVyc2lvbiA8IG9wdGlvbnMudmVyc2lvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVZlclJlcXVlc3QgPSBkYXRhYmFzZS5zZXRWZXJzaW9uKG9wdGlvbnMudmVyc2lvbik7XG5cbiAgICAgICAgICAgICAgICBjaGFuZ2VWZXJSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCA9IG5ldyBFdmVudCgndXBncmFkZW5lZWRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0Lm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0Lm5ld1ZlcnNpb24gPSBvcHRpb25zLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQuY2FsbCh7cmVzdWx0OiBldnQudGFyZ2V0LnNvdXJjZX0sIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHNrbGFkQVBJLm9wZW4oZGJOYW1lLCBvcHRpb25zKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gZXZ0LnRhcmdldC5lcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC53ZWJraXRFcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC5tb3pFcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC5tc0Vycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LmVycm9yLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzdG9yZSBvYmplY3Qgc3RvcmVzIHByb3BlcnRpZXMgaW4gdGhlaXIgb3duIG1hcFxuICAgICAgICAgICAgb2JqU3RvcmVzTWV0YS5zZXQoZGJOYW1lLCBuZXcgTWFwKCkpO1xuXG4gICAgICAgICAgICByZXNvbHZlKE9iamVjdC5jcmVhdGUoc2tsYWRDb25uZWN0aW9uLCB7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2U6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGFiYXNlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcGVuQ29ublJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsIGBEYXRhYmFzZSAke2RiTmFtZX0gaXMgYmxvY2tlZGApKTtcbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBkYXRhYmFzZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYk5hbWVcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqL1xuc2tsYWRBUEkuZGVsZXRlRGF0YWJhc2UgPSBmdW5jdGlvbiBza2xhZF9kZWxldGVEYXRhYmFzZShkYk5hbWUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICAgICAgICAgIHJlamVjdChjcmVhdGVFcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5EYlJlcXVlc3QgPSB3aW5kb3cuaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7XG5cbiAgICAgICAgb3BlbkRiUmVxdWVzdC5vbnN1Y2Nlc3MgPSBvcGVuRGJSZXF1ZXN0Lm9uZXJyb3IgPSBvcGVuRGJSZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gKGV2dC50eXBlID09PSAnYmxvY2tlZCcpXG4gICAgICAgICAgICAgICAgPyBjcmVhdGVFcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCBgRGF0YWJhc2UgJHtkYk5hbWV9IGlzIGJsb2NrZWRgKVxuICAgICAgICAgICAgICAgIDogZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZ0LnR5cGUgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuc2tsYWRBUEkua2V5VmFsdWUgPSBmdW5jdGlvbiBza2xhZF9rZXlWYWx1ZShrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwge1xuICAgICAgICBrZXk6IHt2YWx1ZToga2V5LCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9LFxuICAgICAgICB2YWx1ZToge3ZhbHVlOiB2YWx1ZSwgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlfVxuICAgIH0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgc2tsYWRBUEk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9za2xhZC5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgYXJyMltpXSA9IGFycltpXTsgcmV0dXJuIGFycjI7IH0gZWxzZSB7IHJldHVybiBBcnJheS5mcm9tKGFycik7IH0gfVxuXG5jbGFzcyBLaW5vUHJvbWlzZSBleHRlbmRzIFByb21pc2Uge1xuICAgIHNwcmVhZChvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCkge1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZEludGVybmFsKHJlcykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvbkZ1bGZpbGxlZC5hcHBseSh1bmRlZmluZWQsIF90b0NvbnN1bWFibGVBcnJheShyZXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG9uRnVsZmlsbGVkSW50ZXJuYWwsIG9uUmVqZWN0ZWQpO1xuICAgIH1cbn1cblxuS2lub1Byb21pc2UuYWxsID0gZnVuY3Rpb24gS2lub1Byb21pc2Vfc3RhdGljX2FsbChwcm9taXNlcykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSB8fCB0eXBlb2YgcHJvbWlzZXMgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbC5hcHBseShQcm9taXNlLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgS2lub1Byb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBpc1Byb21pc2VzTGlzdCA9IEFycmF5LmlzQXJyYXkocHJvbWlzZXMpO1xuICAgICAgICBsZXQgcHJvbWlzZXNBcnJheTtcbiAgICAgICAgbGV0IHByb21pc2VzS2V5cztcblxuICAgICAgICBpZiAoaXNQcm9taXNlc0xpc3QpIHtcbiAgICAgICAgICAgIHByb21pc2VzQXJyYXkgPSBwcm9taXNlcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb21pc2VzS2V5cyA9IE9iamVjdC5rZXlzKHByb21pc2VzKTtcbiAgICAgICAgICAgIHByb21pc2VzQXJyYXkgPSBwcm9taXNlc0tleXMubWFwKGtleSA9PiBwcm9taXNlc1trZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzQXJyYXkpLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIC8vIHRyYW5zZm9ybSBvdXRwdXQgaW50byBhbiBvYmplY3RcbiAgICAgICAgICAgIGxldCBvdXRwdXQ7XG5cbiAgICAgICAgICAgIGlmIChpc1Byb21pc2VzTGlzdCkge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlcztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gcmVzLnJlZHVjZSgob3V0cHV0LCBjaHVuaywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0W3Byb21pc2VzS2V5c1tpbmRleF1dID0gY2h1bms7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlKG91dHB1dCk7XG4gICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgfSk7XG59O1xuXG5leHBvcnRzLmRlZmF1bHQgPSBLaW5vUHJvbWlzZTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L2tpbm9wcm9taXNlL2J1aWxkLmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==