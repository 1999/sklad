describe('Upsert operations', function () {
    var dbName = 'dbName' + Date.now();
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

    describe('Errors tests', function () {
        beforeEach(openConnection);

        it('should produce NotFoundError when wrong object stores are used', function (done) {
            conn.upsert({
                'missing_object_store': ['some', 'data']
            }, function (err) {
                expect(err instanceof DOMException).toEqual(true);
                expect(err.code).toEqual(DOMException.NOT_FOUND_ERR);

                done();
            });
        });

        it('should NOT throw DOMError when same unique keys are passed', function (done) {
            conn.upsert({
                'keypath_true__keygen_false_0': [
                    {name: 'Oli'},
                    {name: 'Lee'},
                    {name: 'Matt'},
                    {name: 'Matt'},
                    {name: 'Jordan'}
                ]
            }, function (err) {
                expect(err).toBeFalsy();
                done();
            });
        });

        it('should throw DOMError when wrong data is passed', function (done) {
            conn.upsert('keypath_true__keygen_false_2', 'string data', function (err, keys) {
                expect(err instanceof DOMError).toEqual(true);
                expect(err.name).toEqual('InvalidStateError');
                expect(err.message).toEqual('You must supply objects to be saved in the object store with set keyPath');

                done();
            });
        });

        afterEach(closeConnection);
    });

    runCommonAddTests('upsert');
});
