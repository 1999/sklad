function isValidID(id) {
    return /[\w]{8}\-[\w]{4}\-4[\w]{3}\-[\w]{4}\-[\w]{12}/.test(id);
}

function openBaseConnection(dbName, cb) {
    sklad.open(dbName, {
        version: 1,
        migration: {
            '1': function (database) {
                // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.createObjectStore
                // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore.createIndex
                for (var i = 0; i < 3; i++) {
                    var objStore = database.createObjectStore('keypath_true__keygen_false_' + i, {keyPath: 'some_unique_key'});
                    objStore.createIndex('sort_login', 'login', {unique: true});
                    objStore.createIndex('sort_name', 'name');
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

        cb(connection);
    });
}

function runCommonAddTests(method) {
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

    describe('Common tests', function () {
        beforeEach(openConnection);

        it('should ' + method + ' multiple records into one database', function (done) {
            conn[method]({
                'keypath_true__keygen_true_1': [
                    {name: 'Fred'},
                    {name: 'Sam'},
                    {name: 'John'},
                    {name: 'Wes'},
                    {name: 'Lee'}
                ]
            }, function (err, keys) {
                expect(err).toBeFalsy();
                expect(keys).toEqual({
                    'keypath_true__keygen_true_1': ['Fred', 'Sam', 'John', 'Wes', 'Lee']
                });

                done();
            });
        });

        it('should ' + method + ' multiple records into multiple databases', function (done) {
            var data = {
                'keypath_true__keygen_false_0': [
                    {foo: 'bar'},
                    {bar: 'foo'},
                    {foo: 'bar2'},
                    {bar2: 'foo'}
                ],
                'keypath_true__keygen_true_1': [
                    {name: 'Koie'},
                    {name: 'Takemura'},
                    {name: 'Ikegawa'},
                    {name: 'Amano'},
                    {name: 'Tamano'}
                ],
                'keypath_true__keygen_false_2': [
                    {}
                ]
            };

            conn[method](data, function (err, keys) {
                expect(err).toBeFalsy();
                expect(Object.keys(keys)).toEqual(Object.keys(data));

                expect(keys['keypath_true__keygen_false_0'].every(isValidID)).toBe(true);
                expect(keys['keypath_true__keygen_true_1']).toEqual(['Koie', 'Takemura', 'Ikegawa', 'Amano', 'Tamano']);
                expect(isValidID(keys['keypath_true__keygen_false_2'])).toBe(true);

                done();
            });
        });

        it('should not fail if no callback is set', function (done) {
            conn[method]({
                'keypath_true__keygen_true_1': [
                    {name: 'Fred'},
                    {name: 'Sam'},
                    {name: 'John'},
                    {name: 'Wes'},
                    {name: 'Lee'}
                ]
            });

            setTimeout(done, 3000);
        });

        afterEach(closeConnection);
    });

    describe('Key path used, no key generator', function () {
        beforeEach(openConnection);

        it('should ' + method + ' objects with keypath set', function (done) {
            conn[method]('keypath_true__keygen_true_2', {name: 'Barbara'}, function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe('Barbara');

                done();
            });
        });

        it('should ' + method + ' objects with no keypath set', function (done) {
            conn[method]('keypath_true__keygen_false_0', {foo: 'bar'}, function (err, key) {
                expect(err).toBeFalsy();
                expect(isValidID(key)).toBe(true);

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path not used, key generator used', function () {
        beforeEach(openConnection);

        it('should ' + method + ' records and generate autoincremented primary key', function (done) {
            conn[method]('keypath_false__keygen_true_0', 'hello world', function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe(1);

                done();
            });
        });

        it('should ' + method + ' records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', 'hello world');

            conn[method]('keypath_false__keygen_true_0', data, function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe('my_awesome_key');

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path used, key generator used', function () {
        beforeEach(openConnection);

        it('should ' + method + ' objects with keypath set', function (done) {
            conn[method]('keypath_true__keygen_true_0', {name: 'Barbara'}, function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe('Barbara');

                done();
            });
        });

        it('should ' + method + ' objects with no keypath set and generate autoincremented primary key', function (done) {
            conn[method]('keypath_true__keygen_true_0', {foo: 'bar'}, function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe(1);

                done();
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path is not used, no key generator', function () {
        beforeEach(openConnection);

        it('should ' + method + ' records and generate autoincremented primary key', function (done) {
            conn[method]('keypath_false__keygen_false_0', {foo: 'bar'}, function (err, key) {
                expect(err).toBeFalsy();
                expect(isValidID(key)).toBe(true);

                done();
            });
        });

        it('should ' + method + ' records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', [1, 4, 9]);

            conn[method]('keypath_false__keygen_false_0', data, function (err, key) {
                expect(err).toBeFalsy();
                expect(key).toBe('my_awesome_key');

                done();
            });
        });

        afterEach(closeConnection);
    });
}
