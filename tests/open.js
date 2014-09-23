describe('Basic tests', function () {
    it('should exist', function () {
        expect(window.indexedDB).toBeDefined();
        expect(window.IDBTransaction).toBeDefined();
        expect(window.IDBKeyRange).toBeDefined();
        expect(window.IDBCursor).toBeDefined();
        expect(window.sklad).toBeDefined();

        this._dbName = 'dbName' + Math.random();
    });

    it('should connect to database', function (done) {
        sklad.open(this._dbName, {
            // migration code is not needed here
        }, function (err, connection) {
            expect(err).toBeFalsy();

            expect(typeof connection.insert).toBe('function');
            expect(typeof connection.upsert).toBe('function');
            expect(typeof connection.delete).toBe('function');
            expect(typeof connection.clear).toBe('function');
            expect(typeof connection.get).toBe('function');
            expect(typeof connection.count).toBe('function');

            expect(connection.database instanceof window.IDBDatabase).toBe(true);
            expect(Object.getOwnPropertyDescriptor(connection, 'database')).toEqual({value: connection.database, enumerable: false, configurable: false, writable: false});

            done();
        });
    });
});
