describe('Clear operations', function () {
    var dbName = 'dbName' + Math.random();
    var conn;

    function openConnection(cb) {
        openBaseConnection(dbName, function (connection) {
            conn = connection;
            cb();
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
        conn.clear('missing_object_store', function (err) {
            expect(err).toBeTruthy();
            expect(err.name).toEqual('NotFoundError');

            done();
        });
    });

    it('should clear one object store without errors', function (done) {
        conn.clear('keypath_true__keygen_false_0', function (err) {
            expect(err).toBeFalsy();
            done();
        });
    });

    it('should clear multiple object stores without errors', function (done) {
        conn.clear(['keypath_true__keygen_false_0', 'keypath_true__keygen_false_1'], function (err) {
            expect(err).toBeFalsy();
            done();
        });
    });

    it('should not fail if no callback is set', function (done) {
        conn.clear('keypath_true__keygen_false_0');
        setTimeout(done, 3000);
    });

    afterEach(closeConnection);
});
