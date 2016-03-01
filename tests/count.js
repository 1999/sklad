describe('Count operations', function () {
    var conn;

    function openConnection(done) {
        var dbName = 'dbName' + Math.random();

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

    it('should produce Error with NotFoundError name field when wrong object stores are used', function (done) {
        conn.count('missing_object_store', 'some_key').then(function () {
            done.fail('Count returns resolved promise');
        }).catch(function (err) {
            expect(err instanceof Error).toBe(true);
            expect(err.name).toBe('NotFoundError');

            done();
        });
    });

    it('should produce Error with NotFoundError name field when missing index is used', function (done) {
        conn.count('keypath_true__keygen_false_0', {
            index: 'missing_index'
        }).then(function () {
            done.fail('Count returns resolved promise');
        }).catch(function (err) {
            expect(err instanceof Error).toBe(true);
            expect(err.name).toBe('NotFoundError');

            done();
        });;
    });

    it('should output 0 records when object store is empty', function (done) {
        conn.count('keypath_false__keygen_false_2').then(function (total) {
            expect(total).toBe(0);
            done();
        }).catch(function (err) {
            done.fail('Count returns rejected promise: ' + err.stack);
        });
    });

    describe('Count operations in one store', function () {
        var i = -1;

        beforeEach(function (done) {
            i += 1;

            var insertData = {};
            insertData['keypath_false__keygen_true_' + i] = [
                {'some_array_containing_field': 'Hi my name is my name is my name is Slim Shady'.split(' ')}
            ];

            conn.insert(insertData).then(done, done.fail);
        });

        it('should count all records', function (done) {
            conn.count('keypath_false__keygen_true_0').then(function (total) {
                expect(total).toBe(1);
                done();
            }).catch(function () {
                done.fail('Count returns rejected promise');
            });
        });

        it('should count all records within index', function (done) {
            conn.insert({
                keypath_true__keygen_false_0: [
                    {some_unique_key: 1, login: 'dsorin'},
                    {some_unique_key: 2, login: 'antipovs'},
                    {some_unique_key: 3, login: 'ixax'},
                    {some_unique_key: 4, login: 'go1664'},
                    {some_unique_key: 5, login: 'mar4uk'}
                ]
            }).then(function () {
                conn.count('keypath_true__keygen_false_0', {
                    index: 'sort_login',
                    range: IDBKeyRange.bound('d', 'iz')
                }).then(function (total) {
                    expect(total).toBe(3); // dsorin, go1664 and ixax
                    done();
                }).catch(function (err) {
                    done.fail('Count op returns rejected promise: ' + err.message);
                });
            }).catch(function (err) {
                done.fail('Insert op returns rejected promise: ' + err.message);
            });
        });
    });

    it('should count records in multiple stores', function (done) {
        conn.clear().then()

        conn.insert({
            'keypath_true__keygen_false_1': [
                {some_unique_key: 1},
                {some_unique_key: 2},
                {some_unique_key: 3}
            ]
        }).then(function () {
            conn.count({
                'keypath_true__keygen_true_0': null,
                'keypath_true__keygen_false_1': null
            }).then(function (total) {
                expect(total).toEqual({
                    keypath_true__keygen_true_0: 0,
                    keypath_true__keygen_false_1: 3
                });

                done();
            }).catch(function (err) {
                done.fail('Count returns rejected promise: ' + err.message);
            });
        }).catch(function (err) {
            done.fail('Insert returns rejected promise: ' + err.message);
        });
    });

    it('should count records in multiple stores with multiEntry index (skip IE)', function (done) {
        // IE11 and Microsoft Edge don't support multiEntry indexes
        // @see https://dev.windows.com/en-us/microsoft-edge/platform/status/indexeddbarraysandmultientrysupport
        if (is_ie_edge || is_explorer) {
            console.warn('IE doesn\'t support multiEntry indexes. Skip this test');
            done();
        }

        conn.insert({
            'keypath_false__keygen_true_2': [{
                'some_array_containing_field': 'One for the trouble Two for the bass Three to get ready Let\'s rock this place'.split(' ')
            }]
        }).then(function () {
            conn.count({
                'keypath_true__keygen_true_0': null,
                'keypath_false__keygen_true_2': {index: 'some_multi_index'}
            }).then(function (total) {
                expect(total).toEqual({
                    keypath_true__keygen_true_0: 0,
                    keypath_false__keygen_true_2: 14
                });

                done();
            }).catch(function (err) {
                done.fail('Count returns rejected promise: ' + err.message);
            });
        }).catch(function (err) {
            done.fail('Insert returns rejected promise: ' + err.message);
        });
    });

    afterEach(closeConnection);
});
