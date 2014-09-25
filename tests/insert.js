describe('Insert operations', function () {
    var dbName = 'dbName' + Date.now();
    var conn;

    function isValidID(id) {
        return /[\w]{8}\-[\w]{4}\-4[\w]{3}\-[\w]{4}\-[\w]{12}/.test(id);
    }

    function openConnection(cb) {
        sklad.open(dbName, {
            version: 1,
            migration: {
                '1': function (database) {
                    // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.createObjectStore
                    // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore.createIndex
                    for (var i = 0; i < 3; i++) {
                        var objStore = database.createObjectStore('keypath_true__keygen_false_' + i, {keyPath: 'name'});
                        objStore.createIndex('sort_name', 'name', {unique: true});
                    }

                    for (var i = 0; i < 3; i++) {
                        var objStore = database.createObjectStore('keypath_false__keygen_true_' + i, {autoIncrement: true});
                        objStore.createIndex('some_index', 'some_field');
                        objStore.createIndex('some_multi_index', 'some_array_containing_field', {multiEntry: true});
                    }

                    for (var i = 0; i < 3; i++) {
                        var objStore = database.createObjectStore('keypath_true__keygen_true_' + i, {keyPath: 'name', autoIncrement: true});
                    }

                    for (var i = 0; i < 3; i++) {
                        var objStore = database.createObjectStore('keypath_false__keygen_false_' + i);
                        objStore.createIndex('sort_field_foo', 'foo');
                    }
                }
            }
        }, function (err, connection) {
            if (err) {
                throw err;
            }

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

    describe('Common tests', function () {
        beforeEach(openConnection);

        it('should insert multiple records into one database', function (done) {
            conn.insert({
                'keypath_true__keygen_false_1': [
                    {name: 'Fred'},
                    {name: 'Sam'},
                    {name: 'John'},
                    {name: 'Wes'},
                    {name: 'Lee'}
                ]
            }, function (err, insertedKeys) {
                expect(err).toBeFalsy();
                expect(insertedKeys).toEqual({
                    'keypath_true__keygen_false_1': ['Fred', 'Sam', 'John', 'Wes', 'Lee']
                });

                done();
            });
        });

        it('should insert multiple records into multiple databases', function (done) {
            var insertData = {
                'keypath_true__keygen_false_0': [
                    {name: 'Tom'},
                    {name: 'Dan'},
                    {name: 'Sam'},
                    {name: 'Alex'}
                ],
                'keypath_true__keygen_false_1': [
                    {name: 'Koie'},
                    {name: 'Takemura'},
                    {name: 'Ikegawa'},
                    {name: 'Amano'},
                    {name: 'Tamano'}
                ],
                'keypath_true__keygen_false_2': [
                    {name: 'Bert'},
                    {name: 'Quinn'},
                    {name: 'Jeph'},
                    {name: 'Dan'}
                ]
            };

            conn.insert(insertData, function (err, insertedKeys) {
                expect(err).toBeFalsy();

                var expectation = {};
                Object.keys(insertData).forEach(function (storeName) {
                    expectation[storeName] = insertData[storeName].map(function (obj) {
                        return obj.name;
                    });
                });

                expect(insertedKeys).toEqual(expectation);
                done();
            });
        });

        it('should throw error when something goes wrong, same unique keys for example', function (done) {
            conn.insert({
                'keypath_true__keygen_false_0': [
                    {name: 'Oli'},
                    {name: 'Lee'},
                    {name: 'Matt'},
                    {name: 'Matt'},
                    {name: 'Matt'},
                    {name: 'Jordan'}
                ]
            }, function (err, insertedKeys) {
                expect(err).toBeTruthy();
                expect(err instanceof Error).toBe(true);
                expect(err.message).toMatch(/^ConstraintError/);

                done();
            });
        });

        it('should throw error when wrong data is passed', function (done) {
            conn.insert('keypath_true__keygen_false_2', 'string data', function (err, insertedKeys) {
                expect(err).toBeTruthy();
                expect(err instanceof Error).toBe(true);
                expect(err.message).toEqual('You must supply objects to be saved in the object store with set keyPath');

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path used, no key generator', function () {
        beforeEach(openConnection);

        it('should insert objects with keypath set', function (done) {
            conn.insert('keypath_true__keygen_false_0', {name: 'Barbara'}, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe('Barbara');

                done();
            });
        });

        it('should insert objects with no keypath set', function (done) {
            conn.insert('keypath_true__keygen_false_0', {foo: 'bar'}, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(isValidID(insertedKey)).toBe(true);

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path not used, key generator used', function () {
        beforeEach(openConnection);

        it('should insert records and generate autoincremented primary key', function (done) {
            conn.insert('keypath_false__keygen_true_0', 'hello world', function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe(1);

                done();
            });
        });

        it('should insert records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', 'hello world');

            conn.insert('keypath_false__keygen_true_0', data, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe('my_awesome_key');

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path used, key generator used', function () {
        beforeEach(openConnection);

        it('should insert objects with keypath set', function (done) {
            conn.insert('keypath_true__keygen_true_0', {name: 'Barbara'}, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe('Barbara');

                done();
            });
        });

        it('should insert objects with no keypath set and generate autoincremented primary key', function (done) {
            conn.insert('keypath_true__keygen_true_0', {foo: 'bar'}, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe(1);

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path is not used, no key generator', function () {
        beforeEach(openConnection);

        it('should insert records and generate autoincremented primary key', function (done) {
            conn.insert('keypath_false__keygen_false_0', {foo: 'bar'}, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(isValidID(insertedKey)).toBe(true);

                done();
            });
        });

        it('should insert records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', [1, 4, 9]);

            conn.insert('keypath_false__keygen_false_0', data, function (err, insertedKey) {
                expect(err).toBeFalsy();
                expect(insertedKey).toBe('my_awesome_key');

                done();
            });
        });

        afterEach(closeConnection);
    });
});
