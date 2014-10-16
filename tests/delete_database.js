describe('Delete database tests', function () {
    it('should delete database', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName, function (conn) {
            conn.close();

            sklad.deleteDatabase(dbName, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });
    });

    it('should produce DOMError.InvalidStateError if database is blocked', function (done) {
        var dbName = 'dbName' + Math.random();

        openBaseConnection(dbName, function (conn) {
            sklad.deleteDatabase(dbName, function (err) {
                expect(err.name).toBe('InvalidStateError');
                done();
            });
        });
    });
});
