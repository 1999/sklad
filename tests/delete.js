describe('Delete operations', function () {
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
        conn.delete('missing_object_store', 'some_key').then(function () {
            done.fail('Delete returns resolved promise');
        }).catch(function (err) {
            expect(err instanceof Error).toBe(true);
            expect(err.name).toEqual('NotFoundError');
            done();
        });
    });

    it('should not throw error when missing key is passed', function (done) {
        conn.delete('keypath_true__keygen_false_2', 'missing_key').then(done).catch(function (err) {
            done.fail('Delete op returns rejected promise: ' + err.message + '\n' + err.stack);
        });
    });

    it('should delete records from one store', function (done) {
        conn.delete('keypath_true__keygen_false_0', 'whatever_key').then(done).catch(function (err) {
            done.fail('Delete op returns rejected promise: ' + err.message + '\n' + err.stack);
        });
    });

    it('should delete records from multiple stores', function (done) {
        conn.delete({
            'keypath_true__keygen_false_0': ['whatever_key', 1],
            'keypath_true__keygen_false_1': [
                'smth',
                'whatever_wherever'
            ]
        }).then(done).catch(function (err) {
            done.fail('Delete op returns rejected promise: ' + err.message + '\n' + err.stack);
        });
    });

    afterEach(closeConnection);
});
