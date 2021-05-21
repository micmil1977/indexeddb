require('proof')(3, async okay => {
    await require('./harness')(okay, 'idbobjectstore_add3')
    await harness(async function () {
        var db,
          t = async_test(),
          record = { key: 1, property: "data" };

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key" });
            objStore.add(record);

            var rq = objStore.add(record);
            rq.onsuccess = fail(t, "success on adding duplicate record")

            rq.onerror = t.step_func(function(e) {
                assert_equals(e.target.error.name, "ConstraintError");
                assert_equals(rq.error.name, "ConstraintError");
                assert_equals(e.type, "error");

                e.preventDefault();
                e.stopPropagation();
            });
        };

        // Defer done, giving rq.onsuccess a chance to run
        open_rq.onsuccess = function(e) {
            t.done();
        }
    })
})
