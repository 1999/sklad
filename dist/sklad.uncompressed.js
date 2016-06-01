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
	
	var _env = __webpack_require__(4);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var skladAPI = {};
	skladAPI.ASC = _env.SORT_ASC;
	skladAPI.ASC_UNIQUE = _env.SORT_ASC_UNIQUE;
	skladAPI.DESC = _env.SORT_DESC;
	skladAPI.DESC_UNIQUE = _env.SORT_DESC_UNIQUE;
	
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
	            var transaction = db.transaction([objStoreName], _env.TRANSACTION_READWRITE);
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
	                    transaction = _this.database.transaction(objStoreNames, _env.TRANSACTION_READWRITE);
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
	                    transaction = _this2.database.transaction(objStoreNames, _env.TRANSACTION_READWRITE);
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
	                transaction = _this3.database.transaction(objStoreNames, _env.TRANSACTION_READWRITE);
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
	                transaction = _this4.database.transaction(objStoreNames, _env.TRANSACTION_READWRITE);
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
	                transaction = _this5.database.transaction(objStoreNames, _env.TRANSACTION_READONLY);
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
	                var range = options.range instanceof _env.IDBKeyRangeRef ? options.range : null;
	
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
	                transaction = _this6.database.transaction(objStoreNames, _env.TRANSACTION_READONLY);
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
	                var rangeArgs = options.range instanceof _env.IDBKeyRangeRef ? [options.range] : [];
	
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
	        if (!_env.indexedDbRef) {
	            reject((0, _error.createError)('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openConnRequest = _env.indexedDbRef.open(dbName, options.version);
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
	        if (!_env.indexedDbRef) {
	            reject((0, _error.createError)('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openDbRequest = _env.indexedDbRef.deleteDatabase(dbName);
	
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

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	// service workers don't have access to window
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	var isBrowserUI = typeof window !== 'undefined';
	
	var sqrt = exports.sqrt = Math.sqrt;
	var indexedDbRef = exports.indexedDbRef = isBrowserUI ? window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB : indexedDB;
	
	var IDBKeyRangeRef = exports.IDBKeyRangeRef = isBrowserUI ? window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange : IDBKeyRange;
	
	var TRANSACTION_READONLY = exports.TRANSACTION_READONLY = isBrowserUI ? window.IDBTransaction.READ_ONLY || 'readonly' : 'readonly';
	
	var TRANSACTION_READWRITE = exports.TRANSACTION_READWRITE = isBrowserUI ? window.IDBTransaction.READ_WRITE || 'readwrite' : 'readwrite';
	
	var SORT_ASC = exports.SORT_ASC = isBrowserUI ? window.IDBCursor.NEXT || 'next' : 'next';
	
	var SORT_ASC_UNIQUE = exports.SORT_ASC_UNIQUE = isBrowserUI ? globalNs.IDBCursor.NEXT_NO_DUPLICATE || 'nextunique' : 'nextunique';
	
	var SORT_DESC = exports.SORT_DESC = isBrowserUI ? globalNs.IDBCursor.PREV || 'prev' : 'prev';
	
	var SORT_DESC_UNIQUE = exports.SORT_DESC_UNIQUE = isBrowserUI ? globalNs.IDBCursor.PREV_NO_DUPLICATE || 'prevunique' : 'prevunique';

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA2OGRmNTMzNjQxYmY0NTllMjA2MSIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9raW5vcHJvbWlzZS9idWlsZC5qcyIsIndlYnBhY2s6Ly8vLi9saWIvdXVpZC5qcyIsIndlYnBhY2s6Ly8vLi9saWIvZXJyb3IuanMiLCJ3ZWJwYWNrOi8vLy4vbGliL2Vudi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTztBQ1ZBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYkE7Ozs7Ozs7O0FBRUE7Ozs7QUFDQTs7OztBQUNBOztBQUVBOzs7Ozs7QUFXQSxLQUFNLFdBQVcsRUFBakI7QUFDQSxVQUFTLEdBQVQ7QUFDQSxVQUFTLFVBQVQ7QUFDQSxVQUFTLElBQVQ7QUFDQSxVQUFTLFdBQVQ7Ozs7QUFJQSxLQUFNLFVBQVUsTUFBTSxTQUFOLENBQWdCLE9BQWhDO0FBQ0EsS0FBTSx5QkFBeUIsT0FBTyxlQUFlLFNBQWYsQ0FBeUIsTUFBaEMsS0FBMkMsVUFBM0MsSUFBeUQsT0FBTyxlQUFlLFNBQWYsQ0FBeUIsVUFBaEMsS0FBK0MsVUFBdkk7QUFDQSxLQUFNLGdCQUFnQixJQUFJLEdBQUosRUFBdEI7Ozs7OztBQU1BLEtBQU0seUJBQXlCLE9BQU8sTUFBUCxDQUFjLElBQWQsQ0FBL0I7Ozs7OztBQU1B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a1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgNjhkZjUzMzY0MWJmNDU5ZTIwNjFcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE2IERtaXRyeSBTb3JpbiA8aW5mb0BzdGF5cG9zaXRpdmUucnU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vMTk5OS9za2xhZFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogQGF1dGhvciBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogQGxpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sIE1JVCBMaWNlbnNlXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IEtpbm9Qcm9taXNlIGZyb20gJ2tpbm9wcm9taXNlJztcbmltcG9ydCB1dWlkIGZyb20gJy4vdXVpZCc7XG5pbXBvcnQge2NyZWF0ZUVycm9yLCBlbnN1cmVFcnJvcn0gZnJvbSAnLi9lcnJvcic7XG5cbmltcG9ydCB7XG4gICAgaW5kZXhlZERiUmVmLFxuICAgIElEQktleVJhbmdlUmVmLFxuICAgIFRSQU5TQUNUSU9OX1JFQURPTkxZLFxuICAgIFRSQU5TQUNUSU9OX1JFQURXUklURSxcbiAgICBTT1JUX0FTQyxcbiAgICBTT1JUX0FTQ19VTklRVUUsXG4gICAgU09SVF9ERVNDLFxuICAgIFNPUlRfREVTQ19VTklRVUVcbn0gZnJvbSAnLi9lbnYnO1xuXG5jb25zdCBza2xhZEFQSSA9IHt9O1xuc2tsYWRBUEkuQVNDID0gU09SVF9BU0M7XG5za2xhZEFQSS5BU0NfVU5JUVVFID0gU09SVF9BU0NfVU5JUVVFO1xuc2tsYWRBUEkuREVTQyA9IFNPUlRfREVTQztcbnNrbGFkQVBJLkRFU0NfVU5JUVVFID0gU09SVF9ERVNDX1VOSVFVRTtcblxuLy8gdW5mb3J0dW5hdGVseSBgYmFiZWwtcGx1Z2luLWFycmF5LWluY2x1ZGVzYCBjYW4ndCBjb252ZXJ0IEFycmF5LnByb3RvdHlwZS5pbmNsdWRlc1xuLy8gaW50byBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB3aXRoIGl0cyBjb2RlXG5jb25zdCBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5jb25zdCBzdXBwb3J0c09ialN0b3JlR2V0QWxsID0gdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGxLZXlzID09PSAnZnVuY3Rpb24nO1xuY29uc3Qgb2JqU3RvcmVzTWV0YSA9IG5ldyBNYXAoKTtcblxuLyoqXG4gKiBDb21tb24gYW5jZXN0b3IgZm9yIG9iamVjdHMgY3JlYXRlZCB3aXRoIHNrbGFkLmtleVZhbHVlKCkgbWV0aG9kXG4gKiBVc2VkIHRvIGRpc3Rpbmd1aXNoIHN0YW5kYXJkIG9iamVjdHMgd2l0aCBcImtleVwiIGFuZCBcInZhbHVlXCIgZmllbGRzIGZyb20gc3BlY2lhbCBvbmVzXG4gKi9cbmNvbnN0IHNrbGFkS2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4vKipcbiAqIENoZWNrcyBkYXRhIGJlZm9yZSBzYXZpbmcgaXQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICogQHJldHVybiB7Qm9vbGVhbn0gZmFsc2UgaWYgc2F2ZWQgZGF0YSB0eXBlIGlzIGluY29ycmVjdCwgb3RoZXJ3aXNlIHtBcnJheX0gb2JqZWN0IHN0b3JlIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICovXG5mdW5jdGlvbiBjaGVja1NhdmVkRGF0YShkYk5hbWUsIG9ialN0b3JlLCBkYXRhKSB7XG4gICAgY29uc3Qga2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YuY2FsbChza2xhZEtleVZhbHVlQ29udGFpbmVyLCBkYXRhKTtcbiAgICBjb25zdCB2YWx1ZSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS52YWx1ZSA6IGRhdGE7XG4gICAgY29uc3Qgb2JqU3RvcmVNZXRhID0gb2JqU3RvcmVzTWV0YS5nZXQoZGJOYW1lKS5nZXQob2JqU3RvcmUubmFtZSk7XG4gICAgbGV0IGtleSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS5rZXkgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBrZXlQYXRoID0gb2JqU3RvcmUua2V5UGF0aCB8fCBvYmpTdG9yZU1ldGEua2V5UGF0aDtcbiAgICBjb25zdCBhdXRvSW5jcmVtZW50ID0gb2JqU3RvcmUuYXV0b0luY3JlbWVudCB8fCBvYmpTdG9yZU1ldGEuYXV0b0luY3JlbWVudDtcblxuICAgIGlmIChrZXlQYXRoID09PSBudWxsKSB7XG4gICAgICAgIGlmICghYXV0b0luY3JlbWVudCAmJiBrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAga2V5ID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogc3VwcG9ydCBkb3Qtc2VwYXJhdGVkIGFuZCBhcnJheSBrZXlQYXRoc1xuICAgICAgICBpZiAoIWF1dG9JbmNyZW1lbnQgJiYgZGF0YVtrZXlQYXRoXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkYXRhW2tleVBhdGhdID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleSA/IFt2YWx1ZSwga2V5XSA6IFt2YWx1ZV07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBkYXRhYmFzZSBjb250YWlucyBhbGwgbmVlZGVkIHN0b3Jlc1xuICpcbiAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPn0gb2JqU3RvcmVOYW1lc1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDb250YWluaW5nU3RvcmVzKG9ialN0b3JlTmFtZXMpIHtcbiAgICByZXR1cm4gb2JqU3RvcmVOYW1lcy5ldmVyeShmdW5jdGlvbiAoc3RvcmVOYW1lKSB7XG4gICAgICAgIHJldHVybiAoaW5kZXhPZi5jYWxsKHRoaXMuZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcywgc3RvcmVOYW1lKSAhPT0gLTEpO1xuICAgIH0sIHRoaXMpO1xufVxuXG4vKipcbiAqIGF1dG9JbmNyZW1lbnQgaXMgYnJva2VuIGluIElFIGZhbWlseS4gUnVuIHRoaXMgdHJhbnNhY3Rpb24gdG8gZ2V0IGl0cyB2YWx1ZVxuICogb24gZXZlcnkgb2JqZWN0IHN0b3JlXG4gKlxuICogQHBhcmFtIHtJREJEYXRhYmFzZX0gZGJcbiAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPn0gb2JqU3RvcmVOYW1lc1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqXG4gKiBAc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzU2ODIxNjUvaW5kZXhlZGRiLWluLWllMTEtZWRnZS13aHktaXMtb2Jqc3RvcmUtYXV0b2luY3JlbWVudC11bmRlZmluZWRcbiAqIEBzZWUgaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvRmVlZGJhY2svRGV0YWlscy83NzI3MjZcbiAqL1xuZnVuY3Rpb24gZ2V0T2JqU3RvcmVzTWV0YShkYiwgb2JqU3RvcmVOYW1lcykge1xuICAgIGNvbnN0IGRiTWV0YSA9IG9ialN0b3Jlc01ldGEuZ2V0KGRiLm5hbWUpO1xuICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgaWYgKGRiTWV0YS5oYXMob2JqU3RvcmVOYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBkYi50cmFuc2FjdGlvbihbb2JqU3RvcmVOYW1lXSwgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSByZXNvbHZlO1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25hYm9ydCA9IHJlc29sdmU7XG5cbiAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKG9ialN0b3JlLmF1dG9JbmNyZW1lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGRiTWV0YS5zZXQob2JqU3RvcmVOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQ6IG9ialN0b3JlLmF1dG9JbmNyZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgIGtleVBhdGg6IG9ialN0b3JlLmtleVBhdGhcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGF1dG9JbmNyZW1lbnQ7XG5cbiAgICAgICAgICAgIGlmIChvYmpTdG9yZS5rZXlQYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYga2V5IHBhdGggaXMgZGVmaW5lZCBpdCdzIHBvc3NpYmxlIHRvIGluc2VydCBvbmx5IG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyBidXQgaWYga2V5IGdlbmVyYXRvciAoYXV0b0luY3JlbWVudCkgaXMgbm90IGRlZmluZWQgdGhlIGluc2VydGVkIG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyBtdXN0IGNvbnRhaW4gZmllbGQocykgZGVzY3JpYmVkIGluIGtleVBhdGggdmFsdWUgb3RoZXJ3aXNlIElEQk9iamVjdFN0b3JlLmFkZCBvcCBmYWlsc1xuICAgICAgICAgICAgICAgIC8vIHNvIGlmIHdlIHJ1biBPREJPYmplY3RTdG9yZS5hZGQgd2l0aCBhbiBlbXB0eSBvYmplY3QgYW5kIGl0IGZhaWxzLCB0aGlzIG1lYW5zIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBhdXRvSW5jcmVtZW50IHByb3BlcnR5IHdhcyBmYWxzZS4gT3RoZXJ3aXNlIC0gdHJ1ZVxuICAgICAgICAgICAgICAgIC8vIGlmIGtleSBwYXRoIGlzIGFycmF5IGF1dG9JbmNyZW1lbnQgcHJvcGVydHkgY2FuJ3QgYmUgdHJ1ZVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9ialN0b3JlLmtleVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuYWRkKHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9JbmNyZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBrZXkgcGF0aCBpcyBub3QgZGVmaW5lZCBpdCdzIHBvc3NpYmxlIHRvIGluc2VydCBhbnkga2luZCBvZiBkYXRhXG4gICAgICAgICAgICAgICAgLy8gYnV0IGlmIGtleSBnZW5lcmF0b3IgKGF1dG9JbmNyZW1lbnQpIGlzIG5vdCBkZWZpbmVkIHlvdSBzaG91bGQgc2V0IGl0IGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgICAvLyBzbyBpZiB3ZSBydW4gT0RCT2JqZWN0U3RvcmUuYWRkIHdpdGggb25lIGFyZ3VtZW50IGFuZCBpdCBmYWlscywgdGhpcyBtZWFucyB0aGF0XG4gICAgICAgICAgICAgICAgLy8gYXV0b0luY3JlbWVudCBwcm9wZXJ0eSB3YXMgZmFsc2UuIE90aGVyd2lzZSAtIHRydWVcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5hZGQoJ3NvbWUgdmFsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc2F2ZSBtZXRhIHByb3BlcnRpZXNcbiAgICAgICAgICAgIGRiTWV0YS5zZXQob2JqU3RvcmVOYW1lLCB7XG4gICAgICAgICAgICAgICAgYXV0b0luY3JlbWVudDogYXV0b0luY3JlbWVudCxcbiAgICAgICAgICAgICAgICBrZXlQYXRoOiBvYmpTdG9yZS5rZXlQYXRoXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gYW5kIGFib3J0IHRyYW5zYWN0aW9uIHNvIHRoYXQgbmV3IHJlY29yZCBpcyBmb3Jnb3R0ZW5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLmFib3J0KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHByb21pc2VzLnB1c2gocHJvbWlzZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuXG5jb25zdCBza2xhZENvbm5lY3Rpb24gPSB7XG4gICAgLyoqXG4gICAgICogMSkgSW5zZXJ0IG9uZSByZWNvcmQgaW50byB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkIG9iamVjdCBrZXlcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBtdWx0aXBsZSByZWNvcmRzIGludG8gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkIG9iamVjdHMnIGtleXNcbiAgICAgKi9cbiAgICBpbnNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBnZXRPYmpTdG9yZXNNZXRhKHRoaXMuZGF0YWJhc2UsIG9ialN0b3JlTmFtZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdHJhbnNhY3Rpb247XG4gICAgICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAgICAgLy8gZGl2aWRlIG9uZSB0cmFuc2FjdGlvbiBpbnRvIG1hbnkgd2l0aCBvbmUgb2JqZWN0IHN0b3JlIHRvIGZpeCB0aGlzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW29ialN0b3JlTmFtZV06IEFycmF5LmlzQXJyYXkoZGF0YVtvYmpTdG9yZU5hbWVdKSA/IGRhdGFbb2JqU3RvcmVOYW1lXSA6IFtkYXRhW29ialN0b3JlTmFtZV1dXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkudGhlbihyZXMgPT4gcmVzW29ialN0b3JlTmFtZV0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgS2lub1Byb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKHRoaXMuZGF0YWJhc2UubmFtZSwgb2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLmFkZC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvciB1cGRhdGUgb25lIHJlY29yZCBpbiB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0IGtleSBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBvciB1cGRhdGUgbXVsdGlwbGUgcmVjb3JkcyBpbiB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gaW5zZXJ0ZWQvdXBkYXRlZCBvYmplY3RzJyBrZXlzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHVwc2VydDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdldE9ialN0b3Jlc01ldGEodGhpcy5kYXRhYmFzZSwgb2JqU3RvcmVOYW1lcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy51cHNlcnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbb2JqU3RvcmVOYW1lXTogQXJyYXkuaXNBcnJheShkYXRhW29ialN0b3JlTmFtZV0pID8gZGF0YVtvYmpTdG9yZU5hbWVdIDogW2RhdGFbb2JqU3RvcmVOYW1lXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS50aGVuKHJlcyA9PiByZXNbb2JqU3RvcmVOYW1lXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tvYmpTdG9yZU5hbWVdID0gcHJvbWlzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBLaW5vUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4ocmVzb2x2ZSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV1bMF0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhW29ialN0b3JlTmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWREYXRhID0gY2hlY2tTYXZlZERhdGEodGhpcy5kYXRhYmFzZS5uYW1lLCBvYmpTdG9yZSwgZGF0YVtvYmpTdG9yZU5hbWVdW2ldKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2VkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgJ1lvdSBtdXN0IHN1cHBseSBvYmplY3RzIHRvIGJlIHNhdmVkIGluIHRoZSBvYmplY3Qgc3RvcmUgd2l0aCBzZXQga2V5UGF0aCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxID0gb2JqU3RvcmUucHV0LmFwcGx5KG9ialN0b3JlLCBjaGVja2VkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtpXSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgRGVsZXRlIG9uZSByZWNvcmQgZnJvbSB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGtleVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiAyKSBEZWxldGUgbXVsdGlwbGUgcmVjb3JkcyBmcm9tIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKlxuICAgICAqIEFUVEVOVElPTjogeW91IGNhbiBwYXNzIG9ubHkgVkFMSUQgS0VZUyBPUiBLRVkgUkFOR0VTIHRvIGRlbGV0ZSByZWNvcmRzXG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4tdmFsaWQta2V5XG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4ta2V5LXJhbmdlXG4gICAgICovXG4gICAgZGVsZXRlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlKCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IG9ialN0b3JlTmFtZXMubWFwKG9ialN0b3JlTmFtZSA9PiB0aGlzLmRlbGV0ZShvYmpTdG9yZU5hbWUsIGRhdGFbb2JqU3RvcmVOYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9kZWxldGVfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBkYXRhW29ialN0b3JlTmFtZV0uZm9yRWFjaChyZWNvcmRLZXkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWJvcnRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5kZWxldGUocmVjb3JkS2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIG9iamVjdCBzdG9yZShzKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheXxTdHJpbmd9IG9ialN0b3JlTmFtZXMgYXJyYXkgb2Ygb2JqZWN0IHN0b3JlcyBvciBhIHNpbmdsZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gZXJyXG4gICAgICovXG4gICAgY2xlYXI6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcihvYmpTdG9yZU5hbWVzKSB7XG4gICAgICAgIG9ialN0b3JlTmFtZXMgPSBBcnJheS5pc0FycmF5KG9ialN0b3JlTmFtZXMpID8gb2JqU3RvcmVOYW1lcyA6IFtvYmpTdG9yZU5hbWVzXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGxldCB0cmFuc2FjdGlvbjtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGlmIChleC5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBvYmpTdG9yZU5hbWVzLm1hcChvYmpTdG9yZU5hbWUgPT4gdGhpcy5jbGVhcihbb2JqU3RvcmVOYW1lXSkpO1xuICAgICAgICAgICAgICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiByZXNvbHZlKCkpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGV4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcl9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJvcnRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEdldCBvYmplY3RzIGZyb20gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JywgJ3JhbmdlJywgJ29mZnNldCcsICdsaW1pdCcgYW5kICdkaXJlY3Rpb24nXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7QXJyYXl9IHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgR2V0IG9iamVjdHMgZnJvbSBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9nZXQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0Jyk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IGNyZWF0ZUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBkYXRhLCBhYm9ydEVycjtcblxuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAob2JqU3RvcmVOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmk5IGNhbid0IHJ1biBtdWx0aS1vYmplY3RzdG9yZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICAgIC8vIGRpdmlkZSBvbmUgdHJhbnNhY3Rpb24gaW50byBtYW55IHdpdGggb25lIG9iamVjdCBzdG9yZSB0byBmaXggdGhpc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXgubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2VzID0ge307XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmVOYW1lcy5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5nZXQob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZ2V0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucy5kaXJlY3Rpb24gfHwgc2tsYWRBUEkuQVNDO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gb3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIElEQktleVJhbmdlUmVmID8gb3B0aW9ucy5yYW5nZSA6IG51bGw7XG5cbiAgICAgICAgICAgICAgICBsZXQgdXNlR2V0QWxsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IGl0ZXJhdGVSZXF1ZXN0O1xuXG4gICAgICAgICAgICAgICAgaWYgKHN1cHBvcnRzT2JqU3RvcmVHZXRBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0QWxsIGRvZXNuJ3Qgd29yayBmb3IgaW5kZXggcmFuZ2VzICsgaXQgZG9lc24ndCBzdXBwb3J0IHNwZWNpYWwgZGlyZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxcbiAgICAgICAgICAgICAgICAgICAgdXNlR2V0QWxsID0gT2JqZWN0LmtleXMob3B0aW9ucykuZXZlcnkoa2V5ID0+IChrZXkgIT09ICdpbmRleCcgJiYga2V5ICE9PSAnZGlyZWN0aW9uJykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb2JqU3RvcmUuaW5kZXhOYW1lcy5jb250YWlucyhvcHRpb25zLmluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBPYmplY3Qgc3RvcmUgJHtvYmpTdG9yZS5uYW1lfSBkb2Vzbid0IGNvbnRhaW4gXCIke29wdGlvbnMuaW5kZXh9XCIgaW5kZXhgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdCA9IG9ialN0b3JlLmluZGV4KG9wdGlvbnMuaW5kZXgpLm9wZW5DdXJzb3IocmFuZ2UsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1c2VHZXRBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgYnJvd3NlciBzdXBwb3J0cyBnZXRBbGwvZ2V0QWxsS2V5cyBtZXRob2RzIGl0IGNvdWxkIGJlIGZhc3RlciB0byBydW4gdGhlc2UgbWV0aG9kc1xuICAgICAgICAgICAgICAgICAgICAvLyB0byBnZXQgYWxsIHJlY29yZHMgaWYgdGhlcmUncyBubyBgaW5kZXhgIG9yIGBkaXJlY3Rpb25gIG9wdGlvbnMgc2V0XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZm9ydHVuYXRlbHkgZ2V0QWxsIGRvZXNuJ3QgZXhwb3NlIHJlc3VsdCBrZXlzIHNvIHdlIGhhdmUgdG8gcnVuIGJvdGggdGhlc2UgbWV0aG9kc1xuICAgICAgICAgICAgICAgICAgICAvLyB0byBnZXQgYWxsIGtleXMgYW5kIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAvLyBBbnl3YXkgaXQgc2VlbXMgbGlrZSAyIGdldEFsbCogb3BzIGFyZSBmYXN0ZXIgaW4gbW9kZXJuIGJyb3dzZXJzIHRoYW4gdGhhdCBvbmVcbiAgICAgICAgICAgICAgICAgICAgLy8gd29ya2luZyB3aXRoIFVEQkN1cnNvclxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxcbiAgICAgICAgICAgICAgICAgICAgLy8gQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvSURCT2JqZWN0U3RvcmUvZ2V0QWxsS2V5c1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2lkYi1pZGJjdXJzb3ItdnMtaWRib2JqZWN0c3RvcmUtZ2V0YWxsLW9wcy8zXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBbcmFuZ2VdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb2Zmc2V0ID0gMDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKG9wdGlvbnMubGltaXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vZmZzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzWzFdICs9IG9wdGlvbnMub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCBhbGwgdmFsdWVzIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbCguLi5hcmdzKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWVzID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuZm9yRWFjaCgodmFsdWUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IG9mZnNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0SW5kZXggPSBpbmRleCAtIG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1bcmVzdWx0SW5kZXhdID0gcmVzdWx0W29ialN0b3JlTmFtZV1bcmVzdWx0SW5kZXhdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdldCBhbGwga2V5cyByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5nZXRBbGxLZXlzKC4uLmFyZ3MpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlzID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzLmZvckVhY2goKGtleSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRJbmRleCA9IGluZGV4IC0gb2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXVtyZXN1bHRJbmRleF0gfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW3Jlc3VsdEluZGV4XS5rZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSAyIHNlcGFyYXRlIElEQlJlcXVlc3RzIHJ1bm5pbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvIHRoZXJlJ3Mgbm8gbmVlZCB0byBiaW5kIGxpc3RlbmVyIHRvIHN1Y2Nlc3MgZXZlbnQgb2YgYW55IG9mIHRoZW1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBsZXQgY3Vyc29yUG9zaXRpb25Nb3ZlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBldnQudGFyZ2V0LnJlc3VsdDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBubyBtb3JlIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJzb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLm9mZnNldCAmJiAhY3Vyc29yUG9zaXRpb25Nb3ZlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yUG9zaXRpb25Nb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3IuYWR2YW5jZShvcHRpb25zLm9mZnNldCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBjdXJzb3Iua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN1cnNvci52YWx1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5saW1pdCAmJiBvcHRpb25zLmxpbWl0ID09PSByZXN1bHRbb2JqU3RvcmVOYW1lXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvci5jb250aW51ZSgpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBDb3VudCBvYmplY3RzIGluIG9uZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCBrZXlzICdpbmRleCcgb3IvYW5kICdyYW5nZSdcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtOdW1iZXJ9IG51bWJlciBvZiBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIENvdW50IG9iamVjdHMgaW4gbXVsdGlwbGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0Vycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGNvdW50OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0Jyk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuICAgICAgICBsZXQgZGF0YTtcblxuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9ICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBjcmVhdGVFcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgbGV0IHRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgbGV0IGNvdW50UmVxdWVzdDtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgLy8gU2FmYXJpOSBjYW4ndCBydW4gbXVsdGktb2JqZWN0c3RvcmUgdHJhbnNhY3Rpb25zXG4gICAgICAgICAgICAvLyBkaXZpZGUgb25lIHRyYW5zYWN0aW9uIGludG8gbWFueSB3aXRoIG9uZSBvYmplY3Qgc3RvcmUgdG8gZml4IHRoaXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Lm5hbWUgPT09ICdOb3RGb3VuZEVycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlcyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IHRoaXMuY291bnQob2JqU3RvcmVOYW1lLCBkYXRhW29ialN0b3JlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbb2JqU3RvcmVOYW1lXSA9IHByb21pc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIEtpbm9Qcm9taXNlLmFsbChwcm9taXNlcykudGhlbihyZXNvbHZlKS5jYXRjaChyZWplY3QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChleCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVuc3VyZUVycm9yKGVycikpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlQXJncyA9IChvcHRpb25zLnJhbmdlIGluc3RhbmNlb2YgSURCS2V5UmFuZ2VSZWYpID8gW29wdGlvbnMucmFuZ2VdIDogW107XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gY3JlYXRlRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IGluZGV4LmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IG9ialN0b3JlLmNvdW50KC4uLnJhbmdlQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtFcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghaW5kZXhlZERiUmVmKSB7XG4gICAgICAgICAgICByZWplY3QoY3JlYXRlRXJyb3IoJ05vdFN1cHBvcnRlZEVycm9yJywgJ1lvdXIgYnJvd3NlciBkb2VzblxcJ3Qgc3VwcG9ydCBJbmRleGVkREInKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcGVuQ29ublJlcXVlc3QgPSBpbmRleGVkRGJSZWYub3BlbihkYk5hbWUsIG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGxldCBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uID0gb3B0aW9ucy5taWdyYXRpb24gfHwge307XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZXZ0Lm9sZFZlcnNpb24gKyAxOyBpIDw9IGV2dC5uZXdWZXJzaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMubWlncmF0aW9uW2ldKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uW2ldLmNhbGwodGhpcywgdGhpcy5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihldnQudGFyZ2V0LmVycm9yKSk7XG5cbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcGVuQ29ublJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhYmFzZSA9IHRoaXMucmVzdWx0O1xuICAgICAgICAgICAgY29uc3Qgb2xkVmVyc2lvbiA9IHBhcnNlSW50KGRhdGFiYXNlLnZlcnNpb24gfHwgMCwgMTApO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGFiYXNlLnNldFZlcnNpb24gPT09ICdmdW5jdGlvbicgJiYgb2xkVmVyc2lvbiA8IG9wdGlvbnMudmVyc2lvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoYW5nZVZlclJlcXVlc3QgPSBkYXRhYmFzZS5zZXRWZXJzaW9uKG9wdGlvbnMudmVyc2lvbik7XG5cbiAgICAgICAgICAgICAgICBjaGFuZ2VWZXJSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCA9IG5ldyBFdmVudCgndXBncmFkZW5lZWRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0Lm9sZFZlcnNpb24gPSBvbGRWZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0Lm5ld1ZlcnNpb24gPSBvcHRpb25zLnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQuY2FsbCh7cmVzdWx0OiBldnQudGFyZ2V0LnNvdXJjZX0sIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGFiYXNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHNrbGFkQVBJLm9wZW4oZGJOYW1lLCBvcHRpb25zKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gZXZ0LnRhcmdldC5lcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC53ZWJraXRFcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC5tb3pFcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC5tc0Vycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LmVycm9yLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlbnN1cmVFcnJvcihlcnIpKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzdG9yZSBvYmplY3Qgc3RvcmVzIHByb3BlcnRpZXMgaW4gdGhlaXIgb3duIG1hcFxuICAgICAgICAgICAgb2JqU3RvcmVzTWV0YS5zZXQoZGJOYW1lLCBuZXcgTWFwKCkpO1xuXG4gICAgICAgICAgICByZXNvbHZlKE9iamVjdC5jcmVhdGUoc2tsYWRDb25uZWN0aW9uLCB7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2U6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGFiYXNlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcGVuQ29ublJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsIGBEYXRhYmFzZSAke2RiTmFtZX0gaXMgYmxvY2tlZGApKTtcbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBkYXRhYmFzZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYk5hbWVcbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKiAgIEBwYXJhbSB7RXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqL1xuc2tsYWRBUEkuZGVsZXRlRGF0YWJhc2UgPSBmdW5jdGlvbiBza2xhZF9kZWxldGVEYXRhYmFzZShkYk5hbWUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIWluZGV4ZWREYlJlZikge1xuICAgICAgICAgICAgcmVqZWN0KGNyZWF0ZUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkRiUmVxdWVzdCA9IGluZGV4ZWREYlJlZi5kZWxldGVEYXRhYmFzZShkYk5hbWUpO1xuXG4gICAgICAgIG9wZW5EYlJlcXVlc3Qub25zdWNjZXNzID0gb3BlbkRiUmVxdWVzdC5vbmVycm9yID0gb3BlbkRiUmVxdWVzdC5vbmJsb2NrZWQgPSBmdW5jdGlvbiBza2xhZF9kZWxldGVEYXRhYmFzZV9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IChldnQudHlwZSA9PT0gJ2Jsb2NrZWQnKVxuICAgICAgICAgICAgICAgID8gY3JlYXRlRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYClcbiAgICAgICAgICAgICAgICA6IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZW5zdXJlRXJyb3IoZXJyKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV2dC50eXBlICE9PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbn07XG5cbnNrbGFkQVBJLmtleVZhbHVlID0gZnVuY3Rpb24gc2tsYWRfa2V5VmFsdWUoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3QuY3JlYXRlKHNrbGFkS2V5VmFsdWVDb250YWluZXIsIHtcbiAgICAgICAga2V5OiB7dmFsdWU6IGtleSwgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlfSxcbiAgICAgICAgdmFsdWU6IHt2YWx1ZTogdmFsdWUsIGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZX1cbiAgICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNrbGFkQVBJO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIvc2tsYWQuanNcbiAqKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5KGFycikgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IGZvciAodmFyIGkgPSAwLCBhcnIyID0gQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIGFycjJbaV0gPSBhcnJbaV07IHJldHVybiBhcnIyOyB9IGVsc2UgeyByZXR1cm4gQXJyYXkuZnJvbShhcnIpOyB9IH1cblxuY2xhc3MgS2lub1Byb21pc2UgZXh0ZW5kcyBQcm9taXNlIHtcbiAgICBzcHJlYWQob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgICAgICAgZnVuY3Rpb24gb25GdWxmaWxsZWRJbnRlcm5hbChyZXMpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlcykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb25GdWxmaWxsZWQuYXBwbHkodW5kZWZpbmVkLCBfdG9Db25zdW1hYmxlQXJyYXkocmVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbihvbkZ1bGZpbGxlZEludGVybmFsLCBvblJlamVjdGVkKTtcbiAgICB9XG59XG5cbktpbm9Qcm9taXNlLmFsbCA9IGZ1bmN0aW9uIEtpbm9Qcm9taXNlX3N0YXRpY19hbGwocHJvbWlzZXMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEgfHwgdHlwZW9mIHByb21pc2VzICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwuYXBwbHkoUHJvbWlzZSwgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEtpbm9Qcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgaXNQcm9taXNlc0xpc3QgPSBBcnJheS5pc0FycmF5KHByb21pc2VzKTtcbiAgICAgICAgbGV0IHByb21pc2VzQXJyYXk7XG4gICAgICAgIGxldCBwcm9taXNlc0tleXM7XG5cbiAgICAgICAgaWYgKGlzUHJvbWlzZXNMaXN0KSB7XG4gICAgICAgICAgICBwcm9taXNlc0FycmF5ID0gcHJvbWlzZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlc0tleXMgPSBPYmplY3Qua2V5cyhwcm9taXNlcyk7XG4gICAgICAgICAgICBwcm9taXNlc0FycmF5ID0gcHJvbWlzZXNLZXlzLm1hcChrZXkgPT4gcHJvbWlzZXNba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICBQcm9taXNlLmFsbChwcm9taXNlc0FycmF5KS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAvLyB0cmFuc2Zvcm0gb3V0cHV0IGludG8gYW4gb2JqZWN0XG4gICAgICAgICAgICBsZXQgb3V0cHV0O1xuXG4gICAgICAgICAgICBpZiAoaXNQcm9taXNlc0xpc3QpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgPSByZXM7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dHB1dCA9IHJlcy5yZWR1Y2UoKG91dHB1dCwgY2h1bmssIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFtwcm9taXNlc0tleXNbaW5kZXhdXSA9IGNodW5rO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZShvdXRwdXQpO1xuICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xufTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gS2lub1Byb21pc2U7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9raW5vcHJvbWlzZS9idWlsZC5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBHZW5lcmF0ZXMgVVVJRHMgZm9yIG9iamVjdHMgd2l0aG91dCBrZXlzIHNldFxuICogQGxpbmsgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvaG93LXRvLWNyZWF0ZS1hLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0LzIxMTc1MjMjMjExNzUyM1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB1dWlkKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgIGNvbnN0IHYgPSAoYyA9PT0gJ3gnKSA/IHIgOiAociYweDN8MHg4KTtcblxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi91dWlkLmpzXG4gKiovIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IobmFtZSwgbWVzc2FnZSkge1xuICAgIGNvbnN0IGVyck9iaiA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICBlcnJPYmoubmFtZSA9IG5hbWU7XG5cbiAgICByZXR1cm4gZXJyT2JqO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlRXJyb3IoZXJyKSB7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiBlcnI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyZWF0ZUVycm9yKGVyci5uYW1lLCBlcnIubWVzc2FnZSk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9lcnJvci5qc1xuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLy8gc2VydmljZSB3b3JrZXJzIGRvbid0IGhhdmUgYWNjZXNzIHRvIHdpbmRvd1xuY29uc3QgaXNCcm93c2VyVUkgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpO1xuXG5leHBvcnQgY29uc3Qgc3FydCA9IE1hdGguc3FydDtcbmV4cG9ydCBjb25zdCBpbmRleGVkRGJSZWYgPSBpc0Jyb3dzZXJVSVxuICAgID8gd2luZG93LmluZGV4ZWREQiB8fCB3aW5kb3cubW96SW5kZXhlZERCIHx8IHdpbmRvdy53ZWJraXRJbmRleGVkREIgfHwgd2luZG93Lm1zSW5kZXhlZERCXG4gICAgOiBpbmRleGVkREI7XG5cbmV4cG9ydCBjb25zdCBJREJLZXlSYW5nZVJlZiA9IGlzQnJvd3NlclVJXG4gICAgPyB3aW5kb3cuSURCS2V5UmFuZ2UgfHwgd2luZG93Lm1veklEQktleVJhbmdlIHx8IHdpbmRvdy53ZWJraXRJREJLZXlSYW5nZSB8fCB3aW5kb3cubXNJREJLZXlSYW5nZVxuICAgIDogSURCS2V5UmFuZ2U7XG5cbmV4cG9ydCBjb25zdCBUUkFOU0FDVElPTl9SRUFET05MWSA9IGlzQnJvd3NlclVJXG4gICAgPyB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9PTkxZIHx8ICdyZWFkb25seSdcbiAgICA6ICdyZWFkb25seSc7XG5cbmV4cG9ydCBjb25zdCBUUkFOU0FDVElPTl9SRUFEV1JJVEUgPSBpc0Jyb3dzZXJVSVxuICAgID8gd2luZG93LklEQlRyYW5zYWN0aW9uLlJFQURfV1JJVEUgfHwgJ3JlYWR3cml0ZSdcbiAgICA6ICdyZWFkd3JpdGUnO1xuXG5leHBvcnQgY29uc3QgU09SVF9BU0MgPSBpc0Jyb3dzZXJVSVxuICAgID8gd2luZG93LklEQkN1cnNvci5ORVhUIHx8ICduZXh0J1xuICAgIDogJ25leHQnO1xuXG5leHBvcnQgY29uc3QgU09SVF9BU0NfVU5JUVVFID0gaXNCcm93c2VyVUlcbiAgICA/IGdsb2JhbE5zLklEQkN1cnNvci5ORVhUX05PX0RVUExJQ0FURSB8fCAnbmV4dHVuaXF1ZSdcbiAgICA6ICduZXh0dW5pcXVlJztcblxuZXhwb3J0IGNvbnN0IFNPUlRfREVTQyA9IGlzQnJvd3NlclVJXG4gICAgPyBnbG9iYWxOcy5JREJDdXJzb3IuUFJFViB8fCAncHJldidcbiAgICA6ICdwcmV2JztcblxuZXhwb3J0IGNvbnN0IFNPUlRfREVTQ19VTklRVUUgPSBpc0Jyb3dzZXJVSVxuICAgID8gZ2xvYmFsTnMuSURCQ3Vyc29yLlBSRVZfTk9fRFVQTElDQVRFIHx8ICdwcmV2dW5pcXVlJ1xuICAgIDogJ3ByZXZ1bmlxdWUnO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIvZW52LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==