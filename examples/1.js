document.addEventListener('DOMContentLoaded', function () {
	var words = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
	var databaseName = 'sample_database_' + Date.now();
	var objStoreName = 'obj_store_1';
    
    sklad.open(databaseName, {
        migration: {
            "1": function (database) {
                // no keyPath, key generator
                var objStore = database.createObjectStore(objStoreName, {autoIncrement: true});
            }
        }
    }, function (err, database) {
        if (err)
            throw new Error(err);

        var data = {};
        data[objStoreName] = words.map(function (word) { return sklad.keyValue(Math.random(), word); });

        database.upsert(data, function (err, insertedKeys) {
            if (err)
                throw new Error(err);

            // console.log(insertedKeys[objStoreName]);
            var data = {};
            data[objStoreName] = insertedKeys[objStoreName];
            data[objStoreName].push(111);

            database.delete(data, function () {
                console.log(1);
            })

            // words.forEach(function (word) {
            //     database.upsert(objStoreName, word, function (err, key) {
            //         if (err)
            //             throw new Error(err);

            //         console.log(key);
            //     })
            // });
        });
    });
}, false);
