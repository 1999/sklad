/* eslint-disable no-unused-vars */
// IE11 is sometimes waiting too much for 'success' event to fire
// Microsoft Edge is sometimes waiting too much for 'onupgradeneeded' event to fire
// change timeout for these cases
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

function isValidID(id) {
    // eslint-disable-next-line no-useless-escape
    return /[\w]{8}\-[\w]{4}\-4[\w]{3}\-[\w]{4}\-[\w]{12}/.test(id);
}
var i = 0;
function openBaseConnection(dbName) {
    i += 1;
    return sklad.open(dbName, {
        version: 1,
        migration: {
            '1': function (database) {
                var objStore;
                var j;

                // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.createObjectStore
                // @link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore.createIndex
                for (j = 0; j < 3; j++) {
                    objStore = database.createObjectStore('keypath_true__keygen_false_' + j, {keyPath: 'some_unique_key'});
                    objStore.createIndex('sort_login', 'login', {unique: true});
                    objStore.createIndex('sort_name', 'name');
                }

                for (j = 0; j < 3; j++) {
                    objStore = database.createObjectStore('keypath_false__keygen_true_' + j, {autoIncrement: true});
                    objStore.createIndex('some_index', 'some_field');
                    objStore.createIndex('some_multi_index', 'some_array_containing_field', {multiEntry: true});
                }

                for (j = 0; j < 3; j++) {
                    objStore = database.createObjectStore('keypath_true__keygen_true_' + j, {keyPath: 'name', autoIncrement: true});
                }

                for (j = 0; j < 3; j++) {
                    objStore = database.createObjectStore('keypath_false__keygen_false_' + j);
                    objStore.createIndex('sort_field_foo', 'foo');
                }
            }
        }
    });
}

function runCommonAddTests(method) {
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
            }).then(function (keys) {
                expect(keys).toEqual({
                    'keypath_true__keygen_true_1': ['Fred', 'Sam', 'John', 'Wes', 'Lee']
                });

                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
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

            conn[method](data).then(function (keys) {
                expect(Object.keys(keys)).toEqual(Object.keys(data));

                expect(keys['keypath_true__keygen_false_0'].every(isValidID)).toBe(true);
                expect(keys['keypath_true__keygen_true_1']).toEqual(['Koie', 'Takemura', 'Ikegawa', 'Amano', 'Tamano']);
                expect(isValidID(keys['keypath_true__keygen_false_2'])).toBe(true);

                done();
            }).catch(function (err) {
                done.fail(method + ' returns rejected promise: ' + err.message);
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path used, no key generator', function () {
        beforeEach(openConnection);

        it('should ' + method + ' objects with keypath set', function (done) {
            conn[method]('keypath_true__keygen_true_2', {name: 'Barbara'}).then(function (key) {
                expect(key).toBe('Barbara');
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        it('should ' + method + ' objects with no keypath set', function (done) {
            conn[method]('keypath_true__keygen_false_0', {foo: 'bar'}).then(function (key) {
                expect(isValidID(key)).toBe(true);
                done();
            }).catch(function () {
                done.fail(method + ' op failed');
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path not used, key generator used', function () {
        beforeEach(openConnection);

        it('should ' + method + ' records and generate autoincremented primary key', function (done) {
            conn[method]('keypath_false__keygen_true_0', 'hello world').then(function (key) {
                expect(key).toBe(1);
                done();
            }).catch(function () {
                done.fail(method + ' op failed');
            });
        });

        it('should ' + method + ' records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', 'hello world');

            conn[method]('keypath_false__keygen_true_0', data).then(function (key) {
                expect(key).toBe('my_awesome_key');
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path used, key generator used', function () {
        beforeEach(openConnection);

        it('should ' + method + ' objects with keypath set', function (done) {
            conn[method]('keypath_true__keygen_true_0', {name: 'Barbara'}).then(function (key) {
                expect(key).toBe('Barbara');
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        it('should ' + method + ' objects with no keypath set and generate autoincremented primary key', function (done) {
            conn[method]('keypath_true__keygen_true_0', {foo: 'bar'}).then(function (key) {
                expect(key).toBe(1);
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        afterEach(closeConnection);
    });

    describe('Key path is not used, no key generator', function () {
        beforeEach(openConnection);

        it('should ' + method + ' records and generate autoincremented primary key', function (done) {
            conn[method]('keypath_false__keygen_false_0', {foo: 'bar'}).then(function (key) {
                expect(isValidID(key)).toBe(true);
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        it('should ' + method + ' records with explicitly set primary key', function (done) {
            var data = sklad.keyValue('my_awesome_key', [1, 4, 9]);

            conn[method]('keypath_false__keygen_false_0', data).then(function (key) {
                expect(key).toBe('my_awesome_key');
                done();
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
            });
        });

        afterEach(closeConnection);
    });

    describe('Errors', function () {
        var dbName = 'dbName' + Math.random();
        var conn1;
        var conn2;

        afterEach(function (done) {
            if (conn1) {
                conn1.close();
                conn1 = null;
            }

            if (conn2) {
                conn2.close();
                conn2 = null;
            }

            // IDBDatabase.close() doesn't unblock database immediately in IE
            setTimeout(function () {
                sklad.deleteDatabase(dbName).then(done).catch(function (err) {
                    done.fail('Delete database op failed: ' + err.message);
                });
            }, 3000);
        });

        it('should not throw when multiple connections to the same database are active', function (done) {
            openBaseConnection(dbName).then(function (connection) {
                conn1 = connection;

                Promise.all([
                    conn1[method]('keypath_true__keygen_true_2', {name: 'Barbara'}),
                    openBaseConnection(dbName).then(function (connection) {
                        conn2 = connection;
                    })
                ]).then(done).catch(function (err) {
                    done.fail('Error occured: ' + err.message);
                });
            }, function () {
                done.fail('Open connection op failed');
            });
        });
    });
}

var is_chrome = navigator.userAgent.indexOf('Chrome') !== -1;
var is_safari = navigator.userAgent.indexOf('Safari') !== -1 && !is_chrome;
var is_explorer = navigator.userAgent.indexOf('Trident') !== -1 || navigator.userAgent.indexOf('MSIE') !== -1;
var is_ie_edge = navigator.userAgent.indexOf('Edge') !== -1;
/* eslint-enable no-unused-vars */
