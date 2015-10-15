describe('Database block tests', function () {
    var dbName = 'dbName' + Math.random();
    var conn;

    it('should connect to database', function (done) {
        sklad.open(dbName).then(function (connection) {
            conn = connection;
            done();
        }).catch(function () {
            done.fail('Open returns rejected promise');
        });
    });

    it('should return DOMError.InvalidStateError when database is blocked', function (done) {
        sklad.open(dbName, {
            version: 2,
            migration: {
                '2': function () {
                    throw new Error('This code should not execute');
                }
            }
        }).then(function () {
            done.fail('Open returns resolved promise');
        }).catch(function (err) {
            expect(err.name).toBe('InvalidStateError');

            // migration code should not execute even if blocked database is closed
            // this behaviour differs from native IndexedDB implementation
            conn.close();

            done();
        });
    });
});
