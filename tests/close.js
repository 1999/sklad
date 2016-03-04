describe('Close operation', function () {
    var dbName = 'dbName' + Math.random();
    var originalTimeout;

    beforeEach(function () {
        // Microsoft Edge is sometimes waiting too much for 'onupgradeneeded' event to fire
        // change timeout for this case
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    });

    it('should free IDBDatabase object after closing database', function (done) {
        sklad.open(dbName).then(function (connection) {
            // close existing connection
            connection.close();
            expect(connection.database).toBeUndefined();

            done();
        }).catch(function (err) {
            done.fail('Open returns rejected promise: ' + err.stack);
        });
    });

    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
});
