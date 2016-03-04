describe('Upsert operations', function () {
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

    describe('Errors tests', function () {
        beforeEach(openConnection);

        it('should produce Error with NotFoundError name field when wrong object stores are used', function (done) {
            conn.upsert({
                'missing_object_store': ['some', 'data']
            }).then(function () {
                done.fail('Upsert returns resolved promise');
            }).catch(function (err) {
                expect(err instanceof Error).toBe(true);
                expect(err.name).toEqual('NotFoundError');
                done();
            });
        });

        it('should NOT throw Error when same unique keys are passed', function (done) {
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

        it('should throw Error with InvalidStateError name field when wrong data is passed', function (done) {
            conn.upsert('keypath_true__keygen_false_2', 'string data').then(function () {
                done.fail('Upsert returns resolved promise');
            }).catch(function (err) {
                expect(err instanceof Error).toBe(true);
                expect(err.name).toEqual('InvalidStateError');
                done();
            });
        });

        afterEach(closeConnection);
    });

    runCommonAddTests('upsert');
});
