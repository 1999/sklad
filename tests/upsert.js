describe('Upsert operations', function () {
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

    describe('Errors tests', function () {
        beforeEach(openConnection);

        it('should produce DOMError.NotFoundError when wrong object stores are used', function (done) {
            conn.upsert({
                'missing_object_store': ['some', 'data']
            }).then(function () {
                done.fail('Upsert returns resolved promise');
            }).catch(function (err) {
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
            }).then(done).catch(function () {
                done.fail('Upsert returns rejected promise');
            });
        });

        it('should throw DOMError.InvalidStateError when wrong data is passed', function (done) {
            conn.upsert('keypath_true__keygen_false_2', 'string data').then(function () {
                done.fail('Upsert returns resolved promise');
            }).catch(function (err) {
                expect(err.name).toEqual('InvalidStateError');
                done();
            });
        });

        afterEach(closeConnection);
    });

    runCommonAddTests('upsert');
});
