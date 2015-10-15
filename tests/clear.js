describe('Clear operations', function () {
    var dbName = 'dbName' + Math.random();
    var conn;

    function openConnection(done) {
        openBaseConnection(dbName).then(function (connection) {
            conn = connection;
            done();
        }).catch(function () {
            done.fail('Open connection op failed');
        });
    }

    function closeConnection(cb) {
        if (conn) {
            conn.close();
            conn = null;

            cb();
        }
    }

    beforeEach(openConnection);

    it('should produce DOMError.NotFoundError when wrong object stores are used', function (done) {
        conn.clear('missing_object_store').then(function () {
            done.fail('Clear returns resolved promise');
        }).catch(function (err) {
            expect(err).toBeTruthy();
            expect(err.name).toEqual('NotFoundError');

            done();
        });
    });

    it('should clear one object store without errors', function (done) {
        conn.clear('keypath_true__keygen_false_0').then(done).catch(function (err) {
            done.fail('Clear returns rejected promise');
        });
    });

    it('should clear multiple object stores without errors', function (done) {
        conn.clear(['keypath_true__keygen_false_0', 'keypath_true__keygen_false_1']).then(done).catch(function (err) {
            done.fail('Clear returns rejected promise');
        });
    });

    afterEach(closeConnection);
});
