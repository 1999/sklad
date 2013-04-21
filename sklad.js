(function (w) {
    w.indexedDB = w.indexedDB || w.mozIndexedDB || w.webkitIndexedDB || w.msIndexedDB;
    w.IDBTransaction = w.IDBTransaction || w.mozIDBTransaction || w.webkitIDBTransaction || w.msIDBTransaction;
    w.IDBKeyRange = w.IDBKeyRange || w.mozIDBKeyRange || w.webkitIDBKeyRange || w.msIDBKeyRange;

    // used to silence callbacks
    var emptyFunction = function () {};

    var async = {
        /**
         * Параллельное выполнение задач
         * @param {Object|Array} tasks пул задач в виде массива или объекта, где каждый элемент - это {Function}, которая принимает:
         *      * @param {Function} callback
         *
         * @param {Number} concurrency количество одновременно выполняемых операций (необязат.)
         * @param {Function} callback принимает:
         *      * @param {String|Null} err
         *      * @param {Object|Array} results
         *
         * @link https://npmjs.org/package/async#parallel
         */
        parallel: function async_parallel(tasks, concurrency, callback) {
            if (arguments.length === 2) {
                callback = concurrency;
                concurrency = 0;
            }

            var isNamedQueue = !Array.isArray(tasks);
            var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            var resultsData = isNamedQueue ? {} : [];

            if (!tasksKeys.length)
                return callback(null, resultsData);

            var tasksProcessedNum = 0;
            var tasksBeingProcessed = 0;
            var tasksTotalNum = tasksKeys.length;

            (function processTasks() {
                if (!tasksKeys.length || (concurrency && concurrency <= tasksBeingProcessed))
                    return;

                var taskIndex = tasksKeys.pop() || tasksKeys.length;
                tasksBeingProcessed += 1;

                tasks[taskIndex](function (err, data) {
                    tasksBeingProcessed -= 1;

                    if (err) {
                        var originalCallback = callback;
                        callback = function () { return true };

                        return originalCallback(err);
                    }

                    resultsData[taskIndex] = data;
                    tasksProcessedNum += 1;

                    if (tasksProcessedNum === tasksTotalNum)
                        return callback(null, resultsData);

                    processTasks();
                });

                processTasks();
            })();
        },

        /**
         * Последовательное выполнение задач
         * @param {Object|Array} tasks пул задач в виде массива или объекта, где каждый элемент - это {Function}, которая принимает:
         *      * @param {Function} callback
         *
         * @param {Function} callback принимает:
         *      * @param {String|Null} err
         *      * @param {Object|Array} results
         *
         * @link https://npmjs.org/package/async#series
         */
        series: function async_series(tasks, callback) {
            var isNamedQueue = !Array.isArray(tasks);
            var tasksKeys = isNamedQueue ? Object.keys(tasks) : new Array(tasks.length);
            var resultsData = isNamedQueue ? {} : [];

            if (!tasksKeys.length)
                return callback(null, resultsData);

            (function processTasks(numTasksProcessed) {
                if (numTasksProcessed === tasksKeys.length)
                    return callback(null, resultsData);

                var taskIndex = isNamedQueue ? tasksKeys[numTasksProcessed] : numTasksProcessed;
                tasks[taskIndex](function (err, data) {
                    if (err)
                        return callback(err);

                    resultsData[taskIndex] = data;
                    processTasks(++numTasksProcessed);
                });
            })(0);
        }
    };

    var skladConnection = {
        /**
         * Insert record to database
         * @param {String} objStoreName name of object store
         * @param {Mixed} obj object to be inserted
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         *    @param {String} inserted object key
         */
        insert: function skladConnection_insert(objStoreName, obj, key, callback) {
            if (typeof key === 'function') {
                callback = key;
                key = undefined;
            }

            if (!this.database.objectStoreNames.contains(objStoreName))
                return callback('Database ' + this.database.name + ' (version ' + this.database.version + ') doesn\'t contain "' + objStoreName + '" object store');

            var transaction;
            try {
                transaction = this.database.transaction(objStoreName, "readwrite");
            } catch (ex) {
                callback(ex);
                callback = emptyFunction;

                return;
            }
            
            transaction.oncomplete = function (evt) {
                callback(evt.target, objStore);
            };

            var objStore = transaction.objectStore(objStoreName);

            try {
                objStore.add(obj);
            } catch (ex) {
                callback(ex);
                callback = emptyFunction;
            }
        },

        /**
         * Update or insert record to database
         * @param {String} objStoreName name of object store
         * @param {Mixed} obj object to be inserted
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         *    @param {String} inserted object key
         */
        save: function skladConnection_save(objStoreName, obj, callback) {
            // same but save
        },

        /**
         * Delete record from database
         * @param {String} objStoreName name of object store
         * @param {String} key object's key
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        delete: function skladConnection_delete(objStoreName, key, callback) {
            // do smth
        },

        /**
         * Get object by its key path
         * @param {String} objStoreName name of object store
         * @param {String} keypath object's key
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         *    @param {Mixed} stored object
         */
        getObject: function skladConnection_getObject(objStoreName, keypath, callback) {
            // work with obj
        },

        /**
         * Get all objects from database
         * @param {String} objStoreName name of object store
         * @param {Object} options
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        getAll: function skladConnection_getAll(objStoreName, options, callback) {
            // do smth
        },

        /**
         * Get objects specified by index & range
         * @param {String} objStoreName name of object store
         * @param {String} indexName
         * @param {Object} options
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        query: function skladConnection_query(objStoreName, indexName, options, callback) {
            // do smth
        },

        /**
         * Create index on top of the object store
         * @param {String} objStoreName name of object store
         * @param {String} indexName
         * @param {Object} options
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        createIndex: function skladConnection_createIndex(objStoreName, indexName, options, callback) {
            // do smth
        },

        /**
         * Delete index from the the object store
         * @param {String} objStoreName name of object store
         * @param {String} indexName
         * @param {Function} callback invokes:
         *    @param {String|Null} err
         */
        deleteIndex: function skladConnection_deleteIndex(objStoreName, indexName, callback) {
            // do smth
        }
    };

    w.sklad = {
        /**
         * Opens a connection to a database
         * @param {String} dbName database name
         * @param {Object} options (optional) connection options with keys:
         *    {Number} version - database version
         *    {Object} migration - migration scripts
         * @param {Function} callback invokes
         *    @param {String|Null} err
         *    @param {Object} database
         */
        open: function (dbName, options, callback) {
            if (!w.indexedDB)
                return callback("Your browser doesn't support IndexedDB");

            if (typeof options === 'function') {
                callback = options;
                options = {};
            }

            options.version = options.version || 1;

            var openConnRequest = w.indexedDB.open(dbName, options.version);
            var migrationStarted = false;
            var isConnected = false;

            openConnRequest.onupgradeneeded = function (evt) {
                options.migration = options.migration || {};
                migrationStarted = true;

                var database = evt.target.result;
                var seriesTasks = {};

                for (var i = evt.oldVersion + 1; i <= evt.newVersion; i++) {
                    if (!options.migration[i])
                        continue;

                    seriesTasks[i] = options.migration[i].bind(database);
                }

                async.series(seriesTasks, function (err, results) {
                    if (err)
                        return callback('Failed while migrating database: ' + err);

                    if (isConnected) {
                        callback(null, Object.create(skladConnection, {
                            database: {
                                configurable: false,
                                enumerable: false,
                                value: database,
                                writable: false
                            }
                        }));
                    }

                    // change migration flag so "onsuccess" handler could invoke callback
                    migrationStarted = false;
                });
            };

            openConnRequest.onerror = function(evt) {
                callback('Failed to connect to database. Error code ' + evt.target.errorCode);
            };

            openConnRequest.onsuccess = function(evt) {
                if (migrationStarted) {
                    isConnected = true;
                    return;
                }

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
            };
        },

        // @todo https://developer.mozilla.org/en-US/docs/IndexedDB/IDBFactory#deleteDatabase
    };
})(window);
