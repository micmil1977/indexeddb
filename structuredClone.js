const Verbatim = require('verbatim');

// https://html.spec.whatwg.org/multipage/infrastructure.html#structuredclone
function structuredClone(globalObject, input) {
    return Verbatim.deserialize(Verbatim.serialize(input));
}

module.exports = structuredClone;
