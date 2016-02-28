describe('Migration scripts context tests', function () {
    var dbName = 'dbName' + Math.random();

    // enable IndexedDB polyfill for Safari browsers
    // unfortunately Safari support for IndexedDB is really buggy
    // moreover Safari8 can't even be shimed, so Sklad library won't work in this browser too
    //
    // @see https://github.com/dfahlander/Dexie.js/wiki/IndexedDB-on-Safari
    // @see https://github.com/axemclion/IndexedDBShim/issues/167
    if (is_safari) {
        window.shimIndexedDB.__useShim();
    }

    function closeConnection(cb) {
        if (conn) {
            conn.close();
            conn = null;

            cb();
        }
    }

    it('should create index during first migration', function (done) {
        console.log('start first test...');
        openBaseConnection(dbName).then(function (connection) {
            console.log('whoa!');
            connection.close();
            done();
        }).catch(function (connection) {
            done.fail('Open connection op failed');
        });
    });

    it('should add index to existing object store', function (done) {
        sklad.open(dbName, {
            version: 2,
            migration: {
                '2': function () {
                    var objectStore = this.transaction.objectStore('keypath_true__keygen_false_0');
                    objectStore.createIndex("foo", "bar");

                    expect(objectStore.indexNames.contains("sort_login")).toBe(true);
                    expect(objectStore.indexNames.contains("sort_name")).toBe(true);
                    expect(objectStore.indexNames.contains("foo")).toBe(true);
                }
            }
        }).then(function (connection) {
            connection.close();
            done();
        }).catch(function (err) {
            done.fail('Open returns rejected promise: ' + err.name + ' (' + err.message + ')');
        });
    });
});
