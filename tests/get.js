describe('Get operations', function () {
    var dbName = 'dbName' + Math.random();
    var conn;

    function openConnection(done) {
        openBaseConnection(dbName).then(function (connection) {
            conn = connection;
            done();
        }).catch(function (err) {
            done.fail(`Open connection op failed: ${err.stack}`);
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
        }).then(function () {
            done.fail('Get returns resolved promise');
        }).catch(function (err) {
            expect(err.name).toBe('NotFoundError');
            done();
        });
    });

    it('should produce DOMError.NotFoundError when missing index is used', function (done) {
        conn.get('keypath_true__keygen_false_0', {
            index: 'missing_index',
            range: IDBKeyRange.only('some_key')
        }).then(function () {
            done.fail('Get returns resolved promise');
        }).catch(function (err) {
            expect(err.name).toBe('NotFoundError');
            done();
        });
    });

    describe('Get operations in one store', function () {
        var arr = 'Hi my name is my name is my name is Slim Shady'.split(' ');
        var i = 0;
        var arrUniqueSorted = arr.reduce(function (previousValue, currentValue) {
            if (previousValue.indexOf(currentValue) === -1) {
                previousValue.push(currentValue);
            }

            return previousValue;
        }, []).sort();

        beforeEach(function (done) {
            if (i > 0) {
                done();
                return;
            }

            i += 1;
            conn.insert({
                'keypath_false__keygen_true_0': [
                    {'some_array_containing_field': arr}
                ],
                'keypath_true__keygen_false_0': [
                    {name: 'Dmitry', login: '1999'},
                    {name: 'Alex', login: 'Skiller'},
                    {name: 'Anton', login: 'Clon'},
                    {name: 'Leonid', login: 'Dollars'},
                    {name: 'Denis', login: 'win32'},
                    {name: 'Sergey', login: 'bizkid-e-burg'},
                    {name: 'Roman', login: 'Backenbart'},
                    {name: 'Alex', login: 'Yarex'},
                    {name: 'Anton', login: 'ukkk'}
                ]
            }).then(done).catch(function (err) {
                done.fail(`Insert returns rejected promise: ${err.stack}`);
            });
        });

        it('should get all records without index', function (done) {
            conn.get('keypath_false__keygen_true_0').then(function (records) {
                expect(Object.keys(records).length).toBe(1);

                var recordKey = Object.keys(records)[0];
                expect(records).toEqual([{
                    key: 1,
                    value: {
                        some_array_containing_field: arr
                    }
                }]);

                done();
            }).catch(function (err) {
                done.fail(`Get returns rejected promise: ${err.stack}`);
            });
        });

        it('should get all records within index', function (done) {
            conn.get('keypath_false__keygen_true_0', {
                index: 'some_multi_index'
            }).then(function (records) {
                // records should be array
                // each element should be an object, which `key` should be one of array unique values
                // and `value` should be a whole array

                // filter non-unique values and sort values
                var expectation = arrUniqueSorted.map(function (key) {
                    return {
                        key: key,
                        value: {
                            some_array_containing_field: arr
                        }
                    };
                });

                expect(records).toEqual(expectation);
                done();
            }).catch(function (err) {
                done.fail(`Get returns rejected promise: ${err.stack}`);
            });
        });

        it('should get all records without explicitly set index and skip non-unique values', function (done) {
            conn.get('keypath_true__keygen_false_0', {
                direction: sklad.ASC_UNIQUE,
                index: 'sort_name'
            }).then(function (records) {
                expect(records.length).toBe(7);
                done();
            }).catch(function (err) {
                done.fail(`Get returns rejected promise: ${err.stack}`);
            });
        });

        it('should get all records within index in descending order', function (done) {
            conn.get('keypath_false__keygen_true_0', {
                index: 'some_multi_index',
                direction: sklad.DESC
            }).then(function (records) {
                var expectation = arrUniqueSorted.reverse().map(function (key) {
                    return {
                        key: key,
                        value: {
                            some_array_containing_field: arr
                        }
                    };
                });

                expect(records).toEqual(expectation);
                done();
            }).catch(function (err) {
                done.fail(`Get returns rejected promise: ${err.stack}`);
            });
        });

        it('should get limited number of records starting from offset', function (done) {
            conn.get('keypath_true__keygen_false_0', {
                index: 'sort_name',
                limit: 4,
                offset: 1
            }).then(function (records) {
                expect(records.length).toBe(4);

                expect(records.map(function (record) {
                    return record.key;
                })).toEqual(['Alex', 'Anton', 'Anton', 'Denis'])

                done();
            }).catch(function (err) {
                done.fail(`Get returns rejected promise: ${err.stack}`);
            });
        });
    });

    // multiple

    afterEach(closeConnection);
});
