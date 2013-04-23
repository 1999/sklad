(function () {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.mozIDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    window.IDBCursor = window.IDBCursor || window.mozIDBCursor || window.webkitIDBCursor || window.msIDBCursor;

    var TRANSACTION_READONLY = window.IDBTransaction.READ_ONLY || 'readonly';
    var TRANSACTION_READWRITE = window.IDBTransaction.READ_WRITE || 'readwrite';

    window.sklad = {};
    window.sklad.ITERATE_NEXT = window.IDBCursor.NEXT || 'next';
    window.sklad.ITERATE_NEXTUNIQUE = window.IDBCursor.NEXT_NO_DUPLICATE || 'nextunique';
    window.sklad.ITERATE_PREV = window.IDBCursor.PREV || 'prev';
    window.sklad.ITERATE_PREVUNIQUE = window.IDBCursor.PREV_NO_DUPLICATE || 'prevunique';

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

    // @todo multiple records insert operation
    // @todo multiple stores get operation inside one transaction
    // @todo how to create indicies on existing object store / delete them?

    var skladConnection = {
        /**
         * Insert record to the database
         *
         * @param {String} objStoreName name of object store
         * @param {Mixed} key (optional) object key
         * @param {Mixed} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {String} inserted object key
         */
        insert: function skladConnection_insert(objStoreName, key, data, callback) {
            if (typeof data === 'function') {
                callback = data;
                data = key;
                key = undefined;
            }

            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store'));
            
            var transaction;
            var addObjRequest;

            try {
                transaction = this.database.transaction(objStoreName, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            var objStore = transaction.objectStore(objStoreName);

            // check the data according to this table
            // @see https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database
            if (objStore.keyPath === null) {
                if (!objStore.autoIncrement) {
                    key = key || uuid();
                }
            } else {
                if (typeof data !== 'object') {
                    return callback(new Error('You must supply an object to be saved in the "' + objStore.name + '" object store'));
                }

                if (!objStore.autoIncrement) {
                    data[objStore.keyPath] = data[objStore.keyPath] || uuid();
                }
            }

            try {
                var args = (key !== undefined) ? [data, key] : [data];
                addObjRequest = objStore.add.apply(objStore, args);
            } catch (ex) {
                return callback(ex);
            }

            addObjRequest.onsuccess = function(evt) {
                callback(null, evt.target.result);
            };

            addObjRequest.onerror = function(evt) {
                callback(addObjRequest.error);
            };
        },

        /**
         * Insert or update record in the database
         * 
         * @param {String} objStoreName name of object store
         * @param {Mixed} key (optional) object key
         * @param {Mixed} data
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         *    @param {String} saved object key
         */
        upsert: function skladConnection_upsert(objStoreName, key, data, callback) {
            if (typeof data === 'function') {
                callback = data;
                data = key;
                key = undefined;
            }

            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store'));

            var transaction;
            var upsertObjRequest;

            try {
                transaction = this.database.transaction(objStoreName, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            var objStore = transaction.objectStore(objStoreName);

            // check the data according to this table
            // @see https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database
            if (objStore.keyPath === null) {
                if (!objStore.autoIncrement) {
                    key = key || uuid();
                }
            } else {
                if (typeof data !== 'object') {
                    return callback(new Error('You must supply an object to be saved in the "' + objStore.name + '" object store'));
                }

                if (!objStore.autoIncrement) {
                    data[objStore.keyPath] = data[objStore.keyPath] || uuid();
                }
            }

            try {
                var args = (key !== undefined) ? [data, key] : [data];
                upsertObjRequest = objStore.put.apply(objStore, args);
            } catch (ex) {
                return callback(ex);
            }

            upsertObjRequest.onsuccess = function(evt) {
                callback(null, evt.target.result);
            };

            upsertObjRequest.onerror = function(evt) {
                callback(upsertObjRequest.error);
            };
        },

        /**
         * Delete record from the database
         *
         * @param {String} objStoreName name of object store
         * @param {String} key object's key
         * @param {Function} callback invokes:
         *    @param {Error|Null} err
         */
        delete: function skladConnection_delete(objStoreName, key, callback) {
            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback(new Error('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store'));

            var transaction;
            var deleteObjRequest;

            try {
                transaction = this.database.transaction(objStoreName, TRANSACTION_READWRITE);
            } catch (ex) {
                return callback(ex);
            }

            var objStore = transaction.objectStore(objStoreName);

            try {
                deleteObjRequest = objStore.delete(key);
            } catch (ex) {
                return callback(ex);
            }

            deleteObjRequest.onsuccess = function(evt) {
                callback();
            };

            deleteObjRequest.onerror = function(evt) {
                callback(deleteObjRequest.error);
            };
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

                if (!objectsGot && options.offset)
                    return cursor.advance(options.offset);

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
     *    @param {Error|Null} err
     *    @param {Object} database
     */
    window.sklad.open = function sklad_open(dbName, options, callback) {
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

        openConnRequest.onerror = function(evt) {
            callback(evt.target.error);
        };

        openConnRequest.onsuccess = function(evt) {
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
})();
