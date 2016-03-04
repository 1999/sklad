describe('Clear operations', function () {
    var dbName;
    var conn;

    function openConnection(done) {
        dbName = 'dbName' + Math.random();

        openBaseConnection(dbName).then(function (connection) {
            conn = connection;
            done();
        }).catch(function () {
            done.fail('Open connection op failed');
        });
    }

    function closeConnection(done) {
        if (!conn) {
            done();
            return;
        }

        conn.close();
        conn = null;

        sklad.deleteDatabase(dbName).then(done).catch(function () {
            done();
        });
    }

    beforeEach(openConnection);

    it('should produce Error with NotFoundError name field when wrong object stores are used', function (done) {
        conn.clear('missing_object_store').then(function () {
            done.fail('Clear returns resolved promise');
        }).catch(function (err) {
            expect(err instanceof Error).toBe(true);
            expect(err.name).toEqual('NotFoundError');

            done();
        });
    });

    it('should clear one object store without errors', function (done) {
        conn.clear('keypath_true__keygen_false_0').then(done).catch(function (err) {
            done.fail('Clear returns rejected promise: ' + err.message + '\n' + err.stack);
        });
    });

    it('should clear multiple object stores without errors', function (done) {
        conn.clear(['keypath_true__keygen_false_0', 'keypath_true__keygen_false_1']).then(done).catch(function (err) {
            done.fail('Clear returns rejected promise: ' + err.message + '\n' + err.stack);
        });
    });

    afterEach(closeConnection);
});
