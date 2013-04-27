(function () {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.mozIDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    window.IDBCursor = window.IDBCursor || window.mozIDBCursor || window.webkitIDBCursor || window.msIDBCursor;

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
    var uuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = (c == 'x') ? r : (r&0x3|0x8);

            return v.toString(16);
        });
    };

    // @todo describe
    var skladKeyValueContainer = Object.create(null, {
        isPrototypeOf: Object.getOwnPropertyDescriptor(Object.prototype, 'isPrototypeOf')
    });

    /**
     * @todo descrive
     * @return {Boolean} false if saved data type is incorrect, otherwise {Array} object store function arguments
     */
    var checkSavedData = function (objStore, data) {
        var keyValueContainer = skladKeyValueContainer.isPrototypeOf(data);
        var key = keyValueContainer ? data.key : null;
        var value = keyValueContainer ? data.value : data;

        if (objStore.keyPath === null) {
            if (!objStore.autoIncrement) {
                key = key || uuid();
            }
        } else {
            if (typeof data !== 'object')
                return false;

            if (!objStore.autoIncrement) {
                data[objStore.keyPath] = data[objStore.keyPath] || uuid();
            }
        }

        return key ? [value, key] : [value];
    };

    // @todo multiple stores get operation inside one transaction
    // @todo how to create indicies on existing object store / delete them?

    // @todo describe
    var skladConnection = {
        /**
         * 1) Insert one record into the object store
         * @param {String} objStoreName name of object store
         * @param {Mixed} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {Mixed} inserted object key
         *
         * 2) Insert multiple records into the object stores
         * @param {Object} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {Object} inserted objects' keys
         */
        insert: function skladConnection_insert() {
            var multiInsert = (arguments.length === 2);
            var objStoreNames = multiInsert ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = multiInsert ? arguments[1] : arguments[2];
            var contains = this.database.objectStoreNames.contains.bind(this.database.objectStoreNames);
            var result = {};
            var transaction, data;
            var objStore, i, checkedData;

            if (!objStoreNames.every(contains))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed object stores'));

            if (multiInsert) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = [arguments[1]];
            }

            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            transaction.oncomplete = function (evt) {
                callback(null, multiInsert ? result : result[objStoreNames[0]][0]);
            };

            transaction.onabort = function (evt) {
                callback('You must supply objects to be saved in the object store with set keyPath');
            };

            transaction.onerror = function (evt) {
                var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                callback('Transaction error: ' + err);
            };

            stuff: {
                for (var objStoreName in data) {
                    objStore = transaction.objectStore(objStoreName);
                    for (i = 0; i < data[objStoreName].length; i++) {
                        checkedData = checkSavedData(objStore, data[objStoreName][i]);
                        if (!checkedData) {
                            transaction.abort();
                            break stuff;
                        }

                        (function (objStoreName, i) {
                            objStore.add.apply(objStore, checkedData).onsuccess = function (evt) {
                                result[objStoreName] = result[objStoreName] || [];
                                result[objStoreName][i] = evt.target.result;
                            };
                        })(objStoreName, i);
                    }
                }
            }
        },

        /**
         * 1) Insert or update one record into the object store
         * @param {String} objStoreName name of object store
         * @param {Mixed} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {Mixed} inserted object key
         *
         * 2) Insert or update multiple records into the object stores
         * @param {Object} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {Object} inserted objects' keys
         */
        upsert: function skladConnection_upsert() {
            var multiUpsert = (arguments.length === 2);
            var objStoreNames = multiUpsert ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = multiUpsert ? arguments[1] : arguments[2];
            var contains = this.database.objectStoreNames.contains.bind(this.database.objectStoreNames);
            var result = {};
            var transaction, data;
            var objStore, i, checkedData;

            if (!objStoreNames.every(contains))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed object stores'));

            if (multiUpsert) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = [arguments[1]];
            }

            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            transaction.oncomplete = function (evt) {
                callback(null, multiUpsert ? result : result[objStoreNames[0]][0]);
            };

            transaction.onabort = function (evt) {
                callback('You must supply objects to be saved in the object store with set keyPath');
            };

            transaction.onerror = function (evt) {
                var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                callback('Transaction error: ' + err);
            };

            stuff: {
                for (var objStoreName in data) {
                    objStore = transaction.objectStore(objStoreName);
                    for (i = 0; i < data[objStoreName].length; i++) {
                        checkedData = checkSavedData(objStore, data[objStoreName][i]);
                        if (!checkedData) {
                            transaction.abort();
                            break stuff;
                        }

                        (function (objStoreName, i) {
                            objStore.put.apply(objStore, checkedData).onsuccess = function (evt) {
                                result[objStoreName] = result[objStoreName] || [];
                                result[objStoreName][i] = evt.target.result;
                            };
                        })(objStoreName, i);
                    }
                }
            }
        },

        /**
         * 1) Delete one record from the object store
         * @param {String} objStoreName name of object store
         * @param {Mixed} key
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *
         * 2) Delete multiple records from the object stores
         * @param {Object} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         */
        delete: function skladConnection_delete() {
            var multiDelete = (arguments.length === 2);
            var objStoreNames = multiDelete ? Object.keys(arguments[0]) : [arguments[0]];
            var callback = multiDelete ? arguments[1] : arguments[2];
            var contains = this.database.objectStoreNames.contains.bind(this.database.objectStoreNames);
            var transaction, data;
            var objStore, i;

            if (!objStoreNames.every(contains))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain all needed object stores'));

            if (multiDelete) {
                data = arguments[0];
            } else {
                data = {};
                data[arguments[0]] = [arguments[1]];
            }

            try {
                transaction = this.database.transaction(objStoreNames, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            transaction.oncomplete = function (evt) {
                callback();
            };

            transaction.onerror = function (evt) {
                var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
                callback('Transaction error: ' + err);
            };

            for (var objStoreName in data) {
                objStore = transaction.objectStore(objStoreName);
                for (i = 0; i < data[objStoreName].length; i++) {
                    objStore.delete(data[objStoreName][i]);
                }
            }
        },

        /**
         * Get objects from the database
         *
         * @param {String} objStoreName name of object store
         * @param {Object} options object with keys 'index', 'range', 'offset', 'limit' and 'direction'
         * @param {Function} callback invokes:
         *      @param {Error|Null} err
         *      @param {Object} stored objects
         */
        get: function skladConnection_get(objStoreName, options, callback) {
            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store'));

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            var transaction;

            try {
                transaction = this.database.transaction(objStoreName, TRANSACTION_READONLY);
            } catch (ex) {
                return callback(ex);
            }

            var objStore = transaction.objectStore(objStoreName);
            var direction = options.direction || window.sklad.ITERATE_NEXT;
            var objects = {};
            var objectsGot = 0;
            var cursorPositionMoved = false;
            var iterateRequest;

            var range = (options.range && options.range instanceof window.IDBKeyRange)
                ? options.range
                : null;

            if (options.index) {
                if (!objStore.indexNames.contains(options.index))
                    return callback(new Error('Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index'));

                try {
                    iterateRequest = objStore.index(options.index).openCursor(range, direction);
                } catch (ex) {
                    return callback(ex);
                }
            } else {
                try {
                    iterateRequest = objStore.openCursor(range, direction);
                } catch (ex) {
                    return callback(ex);
                }
            }

            iterateRequest.onsuccess = function (evt) {
                var cursor = evt.target.result;

                if (!cursor)
                    return callback(null, objects);

                if (options.offset && !cursorPositionMoved) {
                    cursorPositionMoved = true;
                    return cursor.advance(options.offset);
                }

                objects[cursor.key] = cursor.value;
                objectsGot += 1;

                if (options.limit === objectsGot)
                    return callback(null, objects);

                cursor.continue();
            };

            iterateRequest.onerror = function (evt) {
                callback(iterateRequest.error);
            };
        },

        /**
         * Count objects in the database
         *
         * @param {String} objStoreName name of object store
         * @param {Object} options object with keys 'index' and 'range'
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {Number} number of stored objects
         */
        count: function skladConnection_count(objStoreName, options, callback) {
            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store'));

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            var transaction;

            try {
                transaction = this.database.transaction(objStoreName, TRANSACTION_READONLY);
            } catch (ex) {
                return callback(ex);
            }

            var objStore = transaction.objectStore(objStoreName);
            var countRequest;

            var range = (options.range && options.range instanceof window.IDBKeyRange)
                ? options.range
                : null;

            if (options.index) {
                if (!objStore.indexNames.contains(options.index))
                    return callback(new Error('Object store ' + objStore.name + ' doesn\'t contain "' + options.index + '" index'));

                try {
                    countRequest = objStore.index(options.index).count(range);
                } catch (ex) {
                    return callback(ex);
                }
            } else {
                try {
                    countRequest = objStore.count(range);
                } catch (ex) {
                    return callback(ex);
                }
            }

            countRequest.onsuccess = function (evt) {
                callback(null, evt.target.result);
            };

            countRequest.onerror = function (evt) {
                callback(countRequest.error);
            };
        }
    };

    

    /**
     * Opens a connection to a database
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
        if (!window.indexedDB)
            return callback(new Error('Your browser doesn\'t support IndexedDB'));

        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        options.version = options.version || 1;

        var openConnRequest = window.indexedDB.open(dbName, options.version);
        openConnRequest.onupgradeneeded = function (evt) {
            options.migration = options.migration || {};

            for (var i = evt.oldVersion + 1; i <= evt.newVersion; i++) {
                if (!options.migration[i])
                    continue;

                options.migration[i](evt.target.result);
            }
        };

        openConnRequest.onerror = function (evt) {
            var err = evt.target.errorMessage || evt.target.webkitErrorMessage || evt.target.mozErrorMessage || evt.target.msErrorMessage || evt.target.error.name;
            callback(err);
        };

        openConnRequest.onsuccess = function (evt) {
            callback(null, Object.create(skladConnection, {
                database: {
                    configurable: false,
                    enumerable: false,
                    value: evt.target.result,
                    writable: false
                }
            }));
        };

        openConnRequest.onblocked = function(evt) {
            // If some other tab is loaded with the database, then it needs to be closed
            // before we can proceed.
            // @todo
            console.log('blocked');
        };
    };

    skladAPI.keyValue = function (key, value) {
        return Object.create(skladKeyValueContainer, {
            key: {value: key, configurable: false, writable: false},
            value: {value: value, configurable: false, writable: false}
        });
    };

    window.sklad = skladAPI;
})();
