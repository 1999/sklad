describe('Upsert operations', function () {
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

    describe('Errors tests', function () {
        beforeEach(openConnection);

        it('should produce DOMError.NotFoundError when wrong object stores are used', function (done) {
            conn.upsert({
                'missing_object_store': ['some', 'data']
            }, function (err) {
                expect(err).toBeTruthy();
                expect(err.name).toEqual('NotFoundError');

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

        it('should throw DOMError.InvalidStateError when wrong data is passed', function (done) {
            conn.upsert('keypath_true__keygen_false_2', 'string data', function (err, keys) {
                expect(err).toBeTruthy();
                expect(err.name).toEqual('InvalidStateError');

                done();
            });
        });

        afterEach(closeConnection);
    });

    runCommonAddTests('upsert');
});
