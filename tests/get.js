describe('Get operations', function () {
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

    beforeEach(openConnection);

    it('should produce DOMError.NotFoundError when wrong object stores are used', function (done) {
        conn.get('missing_object_store', {
            range: IDBKeyRange.only('some_key')
        }, function (err) {
            expect(err).toBeTruthy();
            expect(err.name).toBe('NotFoundError');

            done();
        });
    });

    it('should produce DOMError.IndexSizeError when missing index is used', function (done) {
        conn.get('keypath_true__keygen_false_0', {
            index: 'missing_index',
            range: IDBKeyRange.only('some_key')
        }, function (err) {
            expect(err).toBeTruthy();
            expect(err.name).toBe('IndexSizeError');

            done();
        });
    });

    describe('Get operations in one store', function () {
        var arr = 'Hi my name is my name is my name is Slim Shady'.split(' ');

        beforeEach(function (done) {
            conn.insert({
                'keypath_false__keygen_true_0': [
                    {'some_array_containing_field': arr}
                ],
                'keypath_true__keygen_false_0': [
                    {name: 'Dmitry', nickname: '1999'},
                    {name: 'Alex', nickname: 'Skiller'},
                    {name: 'Anton', nickname: 'Clon'},
                    {name: 'Leonid', nickname: 'Dollars'},
                    {name: 'Denis', nickname: 'win32'},
                    {name: 'Sergey', nickname: 'bizkid-e-burg'},
                    {name: 'Roman', nickname: 'Backenbart'},
                    {name: 'Alex', nickname: 'Yarex'},
                    {name: 'Anton', nickname: 'ukkk'}
                ]
            }, done);
        });

        it('should get all records without index', function (done) {
            conn.get('keypath_false__keygen_true_0', function (err, records) {
                expect(err).toBeFalsy();
                expect(Object.keys(records).length).toBe(1);

                var recordKey = Object.keys(records)[0];
                expect(records[recordKey]).toEqual(arr);

                done();
            });
        });

        it('should get all records without index and skip non-unique values', function (done) {
            conn.get('keypath_false__keygen_true_0', function (err, records) {
                expect(err).toBeFalsy();
                // FIXME / FEATURE_REQUEST: same key for many entries here

                done();
            });
        });

        it('should get all records within index', function (done) {
            conn.get('keypath_false__keygen_true_0', function (err, records) {
                expect(err).toBeFalsy();
                // FIXME / FEATURE_REQUEST: same key for many entries here

                done();
            });
        });

        it('should get all records within index in descending order', function (done) {
            conn.get('keypath_false__keygen_true_0', function (err, records) {
                expect(err).toBeFalsy();
                // FIXME / FEATURE_REQUEST: same key for many entries here

                done();
            });
        });

        it('should get limited number of records', function (done) {
            conn.get('keypath_false__keygen_true_0', function (err, records) {
                expect(err).toBeFalsy();
                // FIXME / FEATURE_REQUEST: same key for many entries here

                done();
            });
        });

        it('should get all records starting from offset', function (done) {
            conn.get('keypath_true__keygen_false_0', {
                offset: 3
                direction: sklad.ASC
            }, function (err, records) {
                expect(err).toBeFalsy();
                // FIXME / FEATURE_REQUEST: items in object are not sorted by default

                done();
            });
        });
    });

    // multiple

    afterEach(closeConnection);
});
