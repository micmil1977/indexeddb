require('proof')(9, async okay => {
    await require('./harness')(okay, 'key-conversion-exceptions')
    await harness(async function () {

        // Convenience function for tests that only need to run code in onupgradeneeded.
        function indexeddb_upgrade_only_test(upgrade_callback, description) {
          indexeddb_test(upgrade_callback, t => { t.done(); }, description);
        }

        // Key that throws during conversion.
        function throwing_key(name) {
            var throws = [];
            throws.length = 1;
            const err = new Error('throwing from getter');
            err.name = name;
            Object.defineProperty(throws, '0', {get: function() {
                throw err;
            }, enumerable: true});
            return [throws, err];
        }

        var valid_key = [];
        var invalid_key = {};

        // Calls method on receiver with the specified number of args (default 1)
        // and asserts that the method fails appropriately (rethrowing if
        // conversion throws, or DataError if not a valid key), and that
        // the first argument is fully processed before the second argument
        // (if appropriate).
        function check_method(receiver, method, args) {
            args = args || 1;
            if (args < 2) {
                const [key, err] = throwing_key('getter');
                assert_throws_exactly(err, () => {
                    receiver[method](key);
                }, 'key conversion with throwing getter should rethrow');

                assert_throws_dom('DataError', () => {
                    receiver[method](invalid_key);
                }, 'key conversion with invalid key should throw DataError');
            } else {
                debugger
                const [key1, err1] = throwing_key('getter 1');
                const [key2, err2] = throwing_key('getter 2');
                assert_throws_exactly(err1, () => {
                    receiver[method](key1, key2);
                }, 'first key conversion with throwing getter should rethrow');

                assert_throws_dom('DataError', () => {
                    receiver[method](invalid_key, key2);
                }, 'first key conversion with invalid key should throw DataError');

                assert_throws_exactly(err2, () => {
                    receiver[method](valid_key, key2);
                }, 'second key conversion with throwing getter should rethrow');

                assert_throws_dom('DataError', () => {
                    receiver[method](valid_key, invalid_key);
                }, 'second key conversion with invalid key should throw DataError');
            }
        }

        // Static key comparison utility on IDBFactory.
        test(t => {
            check_method(indexedDB, 'cmp', 2);
        }, 'IDBFactory cmp() static with throwing/invalid keys');
return
        // Continue methods on IDBCursor.
        indexeddb_upgrade_only_test((t, db) => {
            var store = db.createObjectStore('store');
            store.put('a', 1).onerror = t.unreached_func('put should succeed');

            var request = store.openCursor();
            request.onerror = t.unreached_func('openCursor should succeed');
            request.onsuccess = t.step_func(() => {
                var cursor = request.result;
                assert_not_equals(cursor, null, 'cursor should find a value');
                check_method(cursor, 'continue');
            });
        }, 'IDBCursor continue() method with throwing/invalid keys');

        indexeddb_upgrade_only_test((t, db) => {
            var store = db.createObjectStore('store');
            var index = store.createIndex('index', 'prop');
            store.put({prop: 'a'}, 1).onerror = t.unreached_func('put should succeed');

            var request = index.openCursor();
            request.onerror = t.unreached_func('openCursor should succeed');
            request.onsuccess = t.step_func(() => {
                var cursor = request.result;
                assert_not_equals(cursor, null, 'cursor should find a value');

                check_method(cursor, 'continuePrimaryKey', 2);
            });
        }, null, 'IDBCursor continuePrimaryKey() method with throwing/invalid keys');

        // Mutation methods on IDBCursor.
        indexeddb_upgrade_only_test((t, db) => {
            var store = db.createObjectStore('store', {keyPath: 'prop'});
            store.put({prop: 1}).onerror = t.unreached_func('put should succeed');

            var request = store.openCursor();
            request.onerror = t.unreached_func('openCursor should succeed');
            request.onsuccess = t.step_func(() => {
                var cursor = request.result;
                assert_not_equals(cursor, null, 'cursor should find a value');

                var value = {};
                var err;
                [value.prop, err] = throwing_key('getter');
                assert_throws_exactly(err, () => {
                    cursor.update(value);
                }, 'throwing getter should rethrow during clone');

                // Throwing from the getter during key conversion is
                // not possible since (1) a clone is used, (2) only own
                // properties are cloned, and (3) only own properties
                // are used for key path evaluation.

                value.prop = invalid_key;
                assert_throws_dom('DataError', () => {
                    cursor.update(value);
                }, 'key conversion with invalid key should throw DataError');
            });
        }, 'IDBCursor update() method with throwing/invalid keys');

        // Static constructors on IDBKeyRange
        ['only', 'lowerBound', 'upperBound'].forEach(method => {
            test(t => {
                check_method(IDBKeyRange, method);
            }, 'IDBKeyRange ' + method + '() static with throwing/invalid keys');
        });

        test(t => {
            check_method(IDBKeyRange, 'bound', 2);
        }, 'IDBKeyRange bound() static with throwing/invalid keys');

        // Insertion methods on IDBObjectStore.
        ['add', 'put'].forEach(method => {
            indexeddb_upgrade_only_test((t, db) => {
                var out_of_line = db.createObjectStore('out-of-line keys');
                var in_line = db.createObjectStore('in-line keys', {keyPath: 'prop'});
                var [key, err] = throwing_key('getter');
                assert_throws_exactly(err, () => {
                    out_of_line[method]('value', key);
                }, 'key conversion with throwing getter should rethrow');

                assert_throws_dom('DataError', () => {
                    out_of_line[method]('value', invalid_key);
                }, 'key conversion with invalid key should throw DataError');

                var value = {};
                [value.prop, err] = throwing_key('getter');
                assert_throws_exactly(err, () => {
                    in_line[method](value);
                }, 'throwing getter should rethrow during clone');

                // Throwing from the getter during key conversion is
                // not possible since (1) a clone is used, (2) only own
                // properties are cloned, and (3) only own properties
                // are used for key path evaluation.

                value.prop = invalid_key;
                assert_throws_dom('DataError', () => {
                    in_line[method](value);
                }, 'key conversion with invalid key should throw DataError');
            }, `IDBObjectStore ${method}() method with throwing/invalid keys`);
        });

        // Generic (key-or-key-path) methods on IDBObjectStore.
        [
            'delete', 'get', 'getKey', 'getAll', 'getAllKeys', 'count', 'openCursor',
            'openKeyCursor'
        ].forEach(method => {
            indexeddb_upgrade_only_test((t, db) => {
                var store = db.createObjectStore('store');

                check_method(store, method);
            }, `IDBObjectStore ${method}() method with throwing/invalid keys`);
        });

        // Generic (key-or-key-path) methods on IDBIndex.
        [
            'get', 'getKey', 'getAll', 'getAllKeys', 'count', 'openCursor',
            'openKeyCursor'
        ].forEach(method => {
            indexeddb_upgrade_only_test((t, db) => {
                var store = db.createObjectStore('store');
                var index = store.createIndex('index', 'keyPath');

                check_method(index, method);
            }, `IDBIndex ${method}() method with throwing/invalid keys`);
        });

    })
})
