describe('Insert operations', function () {
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

        it('should produce DOMError.NotFoundError when wrong object stores are used', function (done) {
            conn.insert({
                'missing_object_store': ['some', 'data']
            }, function (err) {
                expect(err).toBeTruthy();
                expect(err.name).toBe('NotFoundError');

                done();
            });
        });

        it('should produce DOMError.InvalidStateError when wrong data is passed', function (done) {
            conn.insert('keypath_true__keygen_false_2', 'string data', function (err, insertedKeys) {
                expect(err).toBeTruthy();
                expect(err.name).toEqual(DOMError.InvalidStateError);

                done();
            });
        });

        it('should produce DOMError.IndexSizeError when same unique keys are passed', function (done) {
            conn.insert({
                'keypath_true__keygen_false_0': [
                    {name: 'Oli'},
                    {name: 'Lee'},
                    {name: 'Matt'},
                    {name: 'Matt'},
                    {name: 'Jordan'}
                ]
            }, function (err) {
                expect(err).toBeTruthy();
                expect(err.name).toBe('IndexSizeError');

                done();
            });
        });

        afterEach(closeConnection);
    });

    runCommonAddTests('insert');
});
