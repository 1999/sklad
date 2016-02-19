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
/***/ function(module, exports) {

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
	    var value = keyValueContainer ? data.value : data;
	    var key = keyValueContainer ? data.key : undefined;
	
	    if (objStore.keyPath === null) {
	        if (!objStore.autoIncrement && key === undefined) {
	            key = uuid();
	        }
	    } else {
	        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) !== 'object') {
	            return false;
	        }
	
	        if (!objStore.autoIncrement && data[objStore.keyPath] === undefined) {
	            data[objStore.keyPath] = uuid();
	        }
	    }
	
	    return key ? [value, key] : [value];
	}
	
	/**
	 * Check whether database contains all needed stores
	 *
	 * @param {Array} objStoreNames
	 * @return {Boolean}
	 */
	function checkContainingStores(objStoreNames) {
	    return objStoreNames.every(function (storeName) {
	        return indexOf.call(this.database.objectStoreNames, storeName) !== -1;
	    }, this);
	}
	
	var skladConnection = {
	    /**
	     * 1) Insert one record into the object store
	     * @param {String} objStoreName name of object store
	     * @param {*} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {*} inserted object key
	     *
	     * 2) Insert multiple records into the object stores (during one transaction)
	     * @param {Object} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {Object} inserted objects' keys
	     */
	    insert: function skladConnection_insert() {
	        var _this = this;
	
	        var isMulti = arguments.length === 1;
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	            var result = {};
	            var transaction = _this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            var abortErr = undefined;
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_insert_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]][0]);
	                } else {
	                    reject(err);
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop = function _loop(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	
	                var _loop2 = function _loop2(i) {
	                    var checkedData = checkSavedData(objStore, data[objStoreName][i]);
	
	                    if (!checkedData) {
	                        abortErr = new DOMError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
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
	                    var _ret2 = _loop2(i);
	
	                    switch (_ret2) {
	                        case 'continue':
	                            continue;
	
	                        default:
	                            if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
	                    }
	                }
	            };
	
	            for (var objStoreName in data) {
	                var _ret = _loop(objStoreName);
	
	                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	            }
	        });
	    },
	
	    /**
	     * 1) Insert or update one record in the object store
	     * @param {String} objStoreName name of object store
	     * @param {*} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {*} inserted/updated object key otherwise
	     *
	     * 2) Insert or update multiple records in the object stores (during one transaction)
	     * @param {Object} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {Object} inserted/updated objects' keys otherwise
	     */
	    upsert: function skladConnection_upsert() {
	        var _this2 = this;
	
	        var isMulti = arguments.length === 1;
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	            var result = {};
	            var transaction = _this2.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            var abortErr = undefined;
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_upsert_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]][0]);
	                } else {
	                    reject(err);
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop3 = function _loop3(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	
	                var _loop4 = function _loop4(i) {
	                    var checkedData = checkSavedData(objStore, data[objStoreName][i]);
	
	                    if (!checkedData) {
	                        abortErr = new DOMError('InvalidStateError', 'You must supply objects to be saved in the object store with set keyPath');
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
	                    var _ret4 = _loop4(i);
	
	                    switch (_ret4) {
	                        case 'continue':
	                            continue;
	
	                        default:
	                            if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
	                    }
	                }
	            };
	
	            for (var objStoreName in data) {
	                var _ret3 = _loop3(objStoreName);
	
	                if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
	            }
	        });
	    },
	
	    /**
	     * 1) Delete one record from the object store
	     * @param {String} objStoreName name of object store
	     * @param {Mixed} key
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *
	     * 2) Delete multiple records from the object stores (during one transaction)
	     * @param {Object} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
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
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	            var transaction = _this3.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            var abortErr = undefined;
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_delete_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	
	                if (err) {
	                    reject(err);
	                } else {
	                    resolve();
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop5 = function _loop5(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	
	                data[objStoreName].forEach(function (objStoreName) {
	                    if (abortErr) {
	                        return;
	                    }
	
	                    try {
	                        objStore.delete(objStoreName);
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
	     *   @param {DOMError} err
	     */
	    clear: function skladConnection_clear(objStoreNames) {
	        var _this4 = this;
	
	        objStoreNames = Array.isArray(objStoreNames) ? objStoreNames : [objStoreNames];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        return new Promise(function (resolve, reject) {
	            var transaction = _this4.database.transaction(objStoreNames, TRANSACTION_READWRITE);
	            var abortErr = undefined;
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_clear_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	
	                if (err) {
	                    reject(err);
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
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {Array} stored objects otherwise
	     *
	     * 2) Get objects from multiple object stores (during one transaction)
	     * @param {Object} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {Object} stored objects otherwise
	     */
	    get: function skladConnection_get() {
	        var _this5 = this;
	
	        var isMulti = arguments.length === 2 && _typeof(arguments[0]) === 'object' && typeof arguments[1] === 'function';
	        var objStoreNames = isMulti ? Object.keys(arguments[0]) : [arguments[0]];
	
	        var allObjStoresExist = checkContainingStores.call(this, objStoreNames);
	        if (!allObjStoresExist) {
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
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
	            var transaction = _this5.database.transaction(objStoreNames, TRANSACTION_READONLY);
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_get_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]]);
	                } else {
	                    reject(err);
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
	                        abortErr = new DOMError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
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
	                } else if (useGetAll) {
	                    // @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
	                    try {
	                        objStore.getAll(range, options.limit || Number.POSITIVE_INFINITY).onsuccess = function (evt) {
	                            var result = evt.target.result;
	                            console.log(JSON.stringify(result, null, '    '));
	
	                            // result[objStoreName].push({
	                            //     key: cursor.key,
	                            //     value: cursor.value
	                            // });
	                        };
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: undefined
	                        };
	                    }
	                } else {
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
	                var _ret6 = _loop6(objStoreName);
	
	                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
	            }
	        });
	    },
	
	    /**
	     * 1) Count objects in one object store
	     * @param {String} objStoreName name of object store
	     * @param {Object} options (optional) object with keys 'index' or/and 'range'
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
	     *   @param {Number} number of stored objects otherwise
	     *
	     * 2) Count objects in multiple object stores (during one transaction)
	     * @param {Object} data
	     * @return {Promise}
	     *   @param {DOMError} [err] if promise is rejected
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
	            var err = new DOMError('NotFoundError', 'Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed stores');
	            return Promise.reject(err);
	        }
	
	        return new Promise(function (resolve, reject) {
	            var result = {};
	            var transaction = _this6.database.transaction(objStoreNames, TRANSACTION_READONLY);
	            var countRequest = undefined,
	                abortErr = undefined;
	
	            transaction.oncomplete = transaction.onerror = transaction.onabort = function skladConnection_count_onFinish(evt) {
	                var err = abortErr || evt.target.error;
	                var isSuccess = !err && evt.type === 'complete';
	
	                if (isSuccess) {
	                    resolve(isMulti ? result : result[objStoreNames[0]]);
	                } else {
	                    reject(err);
	                }
	
	                if (evt.type === 'error') {
	                    evt.preventDefault();
	                }
	            };
	
	            var _loop7 = function _loop7(objStoreName) {
	                var objStore = transaction.objectStore(objStoreName);
	                var options = data[objStoreName] || {};
	                var range = options.range instanceof window.IDBKeyRange ? options.range : null;
	
	                if (options.index) {
	                    if (!objStore.indexNames.contains(options.index)) {
	                        abortErr = new DOMError('NotFoundError', 'Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index');
	                        return {
	                            v: undefined
	                        };
	                    }
	
	                    try {
	                        countRequest = objStore.index(options.index).count(range);
	                    } catch (ex) {
	                        abortErr = ex;
	                        return {
	                            v: undefined
	                        };
	                    }
	                } else {
	                    try {
	                        countRequest = objStore.count(range);
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
	                var _ret7 = _loop7(objStoreName);
	
	                if ((typeof _ret7 === 'undefined' ? 'undefined' : _typeof(_ret7)) === "object") return _ret7.v;
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
	 *   @param {DOMError} [err] - if promise is rejected
	 */
	skladAPI.open = function sklad_open(dbName) {
	    var options = arguments.length <= 1 || arguments[1] === undefined ? { version: 1 } : arguments[1];
	
	    return new Promise(function (resolve, reject) {
	        if (!window.indexedDB) {
	            reject(new DOMError('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
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
	            reject(evt.target.error);
	
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
	                    reject(err);
	                };
	
	                return;
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
	
	            reject(new DOMError('InvalidStateError', 'Database ' + dbName + ' is blocked'));
	            isResolvedOrRejected = true;
	        };
	    });
	};
	
	/**
	 * Deletes database
	 *
	 * @param {String} dbName
	 * @return {Promise}
	 *   @param {DOMError} [err] if promise is rejected
	 */
	skladAPI.deleteDatabase = function sklad_deleteDatabase(dbName) {
	    return new Promise(function (resolve, reject) {
	        if (!window.indexedDB) {
	            reject(new DOMError('NotSupportedError', 'Your browser doesn\'t support IndexedDB'));
	            return;
	        }
	
	        var openDbRequest = window.indexedDB.deleteDatabase(dbName);
	
	        openDbRequest.onsuccess = openDbRequest.onerror = openDbRequest.onblocked = function sklad_deleteDatabase_onFinish(evt) {
	            var err = evt.type === 'blocked' ? new DOMError('InvalidStateError', 'Database ' + dbName + ' is blocked') : evt.target.error;
	
	            if (err) {
	                reject(err);
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

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAyMDI4MWJlODljMGIxNDdmNjZkNSIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2JBOzs7Ozs7OztBQUVBLEtBQUksQ0FBQyxPQUFPLFNBQVAsRUFBa0I7QUFDbkIsWUFBTyxTQUFQLEdBQW1CLE9BQU8sWUFBUCxJQUF1QixPQUFPLGVBQVAsSUFBMEIsT0FBTyxXQUFQLENBRGpEO0VBQXZCOztBQUlBLEtBQUksQ0FBQyxPQUFPLGNBQVAsRUFBdUI7QUFDeEIsWUFBTyxjQUFQLEdBQXdCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxvQkFBUCxJQUErQixPQUFPLGdCQUFQLENBRDNEO0VBQTVCOztBQUlBLEtBQUksQ0FBQyxPQUFPLFdBQVAsRUFBb0I7QUFDckIsWUFBTyxXQUFQLEdBQXFCLE9BQU8sY0FBUCxJQUF5QixPQUFPLGlCQUFQLElBQTRCLE9BQU8sYUFBUCxDQURyRDtFQUF6Qjs7QUFJQSxLQUFJLENBQUMsT0FBTyxTQUFQLEVBQWtCO0FBQ25CLFlBQU8sU0FBUCxHQUFtQixPQUFPLFlBQVAsSUFBdUIsT0FBTyxlQUFQLElBQTBCLE9BQU8sV0FBUCxDQURqRDtFQUF2Qjs7QUFJQSxLQUFNLHVCQUF1QixPQUFPLGNBQVAs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QVAsRUFESztjQUFULE1BRU87QUFDSCwyQkFERztjQUZQOztBQU1BLGlCQUFJLElBQUksSUFBSixLQUFhLFNBQWIsRUFBd0I7QUFDeEIscUJBQUksY0FBSixHQUR3QjtjQUE1QjtVQVh3RSxDQVJ4QztNQUFyQixDQUFuQixDQUQ0RDtFQUF0Qzs7QUEyQjFCLFVBQVMsUUFBVCxHQUFvQixTQUFTLGNBQVQsQ0FBd0IsR0FBeEIsRUFBNkIsS0FBN0IsRUFBb0M7QUFDcEQsWUFBTyxPQUFPLE1BQVAsQ0FBYyxzQkFBZCxFQUFzQztBQUN6QyxjQUFLLEVBQUMsT0FBTyxHQUFQLEVBQVksY0FBYyxLQUFkLEVBQXFCLFVBQVUsS0FBVixFQUF2QztBQUNBLGdCQUFPLEVBQUMsT0FBTyxLQUFQLEVBQWMsY0FBYyxLQUFkLEVBQXFCLFVBQVUsS0FBVixFQUEzQztNQUZHLENBQVAsQ0FEb0Q7RUFBcEM7O21CQU9MIiwiZmlsZSI6InNrbGFkLnVuY29tcHJlc3NlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInNrbGFkXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcInNrbGFkXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uXG4gKiovIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCAyMDI4MWJlODljMGIxNDdmNjZkNVxuICoqLyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTYgRG1pdHJ5IFNvcmluIDxpbmZvQHN0YXlwb3NpdGl2ZS5ydT5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS8xOTk5L3NrbGFkXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqXG4gKiBAYXV0aG9yIERtaXRyeSBTb3JpbiA8aW5mb0BzdGF5cG9zaXRpdmUucnU+XG4gKiBAbGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWwgTUlUIExpY2Vuc2VcbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pZiAoIXdpbmRvdy5pbmRleGVkREIpIHtcbiAgICB3aW5kb3cuaW5kZXhlZERCID0gd2luZG93Lm1vekluZGV4ZWREQiB8fCB3aW5kb3cud2Via2l0SW5kZXhlZERCIHx8IHdpbmRvdy5tc0luZGV4ZWREQjtcbn1cblxuaWYgKCF3aW5kb3cuSURCVHJhbnNhY3Rpb24pIHtcbiAgICB3aW5kb3cuSURCVHJhbnNhY3Rpb24gPSB3aW5kb3cubW96SURCVHJhbnNhY3Rpb24gfHwgd2luZG93LndlYmtpdElEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy5tc0lEQlRyYW5zYWN0aW9uO1xufVxuXG5pZiAoIXdpbmRvdy5JREJLZXlSYW5nZSkge1xuICAgIHdpbmRvdy5JREJLZXlSYW5nZSA9IHdpbmRvdy5tb3pJREJLZXlSYW5nZSB8fCB3aW5kb3cud2Via2l0SURCS2V5UmFuZ2UgfHwgd2luZG93Lm1zSURCS2V5UmFuZ2U7XG59XG5cbmlmICghd2luZG93LklEQkN1cnNvcikge1xuICAgIHdpbmRvdy5JREJDdXJzb3IgPSB3aW5kb3cubW96SURCQ3Vyc29yIHx8IHdpbmRvdy53ZWJraXRJREJDdXJzb3IgfHwgd2luZG93Lm1zSURCQ3Vyc29yO1xufVxuXG5jb25zdCBUUkFOU0FDVElPTl9SRUFET05MWSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX09OTFkgfHwgJ3JlYWRvbmx5JztcbmNvbnN0IFRSQU5TQUNUSU9OX1JFQURXUklURSA9IHdpbmRvdy5JREJUcmFuc2FjdGlvbi5SRUFEX1dSSVRFIHx8ICdyZWFkd3JpdGUnO1xuXG5jb25zdCBza2xhZEFQSSA9IHt9O1xuc2tsYWRBUEkuQVNDID0gd2luZG93LklEQkN1cnNvci5ORVhUIHx8ICduZXh0JztcbnNrbGFkQVBJLkFTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLk5FWFRfTk9fRFVQTElDQVRFIHx8ICduZXh0dW5pcXVlJztcbnNrbGFkQVBJLkRFU0MgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVYgfHwgJ3ByZXYnO1xuc2tsYWRBUEkuREVTQ19VTklRVUUgPSB3aW5kb3cuSURCQ3Vyc29yLlBSRVZfTk9fRFVQTElDQVRFIHx8ICdwcmV2dW5pcXVlJztcblxuLy8gdW5mb3J0dW5hdGVseSBgYmFiZWwtcGx1Z2luLWFycmF5LWluY2x1ZGVzYCBjYW4ndCBjb252ZXJ0IEFycmF5LnByb3RvdHlwZS5pbmNsdWRlc1xuLy8gaW50byBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB3aXRoIGl0cyBjb2RlXG5jb25zdCBpbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2Y7XG5jb25zdCBzdXBwb3J0c09ialN0b3JlR2V0QWxsID0gdHlwZW9mIElEQk9iamVjdFN0b3JlLnByb3RvdHlwZS5nZXRBbGwgPT09ICdmdW5jdGlvbic7XG5cbi8qKlxuICogR2VuZXJhdGVzIFVVSURzIGZvciBvYmplY3RzIHdpdGhvdXQga2V5cyBzZXRcbiAqIEBsaW5rIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2hvdy10by1jcmVhdGUtYS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdC8yMTE3NTIzIzIxMTc1MjNcbiAqL1xuZnVuY3Rpb24gdXVpZCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG4gICAgICAgIGNvbnN0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgICAgICBjb25zdCB2ID0gKGMgPT09ICd4JykgPyByIDogKHImMHgzfDB4OCk7XG5cbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbW1vbiBhbmNlc3RvciBmb3Igb2JqZWN0cyBjcmVhdGVkIHdpdGggc2tsYWQua2V5VmFsdWUoKSBtZXRob2RcbiAqIFVzZWQgdG8gZGlzdGluZ3Vpc2ggc3RhbmRhcmQgb2JqZWN0cyB3aXRoIFwia2V5XCIgYW5kIFwidmFsdWVcIiBmaWVsZHMgZnJvbSBzcGVjaWFsIG9uZXNcbiAqL1xuY29uc3Qgc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbi8qKlxuICogQ2hlY2tzIGRhdGEgYmVmb3JlIHNhdmluZyBpdCBpbiB0aGUgb2JqZWN0IHN0b3JlXG4gKiBAcmV0dXJuIHtCb29sZWFufSBmYWxzZSBpZiBzYXZlZCBkYXRhIHR5cGUgaXMgaW5jb3JyZWN0LCBvdGhlcndpc2Uge0FycmF5fSBvYmplY3Qgc3RvcmUgZnVuY3Rpb24gYXJndW1lbnRzXG4gKi9cbmZ1bmN0aW9uIGNoZWNrU2F2ZWREYXRhKG9ialN0b3JlLCBkYXRhKSB7XG4gICAgY29uc3Qga2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YuY2FsbChza2xhZEtleVZhbHVlQ29udGFpbmVyLCBkYXRhKTtcbiAgICBjb25zdCB2YWx1ZSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS52YWx1ZSA6IGRhdGE7XG4gICAgbGV0IGtleSA9IGtleVZhbHVlQ29udGFpbmVyID8gZGF0YS5rZXkgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAob2JqU3RvcmUua2V5UGF0aCA9PT0gbnVsbCkge1xuICAgICAgICBpZiAoIW9ialN0b3JlLmF1dG9JbmNyZW1lbnQgJiYga2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGtleSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb2JqU3RvcmUuYXV0b0luY3JlbWVudCAmJiBkYXRhW29ialN0b3JlLmtleVBhdGhdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGRhdGFbb2JqU3RvcmUua2V5UGF0aF0gPSB1dWlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ga2V5ID8gW3ZhbHVlLCBrZXldIDogW3ZhbHVlXTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGRhdGFiYXNlIGNvbnRhaW5zIGFsbCBuZWVkZWQgc3RvcmVzXG4gKlxuICogQHBhcmFtIHtBcnJheX0gb2JqU3RvcmVOYW1lc1xuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDb250YWluaW5nU3RvcmVzKG9ialN0b3JlTmFtZXMpIHtcbiAgICByZXR1cm4gb2JqU3RvcmVOYW1lcy5ldmVyeShmdW5jdGlvbiAoc3RvcmVOYW1lKSB7XG4gICAgICAgIHJldHVybiAoaW5kZXhPZi5jYWxsKHRoaXMuZGF0YWJhc2Uub2JqZWN0U3RvcmVOYW1lcywgc3RvcmVOYW1lKSAhPT0gLTEpO1xuICAgIH0sIHRoaXMpO1xufVxuXG5jb25zdCBza2xhZENvbm5lY3Rpb24gPSB7XG4gICAgLyoqXG4gICAgICogMSkgSW5zZXJ0IG9uZSByZWNvcmQgaW50byB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkIG9iamVjdCBrZXlcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBtdWx0aXBsZSByZWNvcmRzIGludG8gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkIG9iamVjdHMnIGtleXNcbiAgICAgKi9cbiAgICBpbnNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2luc2VydF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXVswXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhW29ialN0b3JlTmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZERhdGEgPSBjaGVja1NhdmVkRGF0YShvYmpTdG9yZSwgZGF0YVtvYmpTdG9yZU5hbWVdW2ldKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IG5ldyBET01FcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCAnWW91IG11c3Qgc3VwcGx5IG9iamVjdHMgdG8gYmUgc2F2ZWQgaW4gdGhlIG9iamVjdCBzdG9yZSB3aXRoIHNldCBrZXlQYXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxID0gb2JqU3RvcmUuYWRkLmFwcGx5KG9ialN0b3JlLCBjaGVja2VkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW2ldID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgSW5zZXJ0IG9yIHVwZGF0ZSBvbmUgcmVjb3JkIGluIHRoZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHsqfSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7Kn0gaW5zZXJ0ZWQvdXBkYXRlZCBvYmplY3Qga2V5IG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgSW5zZXJ0IG9yIHVwZGF0ZSBtdWx0aXBsZSByZWNvcmRzIGluIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBpbnNlcnRlZC91cGRhdGVkIG9iamVjdHMnIGtleXMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgdXBzZXJ0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fdXBzZXJ0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV1bMF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWREYXRhID0gY2hlY2tTYXZlZERhdGEob2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2VkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgJ1lvdSBtdXN0IHN1cHBseSBvYmplY3RzIHRvIGJlIHNhdmVkIGluIHRoZSBvYmplY3Qgc3RvcmUgd2l0aCBzZXQga2V5UGF0aCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLnB1dC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtpXSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIERlbGV0ZSBvbmUgcmVjb3JkIGZyb20gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge01peGVkfSBrZXlcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqXG4gICAgICogMikgRGVsZXRlIG11bHRpcGxlIHJlY29yZHMgZnJvbSB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiBBVFRFTlRJT046IHlvdSBjYW4gcGFzcyBvbmx5IFZBTElEIEtFWVMgT1IgS0VZIFJBTkdFUyB0byBkZWxldGUgcmVjb3Jkc1xuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLXZhbGlkLWtleVxuICAgICAqIEBzZWUgaHR0cHM6Ly9kdmNzLnczLm9yZy9oZy9JbmRleGVkREIvcmF3LWZpbGUvdGlwL092ZXJ2aWV3Lmh0bWwjZGZuLWtleS1yYW5nZVxuICAgICAqL1xuICAgIGRlbGV0ZTogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2RlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2RlbGV0ZV9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZGF0YVtvYmpTdG9yZU5hbWVdLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFib3J0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuZGVsZXRlKG9ialN0b3JlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBvYmplY3Qgc3RvcmUocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBvYmpTdG9yZU5hbWVzIGFycmF5IG9mIG9iamVjdCBzdG9yZXMgb3IgYSBzaW5nbGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IGVyclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXIob2JqU3RvcmVOYW1lcykge1xuICAgICAgICBvYmpTdG9yZU5hbWVzID0gQXJyYXkuaXNBcnJheShvYmpTdG9yZU5hbWVzKSA/IG9ialN0b3JlTmFtZXMgOiBbb2JqU3RvcmVOYW1lc107XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcl9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChvYmpTdG9yZU5hbWUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmIChhYm9ydEVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgR2V0IG9iamVjdHMgZnJvbSBvbmUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb2JqZWN0IHdpdGgga2V5cyAnaW5kZXgnLCAncmFuZ2UnLCAnb2Zmc2V0JywgJ2xpbWl0JyBhbmQgJ2RpcmVjdGlvbidcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtBcnJheX0gc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBHZXQgb2JqZWN0cyBmcm9tIG11bHRpcGxlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnICYmIHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICAgICAgbGV0IGRhdGEsIGFib3J0RXJyO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAob2JqU3RvcmVOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucy5kaXJlY3Rpb24gfHwgc2tsYWRBUEkuQVNDO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gb3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIHdpbmRvdy5JREJLZXlSYW5nZSA/IG9wdGlvbnMucmFuZ2UgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgbGV0IHVzZUdldEFsbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBpdGVyYXRlUmVxdWVzdDtcblxuICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c09ialN0b3JlR2V0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZUdldEFsbCA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLmV2ZXJ5KGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXkgPT09ICdsaW1pdCcgfHwga2V5ID09PSAncmFuZ2UnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVzZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbChyYW5nZSwgb3B0aW9ucy5saW1pdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHQsIG51bGwsICcgICAgJykpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGtleTogY3Vyc29yLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgdmFsdWU6IGN1cnNvci52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JQb3NpdGlvbk1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0ICYmICFjdXJzb3JQb3NpdGlvbk1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JQb3NpdGlvbk1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG9wdGlvbnMub2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPT09IHJlc3VsdFtvYmpTdG9yZU5hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIENvdW50IG9iamVjdHMgaW4gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JyBvci9hbmQgJ3JhbmdlJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge051bWJlcn0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgQ291bnQgb2JqZWN0cyBpbiBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgY291bnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG4gICAgICAgIGxldCBkYXRhO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIGxldCBjb3VudFJlcXVlc3QsIGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSAob3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIHdpbmRvdy5JREJLZXlSYW5nZSkgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb2JqU3RvcmUuaW5kZXhOYW1lcy5jb250YWlucyhvcHRpb25zLmluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkuY291bnQocmFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3QgPSBvYmpTdG9yZS5jb3VudChyYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBET01FcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5Db25uUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3BlbihkYk5hbWUsIG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGxldCBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uID0gb3B0aW9ucy5taWdyYXRpb24gfHwge307XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZXZ0Lm9sZFZlcnNpb24gKyAxOyBpIDw9IGV2dC5uZXdWZXJzaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMubWlncmF0aW9uW2ldKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uW2ldLmNhbGwodGhpcywgdGhpcy5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJlamVjdChldnQudGFyZ2V0LmVycm9yKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWZXJzaW9uID0gcGFyc2VJbnQoZGF0YWJhc2UudmVyc2lvbiB8fCAwLCAxMCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YWJhc2Uuc2V0VmVyc2lvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBvbGRWZXJzaW9uIDwgb3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlVmVyUmVxdWVzdCA9IGRhdGFiYXNlLnNldFZlcnNpb24ob3B0aW9ucy52ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0ID0gbmV3IEV2ZW50KCd1cGdyYWRlbmVlZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQubmV3VmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZC5jYWxsKHtyZXN1bHQ6IGV2dC50YXJnZXQuc291cmNlfSwgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgc2tsYWRBUEkub3BlbihkYk5hbWUsIG9wdGlvbnMpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBldnQudGFyZ2V0LmVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LndlYmtpdEVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1vekVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1zRXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQuZXJyb3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZShPYmplY3QuY3JlYXRlKHNrbGFkQ29ubmVjdGlvbiwge1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkYXRhYmFzZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHJlamVjdChuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYCkpO1xuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZVxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5kZWxldGVEYXRhYmFzZSA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlKGRiTmFtZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBET01FcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5EYlJlcXVlc3QgPSB3aW5kb3cuaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7XG5cbiAgICAgICAgb3BlbkRiUmVxdWVzdC5vbnN1Y2Nlc3MgPSBvcGVuRGJSZXF1ZXN0Lm9uZXJyb3IgPSBvcGVuRGJSZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gKGV2dC50eXBlID09PSAnYmxvY2tlZCcpXG4gICAgICAgICAgICAgICAgPyBuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYClcbiAgICAgICAgICAgICAgICA6IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZ0LnR5cGUgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuc2tsYWRBUEkua2V5VmFsdWUgPSBmdW5jdGlvbiBza2xhZF9rZXlWYWx1ZShrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwge1xuICAgICAgICBrZXk6IHt2YWx1ZToga2V5LCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9LFxuICAgICAgICB2YWx1ZToge3ZhbHVlOiB2YWx1ZSwgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlfVxuICAgIH0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgc2tsYWRBUEk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9za2xhZC5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=