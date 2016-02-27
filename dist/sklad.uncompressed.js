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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA3YzM3NjdhZGQ5YjgzYTI1MTYwZSIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2JBOzs7Ozs7OztBQUVBLEtBQUksQ0FBQyxPQUFPLFNBQVAsRUFBa0I7QUFDbkIsWUFBTyxTQUFQLEdBQW1CLE9BQU8sWUFBUCxJQUF1QixPQUFPLGVBQVAsSUFBMEIsT0FBTyxXQUFQLENBRGpEO0VBQXZCOztBQUlBLEtBQUksQ0FBQyxPQUFPLGNBQVAsRUFBdUI7QUFDeEIsWUFBTyxjQUFQLEdBQXdCLE9BQU8saUJBQVAsSUFBNEIsT0FBTyxvQkFBUCxJQUErQixPQUFPLGdCQUFQLENBRDNEO0VBQTVCOztBQUlBLEtBQUksQ0FBQyxPQUFPLFdBQVAsRUFBb0I7QUFDckIsWUFBTyxXQUFQLEdBQXFCLE9BQU8sY0FBUCxJQUF5QixPQUFPLGlCQUFQLElBQTRCLE9BQU8sYUFBUCxDQURyRDtFQUF6Qjs7QUFJQSxLQUFJLENBQUMsT0FBTyxTQUFQLEVBQWtCO0FBQ25CLFlBQU8sU0FBUCxHQUFtQixPQUFPLFlBQVAsSUFBdUIsT0FBTyxlQUFQLElBQTBCLE9BQU8sV0FBUCxDQURqRDtFQUF2Qjs7QUFJQSxLQUFNLHVCQUF1QixPQUFPLGNBQVAs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UCxFQUFjLGNBQWMsS0FBZCxFQUFxQixVQUFVLEtBQVYsRUFBM0M7TUFGRyxDQUFQLENBRG9EO0VBQXBDOzttQkFPTCIsImZpbGUiOiJza2xhZC51bmNvbXByZXNzZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJza2xhZFwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgN2MzNzY3YWRkOWI4M2EyNTE2MGVcbiAqKi8iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE2IERtaXRyeSBTb3JpbiA8aW5mb0BzdGF5cG9zaXRpdmUucnU+XG4gKiBodHRwczovL2dpdGh1Yi5jb20vMTk5OS9za2xhZFxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKlxuICogQGF1dGhvciBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogQGxpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sIE1JVCBMaWNlbnNlXG4gKi9cbid1c2Ugc3RyaWN0JztcblxuaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgd2luZG93LmluZGV4ZWREQiA9IHdpbmRvdy5tb3pJbmRleGVkREIgfHwgd2luZG93LndlYmtpdEluZGV4ZWREQiB8fCB3aW5kb3cubXNJbmRleGVkREI7XG59XG5cbmlmICghd2luZG93LklEQlRyYW5zYWN0aW9uKSB7XG4gICAgd2luZG93LklEQlRyYW5zYWN0aW9uID0gd2luZG93Lm1veklEQlRyYW5zYWN0aW9uIHx8IHdpbmRvdy53ZWJraXRJREJUcmFuc2FjdGlvbiB8fCB3aW5kb3cubXNJREJUcmFuc2FjdGlvbjtcbn1cblxuaWYgKCF3aW5kb3cuSURCS2V5UmFuZ2UpIHtcbiAgICB3aW5kb3cuSURCS2V5UmFuZ2UgPSB3aW5kb3cubW96SURCS2V5UmFuZ2UgfHwgd2luZG93LndlYmtpdElEQktleVJhbmdlIHx8IHdpbmRvdy5tc0lEQktleVJhbmdlO1xufVxuXG5pZiAoIXdpbmRvdy5JREJDdXJzb3IpIHtcbiAgICB3aW5kb3cuSURCQ3Vyc29yID0gd2luZG93Lm1veklEQkN1cnNvciB8fCB3aW5kb3cud2Via2l0SURCQ3Vyc29yIHx8IHdpbmRvdy5tc0lEQkN1cnNvcjtcbn1cblxuY29uc3QgVFJBTlNBQ1RJT05fUkVBRE9OTFkgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9PTkxZIHx8ICdyZWFkb25seSc7XG5jb25zdCBUUkFOU0FDVElPTl9SRUFEV1JJVEUgPSB3aW5kb3cuSURCVHJhbnNhY3Rpb24uUkVBRF9XUklURSB8fCAncmVhZHdyaXRlJztcblxuY29uc3Qgc2tsYWRBUEkgPSB7fTtcbnNrbGFkQVBJLkFTQyA9IHdpbmRvdy5JREJDdXJzb3IuTkVYVCB8fCAnbmV4dCc7XG5za2xhZEFQSS5BU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5ORVhUX05PX0RVUExJQ0FURSB8fCAnbmV4dHVuaXF1ZSc7XG5za2xhZEFQSS5ERVNDID0gd2luZG93LklEQkN1cnNvci5QUkVWIHx8ICdwcmV2JztcbnNrbGFkQVBJLkRFU0NfVU5JUVVFID0gd2luZG93LklEQkN1cnNvci5QUkVWX05PX0RVUExJQ0FURSB8fCAncHJldnVuaXF1ZSc7XG5cbi8vIHVuZm9ydHVuYXRlbHkgYGJhYmVsLXBsdWdpbi1hcnJheS1pbmNsdWRlc2AgY2FuJ3QgY29udmVydCBBcnJheS5wcm90b3R5cGUuaW5jbHVkZXNcbi8vIGludG8gQXJyYXkucHJvdG90eXBlLmluZGV4T2Ygd2l0aCBpdHMgY29kZVxuY29uc3QgaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mO1xuY29uc3Qgc3VwcG9ydHNPYmpTdG9yZUdldEFsbCA9IHR5cGVvZiBJREJPYmplY3RTdG9yZS5wcm90b3R5cGUuZ2V0QWxsID09PSAnZnVuY3Rpb24nO1xuXG4vKipcbiAqIEdlbmVyYXRlcyBVVUlEcyBmb3Igb2JqZWN0cyB3aXRob3V0IGtleXMgc2V0XG4gKiBAbGluayBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9ob3ctdG8tY3JlYXRlLWEtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQvMjExNzUyMyMyMTE3NTIzXG4gKi9cbmZ1bmN0aW9uIHV1aWQoKSB7XG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICBjb25zdCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICAgICAgY29uc3QgdiA9IChjID09PSAneCcpID8gciA6IChyJjB4M3wweDgpO1xuXG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb21tb24gYW5jZXN0b3IgZm9yIG9iamVjdHMgY3JlYXRlZCB3aXRoIHNrbGFkLmtleVZhbHVlKCkgbWV0aG9kXG4gKiBVc2VkIHRvIGRpc3Rpbmd1aXNoIHN0YW5kYXJkIG9iamVjdHMgd2l0aCBcImtleVwiIGFuZCBcInZhbHVlXCIgZmllbGRzIGZyb20gc3BlY2lhbCBvbmVzXG4gKi9cbmNvbnN0IHNrbGFkS2V5VmFsdWVDb250YWluZXIgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4vKipcbiAqIENoZWNrcyBkYXRhIGJlZm9yZSBzYXZpbmcgaXQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICogQHJldHVybiB7Qm9vbGVhbn0gZmFsc2UgaWYgc2F2ZWQgZGF0YSB0eXBlIGlzIGluY29ycmVjdCwgb3RoZXJ3aXNlIHtBcnJheX0gb2JqZWN0IHN0b3JlIGZ1bmN0aW9uIGFyZ3VtZW50c1xuICovXG5mdW5jdGlvbiBjaGVja1NhdmVkRGF0YShvYmpTdG9yZSwgZGF0YSkge1xuICAgIGNvbnN0IGtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mLmNhbGwoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwgZGF0YSk7XG4gICAgY29uc3QgdmFsdWUgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEudmFsdWUgOiBkYXRhO1xuICAgIGxldCBrZXkgPSBrZXlWYWx1ZUNvbnRhaW5lciA/IGRhdGEua2V5IDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKG9ialN0b3JlLmtleVBhdGggPT09IG51bGwpIHtcbiAgICAgICAgaWYgKCFvYmpTdG9yZS5hdXRvSW5jcmVtZW50ICYmIGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBrZXkgPSB1dWlkKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9ialN0b3JlLmF1dG9JbmNyZW1lbnQgJiYgZGF0YVtvYmpTdG9yZS5rZXlQYXRoXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBkYXRhW29ialN0b3JlLmtleVBhdGhdID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGtleSA/IFt2YWx1ZSwga2V5XSA6IFt2YWx1ZV07XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBkYXRhYmFzZSBjb250YWlucyBhbGwgbmVlZGVkIHN0b3Jlc1xuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG9ialN0b3JlTmFtZXNcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ29udGFpbmluZ1N0b3JlcyhvYmpTdG9yZU5hbWVzKSB7XG4gICAgcmV0dXJuIG9ialN0b3JlTmFtZXMuZXZlcnkoZnVuY3Rpb24gKHN0b3JlTmFtZSkge1xuICAgICAgICByZXR1cm4gKGluZGV4T2YuY2FsbCh0aGlzLmRhdGFiYXNlLm9iamVjdFN0b3JlTmFtZXMsIHN0b3JlTmFtZSkgIT09IC0xKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuY29uc3Qgc2tsYWRDb25uZWN0aW9uID0ge1xuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvbmUgcmVjb3JkIGludG8gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZCBvYmplY3Qga2V5XG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgbXVsdGlwbGUgcmVjb3JkcyBpbnRvIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBpbnNlcnRlZCBvYmplY3RzJyBrZXlzXG4gICAgICovXG4gICAgaW5zZXJ0OiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9pbnNlcnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV1bMF0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVtvYmpTdG9yZU5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWREYXRhID0gY2hlY2tTYXZlZERhdGEob2JqU3RvcmUsIGRhdGFbb2JqU3RvcmVOYW1lXVtpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja2VkRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgJ1lvdSBtdXN0IHN1cHBseSBvYmplY3RzIHRvIGJlIHNhdmVkIGluIHRoZSBvYmplY3Qgc3RvcmUgd2l0aCBzZXQga2V5UGF0aCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlcTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcSA9IG9ialN0b3JlLmFkZC5hcHBseShvYmpTdG9yZSwgY2hlY2tlZERhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdID0gcmVzdWx0W29ialN0b3JlTmFtZV0gfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXVtpXSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEluc2VydCBvciB1cGRhdGUgb25lIHJlY29yZCBpbiB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7Kn0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0geyp9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0IGtleSBvdGhlcndpc2VcbiAgICAgKlxuICAgICAqIDIpIEluc2VydCBvciB1cGRhdGUgbXVsdGlwbGUgcmVjb3JkcyBpbiB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gaW5zZXJ0ZWQvdXBkYXRlZCBvYmplY3RzJyBrZXlzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHVwc2VydDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fdXBzZXJ0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbb2JqU3RvcmVOYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKG9ialN0b3JlLCBkYXRhW29ialN0b3JlTmFtZV1baV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gbmV3IERPTUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEgPSBvYmpTdG9yZS5wdXQuYXBwbHkob2JqU3RvcmUsIGNoZWNrZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBEZWxldGUgb25lIHJlY29yZCBmcm9tIHRoZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtNaXhlZH0ga2V5XG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKlxuICAgICAqIDIpIERlbGV0ZSBtdWx0aXBsZSByZWNvcmRzIGZyb20gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqXG4gICAgICogQVRURU5USU9OOiB5b3UgY2FuIHBhc3Mgb25seSBWQUxJRCBLRVlTIE9SIEtFWSBSQU5HRVMgdG8gZGVsZXRlIHJlY29yZHNcbiAgICAgKiBAc2VlIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvSW5kZXhlZERCL3Jhdy1maWxlL3RpcC9PdmVydmlldy5odG1sI2Rmbi12YWxpZC1rZXlcbiAgICAgKiBAc2VlIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvSW5kZXhlZERCL3Jhdy1maWxlL3RpcC9PdmVydmlldy5odG1sI2Rmbi1rZXktcmFuZ2VcbiAgICAgKi9cbiAgICBkZWxldGU6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9kZWxldGUoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9kZWxldGVfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcblxuICAgICAgICAgICAgICAgIGRhdGFbb2JqU3RvcmVOYW1lXS5mb3JFYWNoKG9ialN0b3JlTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYm9ydEVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmRlbGV0ZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgb2JqZWN0IHN0b3JlKHMpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gb2JqU3RvcmVOYW1lcyBhcnJheSBvZiBvYmplY3Qgc3RvcmVzIG9yIGEgc2luZ2xlIG9iamVjdCBzdG9yZVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBlcnJcbiAgICAgKi9cbiAgICBjbGVhcjogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2NsZWFyKG9ialN0b3JlTmFtZXMpIHtcbiAgICAgICAgb2JqU3RvcmVOYW1lcyA9IEFycmF5LmlzQXJyYXkob2JqU3RvcmVOYW1lcykgPyBvYmpTdG9yZU5hbWVzIDogW29ialN0b3JlTmFtZXNdO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXJfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2gob2JqU3RvcmVOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWJvcnRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIEdldCBvYmplY3RzIGZyb20gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JywgJ3JhbmdlJywgJ29mZnNldCcsICdsaW1pdCcgYW5kICdkaXJlY3Rpb24nXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7QXJyYXl9IHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgR2V0IG9iamVjdHMgZnJvbSBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9nZXQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2YgYXJndW1lbnRzWzBdID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgICAgIGxldCBkYXRhLCBhYm9ydEVycjtcblxuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9ICh0eXBlb2YgYXJndW1lbnRzWzFdID09PSAnZnVuY3Rpb24nKSA/IG51bGwgOiBhcmd1bWVudHNbMV07XG4gICAgICAgIH1cblxuICAgICAgICBvYmpTdG9yZU5hbWVzLmZvckVhY2goZnVuY3Rpb24gKG9ialN0b3JlTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFET05MWSk7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9nZXRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChldnQudHlwZSA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9ialN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGF0YVtvYmpTdG9yZU5hbWVdIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnMuZGlyZWN0aW9uIHx8IHNrbGFkQVBJLkFTQztcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IG9wdGlvbnMucmFuZ2UgaW5zdGFuY2VvZiB3aW5kb3cuSURCS2V5UmFuZ2UgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGxldCB1c2VHZXRBbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgaXRlcmF0ZVJlcXVlc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNPYmpTdG9yZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICB1c2VHZXRBbGwgPSBPYmplY3Qua2V5cyhvcHRpb25zKS5ldmVyeShmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5ID09PSAnbGltaXQnIHx8IGtleSA9PT0gJ3JhbmdlJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBPYmplY3Qgc3RvcmUgJHtvYmpTdG9yZS5uYW1lfSBkb2Vzbid0IGNvbnRhaW4gXCIke29wdGlvbnMuaW5kZXh9XCIgaW5kZXhgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdCA9IG9ialN0b3JlLmluZGV4KG9wdGlvbnMuaW5kZXgpLm9wZW5DdXJzb3IocmFuZ2UsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfS8qIGVsc2UgaWYgKHVzZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbChyYW5nZSwgb3B0aW9ucy5saW1pdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHQsIG51bGwsICcgICAgJykpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGtleTogY3Vyc29yLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgdmFsdWU6IGN1cnNvci52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9Ki8gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdCA9IG9ialN0b3JlLm9wZW5DdXJzb3IocmFuZ2UsIGRpcmVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IGN1cnNvclBvc2l0aW9uTW92ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gbW9yZSByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3Vyc29yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5vZmZzZXQgJiYgIWN1cnNvclBvc2l0aW9uTW92ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvclBvc2l0aW9uTW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmFkdmFuY2Uob3B0aW9ucy5vZmZzZXQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleTogY3Vyc29yLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjdXJzb3IudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubGltaXQgJiYgb3B0aW9ucy5saW1pdCA9PT0gcmVzdWx0W29ialN0b3JlTmFtZV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXJzb3IuY29udGludWUoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgQ291bnQgb2JqZWN0cyBpbiBvbmUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb2JqZWN0IHdpdGgga2V5cyAnaW5kZXgnIG9yL2FuZCAncmFuZ2UnXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7TnVtYmVyfSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBDb3VudCBvYmplY3RzIGluIG11bHRpcGxlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IG51bWJlciBvZiBzdG9yZWQgb2JqZWN0cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBjb3VudDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2NvdW50KCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdHlwZW9mIGFyZ3VtZW50c1swXSA9PT0gJ29iamVjdCcpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcbiAgICAgICAgbGV0IGRhdGE7XG5cbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSAodHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ2Z1bmN0aW9uJykgPyBudWxsIDogYXJndW1lbnRzWzFdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRE9OTFkpO1xuICAgICAgICAgICAgbGV0IGNvdW50UmVxdWVzdCwgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGRhdGFbb2JqU3RvcmVOYW1lXSB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IChvcHRpb25zLnJhbmdlIGluc3RhbmNlb2Ygd2luZG93LklEQktleVJhbmdlKSA/IG9wdGlvbnMucmFuZ2UgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvYmpTdG9yZS5pbmRleE5hbWVzLmNvbnRhaW5zKG9wdGlvbnMuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBPYmplY3Qgc3RvcmUgJHtvYmpTdG9yZS5uYW1lfSBkb2Vzbid0IGNvbnRhaW4gXCIke29wdGlvbnMuaW5kZXh9XCIgaW5kZXhgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3QgPSBvYmpTdG9yZS5pbmRleChvcHRpb25zLmluZGV4KS5jb3VudChyYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50UmVxdWVzdCA9IG9ialN0b3JlLmNvdW50KHJhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IGV2dC50YXJnZXQucmVzdWx0IHx8IDA7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsb3NlIEluZGV4ZWREQiBjb25uZWN0aW9uXG4gICAgICovXG4gICAgY2xvc2U6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbG9zZSgpIHtcbiAgICAgICAgdGhpcy5kYXRhYmFzZS5jbG9zZSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5kYXRhYmFzZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIE9wZW5zIGNvbm5lY3Rpb24gdG8gYSBkYXRhYmFzZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYk5hbWUgZGF0YWJhc2UgbmFtZVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zID0ge31dIGNvbm5lY3Rpb24gb3B0aW9uc1xuICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLnZlcnNpb25dIGRhdGFiYXNlIHZlcnNpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5taWdyYXRpb25dIG1pZ3JhdGlvbiBzY3JpcHRzXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogICBAcGFyYW0ge09iamVjdH0gW2Nvbm5dIGlmIC0gcHJvbWlzZSBpcyByZXNvbHZlZFxuICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSAtIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqL1xuc2tsYWRBUEkub3BlbiA9IGZ1bmN0aW9uIHNrbGFkX29wZW4oZGJOYW1lLCBvcHRpb25zID0ge3ZlcnNpb246IDF9KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IERPTUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkNvbm5SZXF1ZXN0ID0gd2luZG93LmluZGV4ZWREQi5vcGVuKGRiTmFtZSwgb3B0aW9ucy52ZXJzaW9uKTtcbiAgICAgICAgbGV0IGlzUmVzb2x2ZWRPclJlamVjdGVkID0gZmFsc2U7XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb24gPSBvcHRpb25zLm1pZ3JhdGlvbiB8fCB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBldnQub2xkVmVyc2lvbiArIDE7IGkgPD0gZXZ0Lm5ld1ZlcnNpb247IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5taWdyYXRpb25baV0pXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5taWdyYXRpb25baV0uY2FsbCh0aGlzLCB0aGlzLnJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmVqZWN0KGV2dC50YXJnZXQuZXJyb3IpO1xuXG4gICAgICAgICAgICBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YWJhc2UgPSB0aGlzLnJlc3VsdDtcbiAgICAgICAgICAgIGNvbnN0IG9sZFZlcnNpb24gPSBwYXJzZUludChkYXRhYmFzZS52ZXJzaW9uIHx8IDAsIDEwKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhYmFzZS5zZXRWZXJzaW9uID09PSAnZnVuY3Rpb24nICYmIG9sZFZlcnNpb24gPCBvcHRpb25zLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGFuZ2VWZXJSZXF1ZXN0ID0gZGF0YWJhc2Uuc2V0VmVyc2lvbihvcHRpb25zLnZlcnNpb24pO1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQgPSBuZXcgRXZlbnQoJ3VwZ3JhZGVuZWVkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tVXBncmFkZU5lZWRlZEV2dC5vbGRWZXJzaW9uID0gb2xkVmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tVXBncmFkZU5lZWRlZEV2dC5uZXdWZXJzaW9uID0gb3B0aW9ucy52ZXJzaW9uO1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ29ublJlcXVlc3Qub251cGdyYWRlbmVlZGVkLmNhbGwoe3Jlc3VsdDogZXZ0LnRhcmdldC5zb3VyY2V9LCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0KTtcblxuICAgICAgICAgICAgICAgICAgICBkYXRhYmFzZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBza2xhZEFQSS5vcGVuKGRiTmFtZSwgb3B0aW9ucykudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBjaGFuZ2VWZXJSZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGV2dC50YXJnZXQuZXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQud2Via2l0RXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQubW96RXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQubXNFcnJvck1lc3NhZ2UgfHwgZXZ0LnRhcmdldC5lcnJvci5uYW1lO1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlKE9iamVjdC5jcmVhdGUoc2tsYWRDb25uZWN0aW9uLCB7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2U6IHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGFiYXNlLFxuICAgICAgICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGlzUmVzb2x2ZWRPclJlamVjdGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBvcGVuQ29ublJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgcmVqZWN0KG5ldyBET01FcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCBgRGF0YWJhc2UgJHtkYk5hbWV9IGlzIGJsb2NrZWRgKSk7XG4gICAgICAgICAgICBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxuICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLmRlbGV0ZURhdGFiYXNlID0gZnVuY3Rpb24gc2tsYWRfZGVsZXRlRGF0YWJhc2UoZGJOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW5kZXhlZERCKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IERPTUVycm9yKCdOb3RTdXBwb3J0ZWRFcnJvcicsICdZb3VyIGJyb3dzZXIgZG9lc25cXCd0IHN1cHBvcnQgSW5kZXhlZERCJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgb3BlbkRiUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIuZGVsZXRlRGF0YWJhc2UoZGJOYW1lKTtcblxuICAgICAgICBvcGVuRGJSZXF1ZXN0Lm9uc3VjY2VzcyA9IG9wZW5EYlJlcXVlc3Qub25lcnJvciA9IG9wZW5EYlJlcXVlc3Qub25ibG9ja2VkID0gZnVuY3Rpb24gc2tsYWRfZGVsZXRlRGF0YWJhc2Vfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSAoZXZ0LnR5cGUgPT09ICdibG9ja2VkJylcbiAgICAgICAgICAgICAgICA/IG5ldyBET01FcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCBgRGF0YWJhc2UgJHtkYk5hbWV9IGlzIGJsb2NrZWRgKVxuICAgICAgICAgICAgICAgIDogZXZ0LnRhcmdldC5lcnJvcjtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChldnQudHlwZSAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuXG5za2xhZEFQSS5rZXlWYWx1ZSA9IGZ1bmN0aW9uIHNrbGFkX2tleVZhbHVlKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShza2xhZEtleVZhbHVlQ29udGFpbmVyLCB7XG4gICAgICAgIGtleToge3ZhbHVlOiBrZXksIGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZX0sXG4gICAgICAgIHZhbHVlOiB7dmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9XG4gICAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBza2xhZEFQSTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vbGliL3NrbGFkLmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==