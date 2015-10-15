describe('Delete database tests', function () {
    it('should delete database', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName, function (conn) {
            conn.close();

            sklad.deleteDatabase(dbName).then(done).catch(function () {
                done.fail('deleteDatabase returns rejected promise');
            });
        });
    });

    it('should produce DOMError.InvalidStateError if database is blocked', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName).then(function () {
            done.fail('Connect op failed: promise is resolved');
        }).catch(function (err) {
            expect(err.name).toBe('InvalidStateError');
            done();
        });
    });
});
