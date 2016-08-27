describe('Basic open tests', function () {
    var dbName = 'dbName' + Math.random();

    it('should connect to database', function (done) {
        sklad.open(dbName).then(function (connection) {
            connection.close();
            done();
        }).catch(function () {
            done.fail('Open returns rejected promise');
        });
    });

    it('should run migration code if database upgrades', function (done) {
        var migrationsRun = [];

        sklad.open(dbName, {
            version: 2,
            migration: {
                '1': function () {
                    // this migration part should not run at all
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
        }).then(function (connection) {
            expect(migrationsRun).not.toContain('current database version migration');
            expect(migrationsRun).toContain('new database version migration');

            connection.close();
            done();
        }).catch(function () {
            done.fail('Open returns rejected promise');
        });
    });
});
