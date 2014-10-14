describe('Close operation', function () {
    var dbName = 'dbName' + Math.random();

    it('should free IDBDatabase object after closing database', function (done) {
        sklad.open(dbName, function (err, connection) {
            expect(err).toBeFalsy();

            // close existing connection
            connection.close();
            expect(connection.database).toBeUndefined();

            done();
        });
    });
});
