describe('Basic tests', function () {
    var dbName = 'dbName' + Math.random();
    var conn;

    it('global variables should exist', function () {
        expect(window.indexedDB).toBeDefined();
        expect(window.IDBTransaction).toBeDefined();
        expect(window.IDBKeyRange).toBeDefined();
        expect(window.IDBCursor).toBeDefined();
        expect(window.sklad).toBeDefined();

        expect(window.sklad.ASC).toBeDefined();
        expect(window.sklad.ASC_UNIQUE).toBeDefined();
        expect(window.sklad.DESC).toBeDefined();
        expect(window.sklad.DESC_UNIQUE).toBeDefined();
    });

    it('should connect to database', function (done) {
        sklad.open(dbName, function (err, connection) {
            expect(err).toBeFalsy();

            expect(typeof connection.insert).toBe('function');
            expect(typeof connection.upsert).toBe('function');
            expect(typeof connection.delete).toBe('function');
            expect(typeof connection.clear).toBe('function');
            expect(typeof connection.get).toBe('function');
            expect(typeof connection.count).toBe('function');
            expect(typeof connection.close).toBe('function');

            expect(connection.database instanceof window.IDBDatabase).toBe(true);
            expect(Object.getOwnPropertyDescriptor(connection, 'database')).toEqual({
                value: connection.database,
                enumerable: false,
                configurable: true,
                writable: false
            });

            // close existing connection
            conn = connection;

            done();
        });
    });

    it('should run migration code if database upgrades', function (done) {
        var migrationsRun = [];

        sklad.open(dbName, {
            version: 2,
            migration: {
                '1': function (database) {
                    // this migration part shoud not run at all
                    // because previous spec has already created 1st version of databse
                    migrationsRun.push('current database version migration');
                },
                '2': function (database) {
                    migrationsRun.push('new database version migration');
                    expect(database instanceof window.IDBDatabase).toBe(true);

                    var objStore = database.createObjectStore('some_object_store', {keyPath: 'date'});
                    expect(objStore instanceof window.IDBObjectStore).toBe(true);
                }
            }
        }, function (err, connection) {
            expect(err).toBeFalsy();

            expect(migrationsRun).not.toContain('current database version migration');
            expect(migrationsRun).toContain('new database version migration');

            // close existing connection
            conn = connection;

            done();
        });
    });

    afterEach(function () {
        if (conn) {
            // otherwise 'blocked' event will be caught
            // FIXME: handle it
            conn.close();
            conn = null;
        }
    });
});
