describe('Migration scripts context tests', function () {
    var dbName = 'dbName' + Math.random();

    it('should create index during first migration', function (done) {
        openBaseConnection(dbName).then(function (connection) {
            connection.close();
            done();
        }).catch(function () {
            done.fail('Open connection op failed');
        });
    });

    it('should add index to existing object store (skip Safari)', function (done) {
        // Safari 9.0.0 doesn't expose existing indexes in 2+ `upgradeneeded`
        // @see https://bugs.webkit.org/show_bug.cgi?id=155045#c5
        if (is_safari) {
            console.warn('Safari doesn\'t expose existing indexes during 2+ upgradeneeded transaction. Skip this test');
            done();

            return;
        }

        sklad.open(dbName, {
            version: 2,
            migration: {
                '2': function () {
                    var objectStore = this.transaction.objectStore('keypath_true__keygen_false_0');
                    objectStore.createIndex('foo', 'bar');

                    expect(objectStore.indexNames.contains('sort_login')).toBe(true);
                    expect(objectStore.indexNames.contains('sort_name')).toBe(true);
                    expect(objectStore.indexNames.contains('foo')).toBe(true);
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
