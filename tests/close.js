describe('Close operation', function () {
    var dbName = 'dbName' + Math.random();

    it('should free IDBDatabase object after closing database', function (done) {
        sklad.open(dbName).then(function (connection) {
            // close existing connection
            connection.close();
            expect(connection.database).toBeUndefined();

            done();
        }).catch(function (err) {
            done.fail('Open returns rejected promise');
        });
    });
});
