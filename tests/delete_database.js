describe('Delete database tests', function () {
    it('should delete database', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName).then(function (conn) {
            conn.close();

            sklad.deleteDatabase(dbName).then(done).catch(function () {
                done.fail('deleteDatabase returns rejected promise');
            });
        }).catch(function () {
            done.fail('Open connection op failed');
        });
    });

    it('should produce Error with InvalidStateError name field if database is blocked', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName).then(function () {
            sklad.deleteDatabase(dbName).then(function () {
                done.fail('Delete database promise is resolved');
            }).catch(function (err) {
                expect(err instanceof Error).toBe(true);
                expect(err.name).toBe('InvalidStateError');
                done();
            });
        }).catch(function () {
            done.fail('Open connection op failed');
        });
    });
});
