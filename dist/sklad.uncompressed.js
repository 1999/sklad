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
	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
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
	
	            for (var objStoreName in data) {
	                var _objStore = transaction.objectStore(objStoreName);
	
	                var _iteratorNormalCompletion = true;
	                var _didIteratorError = false;
	                var _iteratorError = undefined;
	
	                try {
	                    for (var _iterator = data[objStoreName][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                        var _objStoreName = _step.value;
	
	                        try {
	                            _objStore.delete(_objStoreName);
	                        } catch (ex) {
	                            abortErr = ex;
	                            return;
	                        }
	                    }
	                } catch (err) {
	                    _didIteratorError = true;
	                    _iteratorError = err;
	                } finally {
	                    try {
	                        if (!_iteratorNormalCompletion && _iterator.return) {
	                            _iterator.return();
	                        }
	                    } finally {
	                        if (_didIteratorError) {
	                            throw _iteratorError;
	                        }
	                    }
	                }
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
	
	            var _iteratorNormalCompletion2 = true;
	            var _didIteratorError2 = false;
	            var _iteratorError2 = undefined;
	
	            try {
	                for (var _iterator2 = objStoreNames[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	                    var objStoreName = _step2.value;
	
	                    var _objStore2 = transaction.objectStore(objStoreName);
	
	                    try {
	                        _objStore2.clear();
	                    } catch (ex) {
	                        abortErr = ex;
	                        return;
	                    }
	                }
	            } catch (err) {
	                _didIteratorError2 = true;
	                _iteratorError2 = err;
	            } finally {
	                try {
	                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
	                        _iterator2.return();
	                    }
	                } finally {
	                    if (_didIteratorError2) {
	                        throw _iteratorError2;
	                    }
	                }
	            }
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
	
	            var _loop5 = function _loop5(objStoreName) {
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
	                var _ret5 = _loop5(objStoreName);
	
	                if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
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
	
	            var _loop6 = function _loop6(objStoreName) {
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
	                var _ret6 = _loop6(objStoreName);
	
	                if ((typeof _ret6 === 'undefined' ? 'undefined' : _typeof(_ret6)) === "object") return _ret6.v;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA1ZmU2NDdjNDNhZWM2MDM5OGE1ZiIsIndlYnBhY2s6Ly8vLi9saWIvc2tsYWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2JBLGFBQVksQ0FBQzs7Ozs7OztBQUViLEtBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO0FBQ25CLFdBQU0sQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksSUFBSSxNQUFNLENBQUMsZUFBZSxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUM7RUFDMUY7O0FBRUQsS0FBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUU7QUFDeEIsV0FBTSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsaUJBQWlCLElBQUksTUFBTSxDQUFDLG9CQUFvQixJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztFQUM5Rzs7QUFFRCxLQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtBQUNyQixXQUFNLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxjQUFjLElBQUksTUFBTSxDQUFDLGlCQUFpQixJQUFJLE1BQU0sQ0FBQyxhQUFhLENBQUM7RUFDbEc7O0FBRUQsS0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDbkIsV0FBTSxDQUFDLFNBQVMsR0FBRyxN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QUFDLFNBQVMsR0FBRyxTQUFTLDZCQUE2QixDQUFDLEdBQUcsRUFBRTtBQUNwSCxpQkFBTSxHQUFHLEdBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLEdBQzdCLElBQUksUUFBUSxDQUFDLG1CQUFtQixnQkFBYyxNQUFNLGlCQUFjLEdBQ2xFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDOztBQUV2QixpQkFBSSxHQUFHLEVBQUU7QUFDTCx1QkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2NBQ2YsTUFBTTtBQUNILHdCQUFPLEVBQUUsQ0FBQztjQUNiOztBQUVELGlCQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3hCLG9CQUFHLENBQUMsY0FBYyxFQUFFLENBQUM7Y0FDeEI7VUFDSixDQUFDO01BQ0wsQ0FBQyxDQUFDO0VBQ04sQ0FBQzs7QUFFRixTQUFRLENBQUMsUUFBUSxHQUFHLFNBQVMsY0FBYyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDcEQsWUFBTyxNQUFNLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFO0FBQ3pDLFlBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELGNBQUssRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFDO01BQzlELENBQUMsQ0FBQztFQUNOLENBQUM7O21CQUVhLFFBQVEiLCJmaWxlIjoic2tsYWQudW5jb21wcmVzc2VkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic2tsYWRcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiBcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb25cbiAqKi8iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDVmZTY0N2M0M2FlYzYwMzk4YTVmXG4gKiovIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEbWl0cnkgU29yaW4gPGluZm9Ac3RheXBvc2l0aXZlLnJ1PlxuICogaHR0cHM6Ly9naXRodWIuY29tLzE5OTkvc2tsYWRcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICpcbiAqIEBhdXRob3IgRG1pdHJ5IFNvcmluIDxpbmZvQHN0YXlwb3NpdGl2ZS5ydT5cbiAqIEBsaWNlbnNlIGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbCBNSVQgTGljZW5zZVxuICovXG4ndXNlIHN0cmljdCc7XG5cbmlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgIHdpbmRvdy5pbmRleGVkREIgPSB3aW5kb3cubW96SW5kZXhlZERCIHx8IHdpbmRvdy53ZWJraXRJbmRleGVkREIgfHwgd2luZG93Lm1zSW5kZXhlZERCO1xufVxuXG5pZiAoIXdpbmRvdy5JREJUcmFuc2FjdGlvbikge1xuICAgIHdpbmRvdy5JREJUcmFuc2FjdGlvbiA9IHdpbmRvdy5tb3pJREJUcmFuc2FjdGlvbiB8fCB3aW5kb3cud2Via2l0SURCVHJhbnNhY3Rpb24gfHwgd2luZG93Lm1zSURCVHJhbnNhY3Rpb247XG59XG5cbmlmICghd2luZG93LklEQktleVJhbmdlKSB7XG4gICAgd2luZG93LklEQktleVJhbmdlID0gd2luZG93Lm1veklEQktleVJhbmdlIHx8IHdpbmRvdy53ZWJraXRJREJLZXlSYW5nZSB8fCB3aW5kb3cubXNJREJLZXlSYW5nZTtcbn1cblxuaWYgKCF3aW5kb3cuSURCQ3Vyc29yKSB7XG4gICAgd2luZG93LklEQkN1cnNvciA9IHdpbmRvdy5tb3pJREJDdXJzb3IgfHwgd2luZG93LndlYmtpdElEQkN1cnNvciB8fCB3aW5kb3cubXNJREJDdXJzb3I7XG59XG5cbmNvbnN0IFRSQU5TQUNUSU9OX1JFQURPTkxZID0gd2luZG93LklEQlRyYW5zYWN0aW9uLlJFQURfT05MWSB8fCAncmVhZG9ubHknO1xuY29uc3QgVFJBTlNBQ1RJT05fUkVBRFdSSVRFID0gd2luZG93LklEQlRyYW5zYWN0aW9uLlJFQURfV1JJVEUgfHwgJ3JlYWR3cml0ZSc7XG5cbmNvbnN0IHNrbGFkQVBJID0ge307XG5za2xhZEFQSS5BU0MgPSB3aW5kb3cuSURCQ3Vyc29yLk5FWFQgfHwgJ25leHQnO1xuc2tsYWRBUEkuQVNDX1VOSVFVRSA9IHdpbmRvdy5JREJDdXJzb3IuTkVYVF9OT19EVVBMSUNBVEUgfHwgJ25leHR1bmlxdWUnO1xuc2tsYWRBUEkuREVTQyA9IHdpbmRvdy5JREJDdXJzb3IuUFJFViB8fCAncHJldic7XG5za2xhZEFQSS5ERVNDX1VOSVFVRSA9IHdpbmRvdy5JREJDdXJzb3IuUFJFVl9OT19EVVBMSUNBVEUgfHwgJ3ByZXZ1bmlxdWUnO1xuXG4vLyB1bmZvcnR1bmF0ZWx5IGBiYWJlbC1wbHVnaW4tYXJyYXktaW5jbHVkZXNgIGNhbid0IGNvbnZlcnQgQXJyYXkucHJvdG90eXBlLmluY2x1ZGVzXG4vLyBpbnRvIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHdpdGggaXRzIGNvZGVcbmNvbnN0IGluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZjtcbmNvbnN0IHN1cHBvcnRzT2JqU3RvcmVHZXRBbGwgPSB0eXBlb2YgSURCT2JqZWN0U3RvcmUucHJvdG90eXBlLmdldEFsbCA9PT0gJ2Z1bmN0aW9uJztcblxuLyoqXG4gKiBHZW5lcmF0ZXMgVVVJRHMgZm9yIG9iamVjdHMgd2l0aG91dCBrZXlzIHNldFxuICogQGxpbmsgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvaG93LXRvLWNyZWF0ZS1hLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0LzIxMTc1MjMjMjExNzUyM1xuICovXG5mdW5jdGlvbiB1dWlkKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgIGNvbnN0IHYgPSAoYyA9PT0gJ3gnKSA/IHIgOiAociYweDN8MHg4KTtcblxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29tbW9uIGFuY2VzdG9yIGZvciBvYmplY3RzIGNyZWF0ZWQgd2l0aCBza2xhZC5rZXlWYWx1ZSgpIG1ldGhvZFxuICogVXNlZCB0byBkaXN0aW5ndWlzaCBzdGFuZGFyZCBvYmplY3RzIHdpdGggXCJrZXlcIiBhbmQgXCJ2YWx1ZVwiIGZpZWxkcyBmcm9tIHNwZWNpYWwgb25lc1xuICovXG5jb25zdCBza2xhZEtleVZhbHVlQ29udGFpbmVyID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuLyoqXG4gKiBDaGVja3MgZGF0YSBiZWZvcmUgc2F2aW5nIGl0IGluIHRoZSBvYmplY3Qgc3RvcmVcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZhbHNlIGlmIHNhdmVkIGRhdGEgdHlwZSBpcyBpbmNvcnJlY3QsIG90aGVyd2lzZSB7QXJyYXl9IG9iamVjdCBzdG9yZSBmdW5jdGlvbiBhcmd1bWVudHNcbiAqL1xuZnVuY3Rpb24gY2hlY2tTYXZlZERhdGEob2JqU3RvcmUsIGRhdGEpIHtcbiAgICBjb25zdCBrZXlWYWx1ZUNvbnRhaW5lciA9IE9iamVjdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZi5jYWxsKHNrbGFkS2V5VmFsdWVDb250YWluZXIsIGRhdGEpO1xuICAgIGNvbnN0IHZhbHVlID0ga2V5VmFsdWVDb250YWluZXIgPyBkYXRhLnZhbHVlIDogZGF0YTtcbiAgICBsZXQga2V5ID0ga2V5VmFsdWVDb250YWluZXIgPyBkYXRhLmtleSA6IHVuZGVmaW5lZDtcblxuICAgIGlmIChvYmpTdG9yZS5rZXlQYXRoID09PSBudWxsKSB7XG4gICAgICAgIGlmICghb2JqU3RvcmUuYXV0b0luY3JlbWVudCAmJiBrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAga2V5ID0gdXVpZCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvYmpTdG9yZS5hdXRvSW5jcmVtZW50ICYmIGRhdGFbb2JqU3RvcmUua2V5UGF0aF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZGF0YVtvYmpTdG9yZS5rZXlQYXRoXSA9IHV1aWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBrZXkgPyBbdmFsdWUsIGtleV0gOiBbdmFsdWVdO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgZGF0YWJhc2UgY29udGFpbnMgYWxsIG5lZWRlZCBzdG9yZXNcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBvYmpTdG9yZU5hbWVzXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBjaGVja0NvbnRhaW5pbmdTdG9yZXMob2JqU3RvcmVOYW1lcykge1xuICAgIHJldHVybiBvYmpTdG9yZU5hbWVzLmV2ZXJ5KGZ1bmN0aW9uIChzdG9yZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuIChpbmRleE9mLmNhbGwodGhpcy5kYXRhYmFzZS5vYmplY3RTdG9yZU5hbWVzLCBzdG9yZU5hbWUpICE9PSAtMSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbmNvbnN0IHNrbGFkQ29ubmVjdGlvbiA9IHtcbiAgICAvKipcbiAgICAgKiAxKSBJbnNlcnQgb25lIHJlY29yZCBpbnRvIHRoZSBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqU3RvcmVOYW1lIG5hbWUgb2Ygb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHsqfSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7Kn0gaW5zZXJ0ZWQgb2JqZWN0IGtleVxuICAgICAqXG4gICAgICogMikgSW5zZXJ0IG11bHRpcGxlIHJlY29yZHMgaW50byB0aGUgb2JqZWN0IHN0b3JlcyAoZHVyaW5nIG9uZSB0cmFuc2FjdGlvbilcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge09iamVjdH0gaW5zZXJ0ZWQgb2JqZWN0cycga2V5c1xuICAgICAqL1xuICAgIGluc2VydDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2luc2VydCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgaWYgKGlzTXVsdGkpIHtcbiAgICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgICAgICBkYXRhW2FyZ3VtZW50c1swXV0gPSBbYXJndW1lbnRzWzFdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25faW5zZXJ0X29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNTdWNjZXNzID0gIWVyciAmJiBldnQudHlwZSA9PT0gJ2NvbXBsZXRlJztcblxuICAgICAgICAgICAgICAgIGlmIChpc1N1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpc011bHRpID8gcmVzdWx0IDogcmVzdWx0W29ialN0b3JlTmFtZXNbMF1dWzBdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFbb2JqU3RvcmVOYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkRGF0YSA9IGNoZWNrU2F2ZWREYXRhKG9ialN0b3JlLCBkYXRhW29ialN0b3JlTmFtZV1baV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghY2hlY2tlZERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gbmV3IERPTUVycm9yKCdJbnZhbGlkU3RhdGVFcnJvcicsICdZb3UgbXVzdCBzdXBwbHkgb2JqZWN0cyB0byBiZSBzYXZlZCBpbiB0aGUgb2JqZWN0IHN0b3JlIHdpdGggc2V0IGtleVBhdGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCByZXE7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXEgPSBvYmpTdG9yZS5hZGQuYXBwbHkob2JqU3RvcmUsIGNoZWNrZWREYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlcS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IHJlc3VsdFtvYmpTdG9yZU5hbWVdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV1baV0gPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAxKSBJbnNlcnQgb3IgdXBkYXRlIG9uZSByZWNvcmQgaW4gdGhlIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0geyp9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHsqfSBpbnNlcnRlZC91cGRhdGVkIG9iamVjdCBrZXkgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBJbnNlcnQgb3IgdXBkYXRlIG11bHRpcGxlIHJlY29yZHMgaW4gdGhlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IGluc2VydGVkL3VwZGF0ZWQgb2JqZWN0cycga2V5cyBvdGhlcndpc2VcbiAgICAgKi9cbiAgICB1cHNlcnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl91cHNlcnQoKSB7XG4gICAgICAgIGNvbnN0IGlzTXVsdGkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgICAgIGNvbnN0IG9ialN0b3JlTmFtZXMgPSBpc011bHRpID8gT2JqZWN0LmtleXMoYXJndW1lbnRzWzBdKSA6IFthcmd1bWVudHNbMF1dO1xuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRhdGE7XG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gW2FyZ3VtZW50c1sxXV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IHRoaXMuZGF0YWJhc2UudHJhbnNhY3Rpb24ob2JqU3RvcmVOYW1lcywgVFJBTlNBQ1RJT05fUkVBRFdSSVRFKTtcbiAgICAgICAgICAgIGxldCBhYm9ydEVycjtcblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX3Vwc2VydF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXVswXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhW29ialN0b3JlTmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZERhdGEgPSBjaGVja1NhdmVkRGF0YShvYmpTdG9yZSwgZGF0YVtvYmpTdG9yZU5hbWVdW2ldKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrZWREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IG5ldyBET01FcnJvcignSW52YWxpZFN0YXRlRXJyb3InLCAnWW91IG11c3Qgc3VwcGx5IG9iamVjdHMgdG8gYmUgc2F2ZWQgaW4gdGhlIG9iamVjdCBzdG9yZSB3aXRoIHNldCBrZXlQYXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVxO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxID0gb2JqU3RvcmUucHV0LmFwcGx5KG9ialN0b3JlLCBjaGVja2VkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXEub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSByZXN1bHRbb2JqU3RvcmVOYW1lXSB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFtvYmpTdG9yZU5hbWVdW2ldID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgRGVsZXRlIG9uZSByZWNvcmQgZnJvbSB0aGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IGtleVxuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICpcbiAgICAgKiAyKSBEZWxldGUgbXVsdGlwbGUgcmVjb3JkcyBmcm9tIHRoZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKlxuICAgICAqIEFUVEVOVElPTjogeW91IGNhbiBwYXNzIG9ubHkgVkFMSUQgS0VZUyBPUiBLRVkgUkFOR0VTIHRvIGRlbGV0ZSByZWNvcmRzXG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4tdmFsaWQta2V5XG4gICAgICogQHNlZSBodHRwczovL2R2Y3MudzMub3JnL2hnL0luZGV4ZWREQi9yYXctZmlsZS90aXAvT3ZlcnZpZXcuaHRtbCNkZm4ta2V5LXJhbmdlXG4gICAgICovXG4gICAgZGVsZXRlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlKCkge1xuICAgICAgICBjb25zdCBpc011bHRpID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBpZiAoaXNNdWx0aSkge1xuICAgICAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcbiAgICAgICAgICAgIGRhdGFbYXJndW1lbnRzWzBdXSA9IFthcmd1bWVudHNbMV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYXRhYmFzZS50cmFuc2FjdGlvbihvYmpTdG9yZU5hbWVzLCBUUkFOU0FDVElPTl9SRUFEV1JJVEUpO1xuICAgICAgICAgICAgbGV0IGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fZGVsZXRlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IGFib3J0RXJyIHx8IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZ0LnR5cGUgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yIChsZXQgb2JqU3RvcmVOYW1lIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvYmpTdG9yZSA9IHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKG9ialN0b3JlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBvYmpTdG9yZU5hbWUgb2YgZGF0YVtvYmpTdG9yZU5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmpTdG9yZS5kZWxldGUob2JqU3RvcmVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciBvYmplY3Qgc3RvcmUocylcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl8U3RyaW5nfSBvYmpTdG9yZU5hbWVzIGFycmF5IG9mIG9iamVjdCBzdG9yZXMgb3IgYSBzaW5nbGUgb2JqZWN0IHN0b3JlXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IGVyclxuICAgICAqL1xuICAgIGNsZWFyOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xlYXIob2JqU3RvcmVOYW1lcykge1xuICAgICAgICBvYmpTdG9yZU5hbWVzID0gQXJyYXkuaXNBcnJheShvYmpTdG9yZU5hbWVzKSA/IG9ialN0b3JlTmFtZXMgOiBbb2JqU3RvcmVOYW1lc107XG5cbiAgICAgICAgY29uc3QgYWxsT2JqU3RvcmVzRXhpc3QgPSBjaGVja0NvbnRhaW5pbmdTdG9yZXMuY2FsbCh0aGlzLCBvYmpTdG9yZU5hbWVzKTtcbiAgICAgICAgaWYgKCFhbGxPYmpTdG9yZXNFeGlzdCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYERhdGFiYXNlICR7dGhpcy5kYXRhYmFzZS5uYW1lfSAodmVyc2lvbiAke3RoaXMuZGF0YWJhc2UudmVyc2lvbn0pIGRvZXNuJ3QgY29udGFpbiBhbGwgbmVlZGVkIHN0b3Jlc2ApO1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURXUklURSk7XG4gICAgICAgICAgICBsZXQgYWJvcnRFcnI7XG5cbiAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSB0cmFuc2FjdGlvbi5vbmVycm9yID0gdHJhbnNhY3Rpb24ub25hYm9ydCA9IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jbGVhcl9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBvZiBvYmpTdG9yZU5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgb2JqU3RvcmUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogMSkgR2V0IG9iamVjdHMgZnJvbSBvbmUgb2JqZWN0IHN0b3JlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9ialN0b3JlTmFtZSBuYW1lIG9mIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb2JqZWN0IHdpdGgga2V5cyAnaW5kZXgnLCAncmFuZ2UnLCAnb2Zmc2V0JywgJ2xpbWl0JyBhbmQgJ2RpcmVjdGlvbidcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtBcnJheX0gc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICpcbiAgICAgKiAyKSBHZXQgb2JqZWN0cyBmcm9tIG11bHRpcGxlIG9iamVjdCBzdG9yZXMgKGR1cmluZyBvbmUgdHJhbnNhY3Rpb24pXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGFcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICAgICAqICAgQHBhcmFtIHtPYmplY3R9IHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAyICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnICYmIHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpO1xuICAgICAgICBjb25zdCBvYmpTdG9yZU5hbWVzID0gaXNNdWx0aSA/IE9iamVjdC5rZXlzKGFyZ3VtZW50c1swXSkgOiBbYXJndW1lbnRzWzBdXTtcblxuICAgICAgICBjb25zdCBhbGxPYmpTdG9yZXNFeGlzdCA9IGNoZWNrQ29udGFpbmluZ1N0b3Jlcy5jYWxsKHRoaXMsIG9ialN0b3JlTmFtZXMpO1xuICAgICAgICBpZiAoIWFsbE9ialN0b3Jlc0V4aXN0KSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgRGF0YWJhc2UgJHt0aGlzLmRhdGFiYXNlLm5hbWV9ICh2ZXJzaW9uICR7dGhpcy5kYXRhYmFzZS52ZXJzaW9ufSkgZG9lc24ndCBjb250YWluIGFsbCBuZWVkZWQgc3RvcmVzYCk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSB7fTtcbiAgICAgICAgbGV0IGRhdGEsIGFib3J0RXJyO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialN0b3JlTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAob2JqU3RvcmVOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHRbb2JqU3RvcmVOYW1lXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcblxuICAgICAgICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9IHRyYW5zYWN0aW9uLm9uZXJyb3IgPSB0cmFuc2FjdGlvbi5vbmFib3J0ID0gZnVuY3Rpb24gc2tsYWRDb25uZWN0aW9uX2dldF9vbkZpbmlzaChldnQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBhYm9ydEVyciB8fCBldnQudGFyZ2V0LmVycm9yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzU3VjY2VzcyA9ICFlcnIgJiYgZXZ0LnR5cGUgPT09ICdjb21wbGV0ZSc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNTdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaXNNdWx0aSA/IHJlc3VsdCA6IHJlc3VsdFtvYmpTdG9yZU5hbWVzWzBdXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucy5kaXJlY3Rpb24gfHwgc2tsYWRBUEkuQVNDO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gb3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIHdpbmRvdy5JREJLZXlSYW5nZSA/IG9wdGlvbnMucmFuZ2UgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgbGV0IHVzZUdldEFsbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBpdGVyYXRlUmVxdWVzdDtcblxuICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c09ialN0b3JlR2V0QWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZUdldEFsbCA9IE9iamVjdC5rZXlzKG9wdGlvbnMpLmV2ZXJ5KGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXkgPT09ICdsaW1pdCcgfHwga2V5ID09PSAncmFuZ2UnO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW9ialN0b3JlLmluZGV4TmFtZXMuY29udGFpbnMob3B0aW9ucy5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gbmV3IERPTUVycm9yKCdOb3RGb3VuZEVycm9yJywgYE9iamVjdCBzdG9yZSAke29ialN0b3JlLm5hbWV9IGRvZXNuJ3QgY29udGFpbiBcIiR7b3B0aW9ucy5pbmRleH1cIiBpbmRleGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGVSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkub3BlbkN1cnNvcihyYW5nZSwgZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHVzZUdldEFsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9JREJPYmplY3RTdG9yZS9nZXRBbGxcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ialN0b3JlLmdldEFsbChyYW5nZSwgb3B0aW9ucy5saW1pdCB8fCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkpLm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShyZXN1bHQsIG51bGwsICcgICAgJykpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGtleTogY3Vyc29yLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgdmFsdWU6IGN1cnNvci52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0RXJyID0gZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlcmF0ZVJlcXVlc3QgPSBvYmpTdG9yZS5vcGVuQ3Vyc29yKHJhbmdlLCBkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JQb3NpdGlvbk1vdmVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICBpdGVyYXRlUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGV2dC50YXJnZXQucmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnNvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMub2Zmc2V0ICYmICFjdXJzb3JQb3NpdGlvbk1vdmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JQb3NpdGlvbk1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvci5hZHZhbmNlKG9wdGlvbnMub2Zmc2V0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0ucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGN1cnNvci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3Vyc29yLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmxpbWl0ICYmIG9wdGlvbnMubGltaXQgPT09IHJlc3VsdFtvYmpTdG9yZU5hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIDEpIENvdW50IG9iamVjdHMgaW4gb25lIG9iamVjdCBzdG9yZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmpTdG9yZU5hbWUgbmFtZSBvZiBvYmplY3Qgc3RvcmVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAob3B0aW9uYWwpIG9iamVjdCB3aXRoIGtleXMgJ2luZGV4JyBvci9hbmQgJ3JhbmdlJ1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICogICBAcGFyYW0ge0RPTUVycm9yfSBbZXJyXSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gICAgICogICBAcGFyYW0ge051bWJlcn0gbnVtYmVyIG9mIHN0b3JlZCBvYmplY3RzIG90aGVyd2lzZVxuICAgICAqXG4gICAgICogMikgQ291bnQgb2JqZWN0cyBpbiBtdWx0aXBsZSBvYmplY3Qgc3RvcmVzIChkdXJpbmcgb25lIHRyYW5zYWN0aW9uKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKiAgIEBwYXJhbSB7RE9NRXJyb3J9IFtlcnJdIGlmIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAgICAgKiAgIEBwYXJhbSB7T2JqZWN0fSBudW1iZXIgb2Ygc3RvcmVkIG9iamVjdHMgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgY291bnQ6IGZ1bmN0aW9uIHNrbGFkQ29ubmVjdGlvbl9jb3VudCgpIHtcbiAgICAgICAgY29uc3QgaXNNdWx0aSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKTtcbiAgICAgICAgY29uc3Qgb2JqU3RvcmVOYW1lcyA9IGlzTXVsdGkgPyBPYmplY3Qua2V5cyhhcmd1bWVudHNbMF0pIDogW2FyZ3VtZW50c1swXV07XG4gICAgICAgIGxldCBkYXRhO1xuXG4gICAgICAgIGlmIChpc011bHRpKSB7XG4gICAgICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICAgICAgZGF0YVthcmd1bWVudHNbMF1dID0gKHR5cGVvZiBhcmd1bWVudHNbMV0gPT09ICdmdW5jdGlvbicpID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbE9ialN0b3Jlc0V4aXN0ID0gY2hlY2tDb250YWluaW5nU3RvcmVzLmNhbGwodGhpcywgb2JqU3RvcmVOYW1lcyk7XG4gICAgICAgIGlmICghYWxsT2JqU3RvcmVzRXhpc3QpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBET01FcnJvcignTm90Rm91bmRFcnJvcicsIGBEYXRhYmFzZSAke3RoaXMuZGF0YWJhc2UubmFtZX0gKHZlcnNpb24gJHt0aGlzLmRhdGFiYXNlLnZlcnNpb259KSBkb2Vzbid0IGNvbnRhaW4gYWxsIG5lZWRlZCBzdG9yZXNgKTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSB0aGlzLmRhdGFiYXNlLnRyYW5zYWN0aW9uKG9ialN0b3JlTmFtZXMsIFRSQU5TQUNUSU9OX1JFQURPTkxZKTtcbiAgICAgICAgICAgIGxldCBjb3VudFJlcXVlc3QsIGFib3J0RXJyO1xuXG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5vbmNvbXBsZXRlID0gdHJhbnNhY3Rpb24ub25lcnJvciA9IHRyYW5zYWN0aW9uLm9uYWJvcnQgPSBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY291bnRfb25GaW5pc2goZXZ0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gYWJvcnRFcnIgfHwgZXZ0LnRhcmdldC5lcnJvcjtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1N1Y2Nlc3MgPSAhZXJyICYmIGV2dC50eXBlID09PSAnY29tcGxldGUnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzU3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGlzTXVsdGkgPyByZXN1bHQgOiByZXN1bHRbb2JqU3RvcmVOYW1lc1swXV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGV2dC50eXBlID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAobGV0IG9ialN0b3JlTmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2JqU3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShvYmpTdG9yZU5hbWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkYXRhW29ialN0b3JlTmFtZV0gfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSAob3B0aW9ucy5yYW5nZSBpbnN0YW5jZW9mIHdpbmRvdy5JREJLZXlSYW5nZSkgPyBvcHRpb25zLnJhbmdlIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghb2JqU3RvcmUuaW5kZXhOYW1lcy5jb250YWlucyhvcHRpb25zLmluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBuZXcgRE9NRXJyb3IoJ05vdEZvdW5kRXJyb3InLCBgT2JqZWN0IHN0b3JlICR7b2JqU3RvcmUubmFtZX0gZG9lc24ndCBjb250YWluIFwiJHtvcHRpb25zLmluZGV4fVwiIGluZGV4YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0ID0gb2JqU3RvcmUuaW5kZXgob3B0aW9ucy5pbmRleCkuY291bnQocmFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnRFcnIgPSBleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudFJlcXVlc3QgPSBvYmpTdG9yZS5jb3VudChyYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydEVyciA9IGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY291bnRSZXF1ZXN0Lm9uc3VjY2VzcyA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W29ialN0b3JlTmFtZV0gPSBldnQudGFyZ2V0LnJlc3VsdCB8fCAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbG9zZSBJbmRleGVkREIgY29ubmVjdGlvblxuICAgICAqL1xuICAgIGNsb3NlOiBmdW5jdGlvbiBza2xhZENvbm5lY3Rpb25fY2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuZGF0YWJhc2U7XG4gICAgfVxufTtcblxuLyoqXG4gKiBPcGVucyBjb25uZWN0aW9uIHRvIGEgZGF0YWJhc2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZGJOYW1lIGRhdGFiYXNlIG5hbWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucyA9IHt9XSBjb25uZWN0aW9uIG9wdGlvbnNcbiAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy52ZXJzaW9uXSBkYXRhYmFzZSB2ZXJzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMubWlncmF0aW9uXSBtaWdyYXRpb24gc2NyaXB0c1xuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtPYmplY3R9IFtjb25uXSBpZiAtIHByb21pc2UgaXMgcmVzb2x2ZWRcbiAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gLSBpZiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKi9cbnNrbGFkQVBJLm9wZW4gPSBmdW5jdGlvbiBza2xhZF9vcGVuKGRiTmFtZSwgb3B0aW9ucyA9IHt2ZXJzaW9uOiAxfSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBET01FcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5Db25uUmVxdWVzdCA9IHdpbmRvdy5pbmRleGVkREIub3BlbihkYk5hbWUsIG9wdGlvbnMudmVyc2lvbik7XG4gICAgICAgIGxldCBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IGZhbHNlO1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uID0gb3B0aW9ucy5taWdyYXRpb24gfHwge307XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gZXZ0Lm9sZFZlcnNpb24gKyAxOyBpIDw9IGV2dC5uZXdWZXJzaW9uOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMubWlncmF0aW9uW2ldKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMubWlncmF0aW9uW2ldLmNhbGwodGhpcywgdGhpcy5yZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKGlzUmVzb2x2ZWRPclJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJlamVjdChldnQudGFyZ2V0LmVycm9yKTtcblxuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIG9wZW5Db25uUmVxdWVzdC5vbnN1Y2Nlc3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAoaXNSZXNvbHZlZE9yUmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGFiYXNlID0gdGhpcy5yZXN1bHQ7XG4gICAgICAgICAgICBjb25zdCBvbGRWZXJzaW9uID0gcGFyc2VJbnQoZGF0YWJhc2UudmVyc2lvbiB8fCAwLCAxMCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YWJhc2Uuc2V0VmVyc2lvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBvbGRWZXJzaW9uIDwgb3B0aW9ucy52ZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlVmVyUmVxdWVzdCA9IGRhdGFiYXNlLnNldFZlcnNpb24ob3B0aW9ucy52ZXJzaW9uKTtcblxuICAgICAgICAgICAgICAgIGNoYW5nZVZlclJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21VcGdyYWRlTmVlZGVkRXZ0ID0gbmV3IEV2ZW50KCd1cGdyYWRlbmVlZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQub2xkVmVyc2lvbiA9IG9sZFZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbVVwZ3JhZGVOZWVkZWRFdnQubmV3VmVyc2lvbiA9IG9wdGlvbnMudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9udXBncmFkZW5lZWRlZC5jYWxsKHtyZXN1bHQ6IGV2dC50YXJnZXQuc291cmNlfSwgY3VzdG9tVXBncmFkZU5lZWRlZEV2dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YWJhc2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgc2tsYWRBUEkub3BlbihkYk5hbWUsIG9wdGlvbnMpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgY2hhbmdlVmVyUmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBldnQudGFyZ2V0LmVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0LndlYmtpdEVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1vekVycm9yTWVzc2FnZSB8fCBldnQudGFyZ2V0Lm1zRXJyb3JNZXNzYWdlIHx8IGV2dC50YXJnZXQuZXJyb3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzb2x2ZShPYmplY3QuY3JlYXRlKHNrbGFkQ29ubmVjdGlvbiwge1xuICAgICAgICAgICAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkYXRhYmFzZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBpc1Jlc29sdmVkT3JSZWplY3RlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgb3BlbkNvbm5SZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmIChpc1Jlc29sdmVkT3JSZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIHJlamVjdChuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYCkpO1xuICAgICAgICAgICAgaXNSZXNvbHZlZE9yUmVqZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGRhdGFiYXNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRiTmFtZVxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqICAgQHBhcmFtIHtET01FcnJvcn0gW2Vycl0gaWYgcHJvbWlzZSBpcyByZWplY3RlZFxuICovXG5za2xhZEFQSS5kZWxldGVEYXRhYmFzZSA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlKGRiTmFtZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmICghd2luZG93LmluZGV4ZWREQikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBET01FcnJvcignTm90U3VwcG9ydGVkRXJyb3InLCAnWW91ciBicm93c2VyIGRvZXNuXFwndCBzdXBwb3J0IEluZGV4ZWREQicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG9wZW5EYlJlcXVlc3QgPSB3aW5kb3cuaW5kZXhlZERCLmRlbGV0ZURhdGFiYXNlKGRiTmFtZSk7XG5cbiAgICAgICAgb3BlbkRiUmVxdWVzdC5vbnN1Y2Nlc3MgPSBvcGVuRGJSZXF1ZXN0Lm9uZXJyb3IgPSBvcGVuRGJSZXF1ZXN0Lm9uYmxvY2tlZCA9IGZ1bmN0aW9uIHNrbGFkX2RlbGV0ZURhdGFiYXNlX29uRmluaXNoKGV2dCkge1xuICAgICAgICAgICAgY29uc3QgZXJyID0gKGV2dC50eXBlID09PSAnYmxvY2tlZCcpXG4gICAgICAgICAgICAgICAgPyBuZXcgRE9NRXJyb3IoJ0ludmFsaWRTdGF0ZUVycm9yJywgYERhdGFiYXNlICR7ZGJOYW1lfSBpcyBibG9ja2VkYClcbiAgICAgICAgICAgICAgICA6IGV2dC50YXJnZXQuZXJyb3I7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXZ0LnR5cGUgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xufTtcblxuc2tsYWRBUEkua2V5VmFsdWUgPSBmdW5jdGlvbiBza2xhZF9rZXlWYWx1ZShrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5jcmVhdGUoc2tsYWRLZXlWYWx1ZUNvbnRhaW5lciwge1xuICAgICAgICBrZXk6IHt2YWx1ZToga2V5LCBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2V9LFxuICAgICAgICB2YWx1ZToge3ZhbHVlOiB2YWx1ZSwgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlfVxuICAgIH0pO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgc2tsYWRBUEk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi9za2xhZC5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=