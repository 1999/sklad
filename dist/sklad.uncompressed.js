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
	
	var _kinopromise = __webpack_require__(1);
	
	var _kinopromise2 = _interopRequireDefault(_kinopromise);
	
	var _uuid = __webpack_require__(2);
	
	var _uuid2 = _interopRequireDefault(_uuid);
	
	var _error = __webpack_require__(3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
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
	            key = (0, _uuid2.default)();
	        }
	    } else {
	        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
	            return false;
	        }
	
	        // TODO: support dot-separated and array keyPaths
	        if (!autoIncrement && data[keyPath] === undefined) {
	            data[keyPath] = (0, _uuid2.default)();
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	
	                            _kinopromise2.default.all(promises).then(resolve).catch(reject);
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
	                        reject((0, _error.ensureError)(err));
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
	                            abortErr = (0, _error.createError)('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	
	                            _kinopromise2.default.all(promises).then(resolve).catch(reject);
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
	                        reject((0, _error.ensureError)(err));
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
	                            abortErr = (0, _error.createError)('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	                    reject((0, _error.ensureError)(err));
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	                    reject((0, _error.ensureError)(err));
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	
	                        _kinopromise2.default.all(promises).then(resolve).catch(reject);
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
	                    reject((0, _error.ensureError)(err));
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
	                        abortErr = (0, _error.createError)('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
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
	            var err = (0, _error.createError)('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	
	                        _kinopromise2.default.all(promises).then(resolve).catch(reject);
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
	                    reject((0, _error.ensureError)(err));
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
	                        abortErr = (0, _error.createError)('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
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
	            reject((0, _error.createError)('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
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
	            reject((0, _error.ensureError)(evt.target.error));
	
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
	                    reject((0, _error.ensureError)(err));
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
	
	            reject((0, _error.createError)('InvalidStateError', 'Database ' + dbName + ' is blocked'));
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
	            reject((0, _error.createError)('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openDbRequest = window.indexedDB.deleteDatabase(dbName);
	
	        openDbRequest.onsuccess = openDbRequest.onerror = openDbRequest.onblocked = function sklad_deleteDatabase_onFinish(evt) {
	            var err = evt.type === 'blocked' ? (0, _error.createError)('InvalidStateError', 'Database ' + dbName + ' is blocked') : evt.target.error;
	
	            if (err) {
	                reject((0, _error.ensureError)(err));
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

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	/**
	 * Generates UUIDs for objects without keys set
	 * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
	 */
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = uuid;
	function uuid() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	        var r = Math.random() * 16 | 0;
	        var v = c === 'x' ? r : r & 0x3 | 0x8;
	
	        return v.toString(16);
	    });
	}
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.createError = createError;
	exports.ensureError = ensureError;
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

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAyYzI0YjExNDE1MzI0MmZjZmFhMCIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9raW5vcHJvbWlzZS9idWlsZC5qcyIsIndlYnBhY2s6Ly8vLi9saWIvdXVpZC5qcyIsIndlYnBhY2s6Ly8vLi9saWIvZXJyb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2JBOzs7Ozs7OztBQUVBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsS0FBSSxDQUFDLE9BQU8sU0FBWixFQUF1QjtBQUNuQixZQUFPLFNBQVAsR0FBbUIsT0FBTyxZQUFQLElBQXVCLE9BQU8sZUFBOUIsSUFBaUQsT0FBTyxXQUEzRTtBQUNIOztBQUVELEtBQUksQ0FBQyxPQUFPLGNBQVosRUFBNEI7QUFDeEIsWUFBTyxjQUFQLEdBQXdCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxvQkFBbkMsSUFBMkQsT0FBTyxnQkFBMUY7QUFDSDs7QUFFRCxLQUFJLENBQUMsT0FBTyxXQUFaLEVBQXlCO0FBQ3JCLFlBQU8sV0FBUCxHQUFxQixPQUFPLGNBQVAsSUFBeUIsT0FBTyxpQkFBaEMsSUFBcUQsT0FBTyxhQUFqRjtBQUNIOztBQUVELEtBQUksQ0FBQyxPQUFPLFNBQVosRUFBdUI7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RCxZQUFPLFlBQVksSUFBSSxJQUFoQixFQUFzQixJQUFJLE9BQTFCLENBQVA7QUFDSCxFIiwiZmlsZSI6InNrbGFkLnVuY29tcHJlc3NlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInNrbGFkXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcInNrbGFkXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uXG4gKiovIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCAyYzI0YjExNDE1MzI0MmZjZmFhMFxuICoqLyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTYgRG1pdHJ5IFNvcmluIDxpbmZvQHN0YXlwb3NpdGl2ZS5ydT5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS8xOTk5L3NrbGFkXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqXG4gKiBAYXV0aG9yIERtaXRyeSBTb3JpbiA8aW5mb0BzdGF5cG9zaXRpdmUucnU+XG4gKiBAbGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWwgTUlUIExpY2Vuc2VcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgS2lub1Byb21pc2UgZnJvbSAna2lub3Byb21pc2UnO1xuaW1wb3J0IHV1aWQgZnJvbSAnLi91dWlkJztcbmltcG9ydCB7Y3JlYXRlRXJyb3IsIGVuc3VyZUVycm9yfSBmcm9tICcuL2Vycm9yJztcblxuaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgd2luZG93LmluZGV4ZWREQiA9IHdpbmRvdy5tb3pJbmRleGVkREIgfHwgd2luZG93LndlYmtpdEluZGV4ZWREQiB8fCB3aW5kb3cubXNJbmRleGVkREI7XG59XG5cbmlmICghd2luZG93LklEQlRyYW5zYWN0aW9uKSB7XG4gICAgd2luZG93LklEQlRyYW5zYWN0aW9uID0gd2luZG93Lm1veklEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy53ZWJraXRJREJUcmFuc2FjdGlvbiB8fCB3aW5kb3cubXNJREJUcmFuc2FjdGlvbjtcbn1cblxuaWYgKCF3aW5kb3cuSURCS2V5UmFuZ2UpIHtcbiAgICB3aW5kb3cuSURCS2V5UmFuZ2UgPSB3aW5kb3cubW96SURCS2V5UmFuZ2UgfHwgd2luZG93LndlYmtpdElEQktleVJhbmdlIHx8IHdpbmRvdy5tc0lEQktleVJhbmdlO1xufVxuXG5pZiAoIXdpbmRvdy5JREJDdXJzb3IpIHtcbiAgICB3aW5kb3cuSURCQ3Vyc29yID0gd2luZG93Lm1veklEQkN1cnNvciB8fCB3aW5kb3cud2Via2l0SURCQ3Vyc29yIHx8IHdpbmRvdy5tc0lEQkN1cnNvcjtcbn1cblxuY29uc3QgVFJBTlNBQ1RJT05fUkVBRE9OTFkgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9PTkxZIHx8ICdyZWFkb25seSc7XG5jb25zdCBUUkFOU0FDVElPTl9SRUFEV1JJVEUgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9XUklURSB8fCAncmVhZHdyaXRlJztcblxuY29uc3Qgc2tsYWRBUEkgPSB7fTtcbnNrbGFkQVBJLkFTQyA9IHdpbmRvdy5JREJDdXJzb3IuTkVYVCB8fCAnbmV4dCc7XG5za2xhZEFQSS5BU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5ORVhUX05PX0RVUExJQ0FURSB8fCAnbmV4dHVuaXF1ZSc7XG5za2xhZEFQSS5ERVNDID0gd2luZG93LklEQkN1cnNvci5QUkVWIHx8ICdwcmV2JztcbnNrbGFkQVBJLkRFU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5QUkVWX05PX0RVUExJQ0FURSB8fCAncHJldnVuaXF1ZSc7XG5cbi8vIHVuZm9ydHVuYXRlbHkgYGJhYmVsLXBsdWdpbi1hcnJheS1pbmNsdWRlc2AgY2FuJ3QgY29udmVydCBBcnJheS5wcm90b3R5cGUuaW5jbHVkZXNcbi8vIGludG8gQXJyYXkucHJvdG90eXBlLmluZGV4T2Ygd2l0aCBpdHMgY29kZVxuY29uc3QgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xuY29uc3Qgc3VwcG9ydHNPYmpTdG9yZUdldEFsbCA9IHR5cGVvZiBJREJPYmplY3RTdG9yZS5wcm90b3R5cGUuZ2V0QWxsID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBJREJPYmplY3RTdG9yZS5wcm90b3R5cGUuZ2V0QWxsS2V5cyA9PT0gJ2Z1bmN0aW9uJztcbmNvbnN0IG9ialN0b3Jlc01ldGEgPSBuZXcgTWFwKCk7XG5cbi8qKlxuICogQ29tbW9uIGFuY2VzdG9yIGZvciBvYmplY3RzIGNyZWF0ZWQgd2l0aCBza2xhZC5rZXlWYWx1ZSgpIG1ldGhvZFxuICogVXNlZCB0byBkaXN0aW5ndWlzaCBzdGFuZGFyZCBvYmplY3RzIHdpdGggXCJrZXlcIiBhbmQgXCJ2YWx1ZVwiIGZpZWxkcyBmcm9tIHNwZWNpYWwgb25lc1xuICovXG5jb25zdCBza2xhZEtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBDaGVja3MgZGF0YSBiZWZvcmUgc2F2aW5nIGl0IGluIHRoZSBvYmplY3Qgc3RvcmVcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZhbHNlIGlmIHNhdmVkIGRhdGEgdHlwZSBpcyBpbmNvcnJlY3QsIG90aGVyd2lzZSB7QXJyYXl9IG9iamVjdCBzdG9yZSBmdW5jdGlvbiBhcmd1bWVudHNcbiAqL1xuZnVuY3Rpb24gY2hlY2tTYXZlZERhdGEoZGJOYW1lLCBvYmpTdG9yZSwgZGF0YSkge1xuICAgIGNvbnN0IGtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mLmNhbGwoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwgZGF0YSk7XG4gICAgY29uc3QgdmFsdWUgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEudmFsdWUgOiBkYXRhO1xuICAgIGNvbnN0IG9ialN0b3JlTWV0YSA9IG9ialN0b3Jlc01ldGEuZ2V0KGRiTmFtZSkuZ2V0KG9ialN0b3JlLm5hbWUpO1xuICAgIGxldCBrZXkgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEua2V5IDogdW5kZWZpbmVkO1xuXG4gICAgY29uc3Qga2V5UGF0aCA9IG9ialN0b3JlLmtleVBhdGggfHwgb2JqU3RvcmVNZXRhLmtleVBhdGg7XG4gICAgY29uc3QgYXV0b0luY3JlbWVudCA9IG9ialN0b3JlLmF1dG9JbmNyZW1lbnQgfHwgb2JqU3RvcmVNZXRhLmF1dG9JbmNyZW1lbnQ7XG5cbiAgICBpZiAoa2V5UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoIWF1dG9JbmNyZW1lbnQgJiYga2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGtleSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPRE86IHN1cHBvcnQgZG90LXNlcGFyYXRlZCBhbmQgYXJyYXkga2V5UGF0aHNcbiAgICAgICAgaWYgKCFhdXRvSW5jcmVtZW50ICYmIGRhdGFba2V5UGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGF0YVtrZXlQYXRoXSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXkgPyBbdmFsdWUsIGtleV0gOiBbdmFsdWVdO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZGF0YWJhc2UgY29udGFpbnMgYWxsIG5lZWRlZCBzdG9yZXNcbiAqXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ29udGFpbmluZ1N0b3JlcyhvYmpTdG9yZU5hbWVzKSB7XG4gICAgcmV0dXJuIG9ialN0b3JlTmFtZXMuZXZlcnkoZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICByZXR1cm4gKGluZGV4T2YuY2FsbCh0aGlzLmRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMsIHN0b3JlTmFtZSkgIT09IC0xKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuLyoqXG4gKiBhdXRvSW5jcmVtZW50IGlzIGJyb2tlbiBpbiBJRSBmYW1pbHkuIFJ1biB0aGlzIHRyYW5zYWN0aW9uIHRvIGdldCBpdHMgdmFsdWVcbiAqIG9uIGV2ZXJ5IG9iamVjdCBzdG9yZVxuICpcbiAqIEBwYXJhbSB7SURCRGF0YWJhc2V9IGRiXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKlxuICogQHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM1NjgyMTY1L2luZGV4ZWRkYi1pbi1pZTExLWVkZ2Utd2h5LWlzLW9ianN0b3JlLWF1dG9pbmNyZW1lbnQtdW5kZWZpbmVkXG4gKiBAc2VlIGh0dHBzOi8vY29ubmVjdC5taWNyb3NvZnQuY29tL0lFL0ZlZWRiYWNrL0RldGFpbHMvNzcyNzI2XG4gKi9cbmZ1bmN0aW9uIGdldE9ialN0b3Jlc01ldGEoZGIsIG9ialN0b3JlTmFtZXMpIHtcbiAgICBjb25zdCBkYk1ldGEgPSBvYmpTdG9yZXNNZXRhLmdldChkYi5uYW1lKTtcbiAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgIGlmIChkYk1ldGEuaGFzKG9ialN0b3JlTmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gZGIudHJhbnNhY3Rpb24oW29ialN0b3JlTmFtZV0sIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uYWJvcnQgPSByZXNvbHZlO1xuXG4gICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChvYmpTdG9yZS5hdXRvSW5jcmVtZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50OiBvYmpTdG9yZS5hdXRvSW5jcmVtZW50LFxuICAgICAgICAgICAgICAgICAgICBrZXlQYXRoOiBvYmpTdG9yZS5rZXlQYXRoXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBhdXRvSW5jcmVtZW50O1xuXG4gICAgICAgICAgICBpZiAob2JqU3RvcmUua2V5UGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGtleSBwYXRoIGlzIGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgb25seSBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gYnV0IGlmIGtleSBnZW5lcmF0b3IgKGF1dG9JbmNyZW1lbnQpIGlzIG5vdCBkZWZpbmVkIHRoZSBpbnNlcnRlZCBvYmplY3RzXG4gICAgICAgICAgICAgICAgLy8gbXVzdCBjb250YWluIGZpZWxkKHMpIGRlc2NyaWJlZCBpbiBrZXlQYXRoIHZhbHVlIG90aGVyd2lzZSBJREJPYmplY3RTdG9yZS5hZGQgb3AgZmFpbHNcbiAgICAgICAgICAgICAgICAvLyBzbyBpZiB3ZSBydW4gT0RCT2JqZWN0U3RvcmUuYWRkIHdpdGggYW4gZW1wdHkgb2JqZWN0IGFuZCBpdCBmYWlscywgdGhpcyBtZWFucyB0aGF0XG4gICAgICAgICAgICAgICAgLy8gYXV0b0luY3JlbWVudCBwcm9wZXJ0eSB3YXMgZmFsc2UuIE90aGVyd2lzZSAtIHRydWVcbiAgICAgICAgICAgICAgICAvLyBpZiBrZXkgcGF0aCBpcyBhcnJheSBhdXRvSW5jcmVtZW50IHByb3BlcnR5IGNhbid0IGJlIHRydWVcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmpTdG9yZS5rZXlQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmFkZCh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvSW5jcmVtZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gaWYga2V5IHBhdGggaXMgbm90IGRlZmluZWQgaXQncyBwb3NzaWJsZSB0byBpbnNlcnQgYW55IGtpbmQgb2YgZGF0YVxuICAgICAgICAgICAgICAgIC8vIGJ1dCBpZiBrZXkgZ2VuZXJhdG9yIChhdXRvSW5jcmVtZW50KSBpcyBub3QgZGVmaW5lZCB5b3Ugc2hvdWxkIHNldCBpdCBleHBsaWNpdGx5XG4gICAgICAgICAgICAgICAgLy8gc28gaWYgd2UgcnVuIE9EQk9iamVjdFN0b3JlLmFkZCB3aXRoIG9uZSBhcmd1bWVudCBhbmQgaXQgZmFpbHMsIHRoaXMgbWVhbnMgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGF1dG9JbmNyZW1lbnQgcHJvcGVydHkgd2FzIGZhbHNlLiBPdGhlcndpc2UgLSB0cnVlXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuYWRkKCdzb21lIHZhbHVlJyk7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbWV0YSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBkYk1ldGEuc2V0KG9ialN0b3JlTmFtZSwge1xuICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQ6IGF1dG9JbmNyZW1lbnQsXG4gICAgICAgICAgICAgICAga2V5UGF0aDogb2JqU3RvcmUua2V5UGF0aFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGFuZCBhYm9ydCB0cmFuc2FjdGlvbiBzbyB0aGF0IG5ldyByZWNvcmQgaXMgZm9yZ290dGVuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hYm9ydCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBwcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cblxuY29uc3Qgc2tsYWRDb25uZWN0aW9uID0ge1xuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvbmUgcmVjb3JkIGludG8gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZCBvYmplY3Qga2V5XG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgbXVsdGlwbGUgcmVjb3JkcyBpbnRvIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBpbnNlcnRlZCBvYmplY3RzJyBrZXlzXG4gICAgICovXG4gICAgaW5zZXJ0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0T2JqU3RvcmVzTWV0YSh0aGlzLmRhdGFiYXNlLCBvYmpTdG9yZU5hbWVzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSB0aGlzLmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtvYmpTdG9yZU5hbWVdOiBBcnJheS5pc0FycmF5KGRhdGFbb2JqU3RvcmVOYW1lXSkgPyBkYXRhW29ialN0b3JlTmFtZV0gOiBbZGF0YVtvYmpTdG9yZU5hbWVdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLnRoZW4ocmVzID0+IHJlc1tvYmpTdG9yZU5hbWVdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXVswXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbb2JqU3RvcmVOYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZERhdGEgPSBjaGVja1NhdmVkRGF0YSh0aGlzLmRhdGFiYXNlLm5hbWUsIG9ialN0b3JlLCBkYXRhW29ialN0b3JlTmFtZV1baV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBjcmVhdGVFcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCAnWW91IG11c3Qgc3VwcGx5IG9iamVjdHMgdG8gYmUgc2F2ZWQgaW4gdGhlIG9iamVjdCBzdG9yZSB3aXRoIHNldCBrZXlQYXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVxO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXEgPSBvYmpTdG9yZS5hZGQuYXBwbHkob2JqU3RvcmUsIGNoZWNrZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW2ldID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBJbnNlcnQgb3IgdXBkYXRlIG9uZSByZWNvcmQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZC91cGRhdGVkIG9iamVjdCBrZXkgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgb3IgdXBkYXRlIG11bHRpcGxlIHJlY29yZHMgaW4gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0cycga2V5cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB1cHNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRPYmpTdG9yZXNNZXRhKHRoaXMuZGF0YWJhc2UsIG9ialN0b3JlTmFtZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMudXBzZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29ialN0b3JlTmFtZV06IEFycmF5LmlzQXJyYXkoZGF0YVtvYmpTdG9yZU5hbWVdKSA/IGRhdGFbb2JqU3RvcmVOYW1lXSA6IFtkYXRhW29ialN0b3JlTmFtZV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXMgPT4gcmVzW29ialN0b3JlTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKHRoaXMuZGF0YWJhc2UubmFtZSwgb2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLnB1dC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIERlbGV0ZSBvbmUgcmVjb3JkIGZyb20gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge01peGVkfSBrZXlcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqXG4gICAgICogMikgRGVsZXRlIG11bHRpcGxlIHJlY29yZHMgZnJvbSB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiBBVFRFTlRJT046IHlvdSBjYW4gcGFzcyBvbmx5IFZBTElEIEtFWVMgT1IgS0VZIFJBTkdFUyB0byBkZWxldGUgcmVjb3Jkc1xuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLXZhbGlkLWtleVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLWtleS1yYW5nZVxuICAgICAqL1xuICAgIGRlbGV0ZTogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2RlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBvYmpTdG9yZU5hbWVzLm1hcChvYmpTdG9yZU5hbWUgPT4gdGhpcy5kZWxldGUob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZGF0YVtvYmpTdG9yZU5hbWVdLmZvckVhY2gocmVjb3JkS2V5ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZGVsZXRlKHJlY29yZEtleSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBvYmplY3Qgc3RvcmUocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBvYmpTdG9yZU5hbWVzIGFycmF5IG9mIG9iamVjdCBzdG9yZXMgb3IgYSBzaW5nbGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IGVyclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXIob2JqU3RvcmVOYW1lcykge1xuICAgICAgICBvYmpTdG9yZU5hbWVzID0gQXJyYXkuaXNBcnJheShvYmpTdG9yZU5hbWVzKSA/IG9ialN0b3JlTmFtZXMgOiBbb2JqU3RvcmVOYW1lc107XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIC8vIFNhZmFyaTkgY2FuJ3QgcnVuIG11bHRpLW9iamVjdHN0b3JlIHRyYW5zYWN0aW9uc1xuICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0gb2JqU3RvcmVOYW1lcy5tYXAob2JqU3RvcmVOYW1lID0+IHRoaXMuY2xlYXIoW29ialN0b3JlTmFtZV0pKTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gcmVzb2x2ZSgpKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXJfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBHZXQgb2JqZWN0cyBmcm9tIG9uZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCBrZXlzICdpbmRleCcsICdyYW5nZScsICdvZmZzZXQnLCAnbGltaXQnIGFuZCAnZGlyZWN0aW9uJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge0FycmF5fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEdldCBvYmplY3RzIGZyb20gbXVsdGlwbGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZ2V0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGFyZ3VtZW50c1swXSA9PT0gJ29iamVjdCcpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IHt9O1xuICAgICAgICBsZXQgZGF0YSwgYWJvcnRFcnI7XG5cbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG9ialN0b3JlTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuZ2V0KG9ialN0b3JlTmFtZSwgZGF0YVtvYmpTdG9yZU5hbWVdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW29ialN0b3JlTmFtZV0gPSBwcm9taXNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBLaW5vUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnMuZGlyZWN0aW9uIHx8IHNrbGFkQVBJLkFTQztcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGxldCB1c2VHZXRBbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgaXRlcmF0ZVJlcXVlc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNPYmpTdG9yZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBnZXRBbGwgZG9lc24ndCB3b3JrIGZvciBpbmRleCByYW5nZXMgKyBpdCBkb2Vzbid0IHN1cHBvcnQgc3BlY2lhbCBkaXJlY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lEQk9iamVjdFN0b3JlL2dldEFsbFxuICAgICAgICAgICAgICAgICAgICB1c2VHZXRBbGwgPSBPYmplY3Qua2V5cyhvcHRpb25zKS5ldmVyeShrZXkgPT4gKGtleSAhPT0gJ2luZGV4JyAmJiBrZXkgIT09ICdkaXJlY3Rpb24nKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVzZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBicm93c2VyIHN1cHBvcnRzIGdldEFsbC9nZXRBbGxLZXlzIG1ldGhvZHMgaXQgY291bGQgYmUgZmFzdGVyIHRvIHJ1biB0aGVzZSBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGdldCBhbGwgcmVjb3JkcyBpZiB0aGVyZSdzIG5vIGBpbmRleGAgb3IgYGRpcmVjdGlvbmAgb3B0aW9ucyBzZXRcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5mb3J0dW5hdGVseSBnZXRBbGwgZG9lc24ndCBleHBvc2UgcmVzdWx0IGtleXMgc28gd2UgaGF2ZSB0byBydW4gYm90aCB0aGVzZSBtZXRob2RzXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIGdldCBhbGwga2V5cyBhbmQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIEFueXdheSBpdCBzZWVtcyBsaWtlIDIgZ2V0QWxsKiBvcHMgYXJlIGZhc3RlciBpbiBtb2Rlcm4gYnJvd3NlcnMgdGhhbiB0aGF0IG9uZVxuICAgICAgICAgICAgICAgICAgICAvLyB3b3JraW5nIHdpdGggVURCQ3Vyc29yXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0lEQk9iamVjdFN0b3JlL2dldEFsbFxuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxLZXlzXG4gICAgICAgICAgICAgICAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vaWRiLWlkYmN1cnNvci12cy1pZGJvYmplY3RzdG9yZS1nZXRhbGwtb3BzLzNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IFtyYW5nZV07XG4gICAgICAgICAgICAgICAgICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2gob3B0aW9ucy5saW1pdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0gKz0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGFsbCB2YWx1ZXMgcmVxdWVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZ2V0QWxsKC4uLmFyZ3MpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRJbmRleCA9IGluZGV4IC0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IGFsbCBrZXlzIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbEtleXMoLi4uYXJncykub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleXMgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCBvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdEluZGV4ID0gaW5kZXggLSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1bcmVzdWx0SW5kZXhdLmtleSA9IGtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIDIgc2VwYXJhdGUgSURCUmVxdWVzdHMgcnVubmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc28gdGhlcmUncyBubyBuZWVkIHRvIGJpbmQgbGlzdGVuZXIgdG8gc3VjY2VzcyBldmVudCBvZiBhbnkgb2YgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JQb3NpdGlvbk1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0ICYmICFjdXJzb3JQb3NpdGlvbk1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JQb3NpdGlvbk1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG9wdGlvbnMub2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPT09IHJlc3VsdFtvYmpTdG9yZU5hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIENvdW50IG9iamVjdHMgaW4gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JyBvci9hbmQgJ3JhbmdlJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge051bWJlcn0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgQ291bnQgb2JqZWN0cyBpbiBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgY291bnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG4gICAgICAgIGxldCBkYXRhO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICBsZXQgY291bnRSZXF1ZXN0O1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5jb3VudChvYmpTdG9yZU5hbWUsIGRhdGFbb2JqU3RvcmVOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tvYmpTdG9yZU5hbWVdID0gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2VBcmdzID0gKG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UpID8gW29wdGlvbnMucmFuZ2VdIDogW107XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IGluZGV4LmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IG9ialN0b3JlLmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkNvbm5SZXF1ZXN0ID0gd2luZG93LmluZGV4ZWREQi5vcGVuKGRiTmFtZSwgb3B0aW9ucy52ZXJzaW9uKTtcbiAgICAgICAgbGV0IGlzUmVzb2x2ZWRPclJlamVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb24gPSBvcHRpb25zLm1pZ3JhdGlvbiB8fCB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBldnQub2xkVmVyc2lvbiArIDE7IGkgPD0gZXZ0Lm5ld1ZlcnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5taWdyYXRpb25baV0pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb25baV0uY2FsbCh0aGlzLCB0aGlzLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGV2dC50YXJnZXQuZXJyb3IpKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWZXJzaW9uID0gcGFyc2VJbnQoZGF0YWJhc2UudmVyc2lvbiB8fCAwLCAxMCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YWJhc2Uuc2V0VmVyc2lvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBvbGRWZXJzaW9uIDwgb3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlVmVyUmVxdWVzdCA9IGRhdGFiYXNlLnNldFZlcnNpb24ob3B0aW9ucy52ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0ID0gbmV3IEV2ZW50KCd1cGdyYWRlbmVlZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQubmV3VmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZC5jYWxsKHtyZXN1bHQ6IGV2dC50YXJnZXQuc291cmNlfSwgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgc2tsYWRBUEkub3BlbihkYk5hbWUsIG9wdGlvbnMpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBldnQudGFyZ2V0LmVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LndlYmtpdEVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1vekVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1zRXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQuZXJyb3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0b3JlIG9iamVjdCBzdG9yZXMgcHJvcGVydGllcyBpbiB0aGVpciBvd24gbWFwXG4gICAgICAgICAgICBvYmpTdG9yZXNNZXRhLnNldChkYk5hbWUsIG5ldyBNYXAoKSk7XG5cbiAgICAgICAgICAgIHJlc29sdmUoT2JqZWN0LmNyZWF0ZShza2xhZENvbm5lY3Rpb24sIHtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZToge1xuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YWJhc2UsXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICByZWplY3QoY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYCkpO1xuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZVxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5kZWxldGVEYXRhYmFzZSA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlKGRiTmFtZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkRiUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTtcblxuICAgICAgICBvcGVuRGJSZXF1ZXN0Lm9uc3VjY2VzcyA9IG9wZW5EYlJlcXVlc3Qub25lcnJvciA9IG9wZW5EYlJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gc2tsYWRfZGVsZXRlRGF0YWJhc2Vfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSAoZXZ0LnR5cGUgPT09ICdibG9ja2VkJylcbiAgICAgICAgICAgICAgICA/IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsIGBEYXRhYmFzZSAke2RiTmFtZX0gaXMgYmxvY2tlZGApXG4gICAgICAgICAgICAgICAgOiBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldnQudHlwZSAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuXG5za2xhZEFQSS5rZXlWYWx1ZSA9IGZ1bmN0aW9uIHNrbGFkX2tleVZhbHVlKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShza2xhZEtleVZhbHVlQ29udGFpbmVyLCB7XG4gICAgICAgIGtleToge3ZhbHVlOiBrZXksIGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgIHZhbHVlOiB7dmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9XG4gICAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBza2xhZEFQSTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vbGliL3NrbGFkLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IEFycmF5KGFyci5sZW5ndGgpOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBhcnIyW2ldID0gYXJyW2ldOyByZXR1cm4gYXJyMjsgfSBlbHNlIHsgcmV0dXJuIEFycmF5LmZyb20oYXJyKTsgfSB9XG5cbmNsYXNzIEtpbm9Qcm9taXNlIGV4dGVuZHMgUHJvbWlzZSB7XG4gICAgc3ByZWFkKG9uRnVsZmlsbGVkLCBvblJlamVjdGVkKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkSW50ZXJuYWwocmVzKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShyZXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9uRnVsZmlsbGVkLmFwcGx5KHVuZGVmaW5lZCwgX3RvQ29uc3VtYWJsZUFycmF5KHJlcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLnRoZW4ob25GdWxmaWxsZWRJbnRlcm5hbCwgb25SZWplY3RlZCk7XG4gICAgfVxufVxuXG5LaW5vUHJvbWlzZS5hbGwgPSBmdW5jdGlvbiBLaW5vUHJvbWlzZV9zdGF0aWNfYWxsKHByb21pc2VzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxIHx8IHR5cGVvZiBwcm9taXNlcyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsLmFwcGx5KFByb21pc2UsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBLaW5vUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGlzUHJvbWlzZXNMaXN0ID0gQXJyYXkuaXNBcnJheShwcm9taXNlcyk7XG4gICAgICAgIGxldCBwcm9taXNlc0FycmF5O1xuICAgICAgICBsZXQgcHJvbWlzZXNLZXlzO1xuXG4gICAgICAgIGlmIChpc1Byb21pc2VzTGlzdCkge1xuICAgICAgICAgICAgcHJvbWlzZXNBcnJheSA9IHByb21pc2VzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZXNLZXlzID0gT2JqZWN0LmtleXMocHJvbWlzZXMpO1xuICAgICAgICAgICAgcHJvbWlzZXNBcnJheSA9IHByb21pc2VzS2V5cy5tYXAoa2V5ID0+IHByb21pc2VzW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXNBcnJheSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgLy8gdHJhbnNmb3JtIG91dHB1dCBpbnRvIGFuIG9iamVjdFxuICAgICAgICAgICAgbGV0IG91dHB1dDtcblxuICAgICAgICAgICAgaWYgKGlzUHJvbWlzZXNMaXN0KSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ID0gcmVzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZXMucmVkdWNlKChvdXRwdXQsIGNodW5rLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRbcHJvbWlzZXNLZXlzW2luZGV4XV0gPSBjaHVuaztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc29sdmUob3V0cHV0KTtcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcbiAgICB9KTtcbn07XG5cbmV4cG9ydHMuZGVmYXVsdCA9IEtpbm9Qcm9taXNlO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34va2lub3Byb21pc2UvYnVpbGQuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogR2VuZXJhdGVzIFVVSURzIGZvciBvYmplY3RzIHdpdGhvdXQga2V5cyBzZXRcbiAqIEBsaW5rIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2hvdy10by1jcmVhdGUtYS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdC8yMTE3NTIzIzIxMTc1MjNcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdXVpZCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgICAgICBjb25zdCB2ID0gKGMgPT09ICd4JykgPyByIDogKHImMHgzfDB4OCk7XG5cbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIvdXVpZC5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKG5hbWUsIG1lc3NhZ2UpIHtcbiAgICBjb25zdCBlcnJPYmogPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyT2JqLm5hbWUgPSBuYW1lO1xuXG4gICAgcmV0dXJuIGVyck9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZUVycm9yKGVycikge1xuICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICByZXR1cm4gZXJyO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVFcnJvcihlcnIubmFtZSwgZXJyLm1lc3NhZ2UpO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIvZXJyb3IuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9