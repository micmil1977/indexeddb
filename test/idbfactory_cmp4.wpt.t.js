require('proof')(4, async okay => {
    await require('./harness')(okay, 'idbfactory_cmp4')
    await harness(async function () {
        test(function() {
          assert_equals(indexedDB.cmp(new Int8Array([-1]), new Uint8Array([0])), 1,
          "255(-1) shall be larger than 0");
        }, "Compare in unsigned octet values (in the range [0, 255])");

        test(function() {
          assert_equals(indexedDB.cmp(
              new Uint8Array([255, 254, 253]),
              new Uint8Array([255, 253, 254])),
              1,
              "[255, 254, 253] shall be larger than [255, 253, 254]");
        }, "Compare values in then same length");

        test(function() {
          assert_equals(indexedDB.cmp(
              new Uint8Array([255, 254]),
              new Uint8Array([255, 253, 254])),
              1,
              "[255, 254] shall be larger than [255, 253, 254]");
        }, "Compare values in different lengths");

        test(function() {
          assert_equals(indexedDB.cmp(
              new Uint8Array([255, 253, 254]),
              new Uint8Array([255, 253])),
              1,
              "[255, 253, 254] shall be larger than [255, 253]");
        }, "Compare when the values in the range of their minimal length are the same");
    })
})
