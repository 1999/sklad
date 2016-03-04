// IE11 is sometimes waiting too much for 'success' event to fire
// Microsoft Edge is sometimes waiting too much for 'onupgradeneeded' event to fire
// change timeout for these cases
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

function isValidID(id) {
    return /[\w]{8}\-[\w]{4}\-4[\w]{3}\-[\w]{4}\-[\w]{12}/.test(id);
}
var i = 0;
function openBaseConnection(dbName) {
    i += 1;
    return sklad.open(dbName, {
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
            }).catch(function () {
                done.fail(method + ' returns rejected promise');
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
}

var is_chrome = navigator.userAgent.indexOf('Chrome') !== -1;
var is_safari = navigator.userAgent.indexOf('Safari') !== -1 && !is_chrome;
var is_explorer = navigator.userAgent.indexOf('Trident') !== -1 || navigator.userAgent.indexOf('MSIE') !== -1;
var is_ie_edge = navigator.userAgent.indexOf('Edge') !== -1;
