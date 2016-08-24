## Closing a database connection
You can close active database connection with `close` method. Method is not async and returns immediately, because it calls [IDBDatabse.close](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.close) internally.

```javascript
const conn = await sklad.open('dbName');
conn.close(); // it's sync
```

## Important notes
 * Check out [close() tests](https://github.com/1999/sklad/blob/master/tests/close.js) to see expected behaviour of this method.
