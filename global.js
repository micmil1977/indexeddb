const jsdomPackage = require("jsdom/package.json");
const oldJsdom = jsdomPackage.version.startsWith('13.');

if (oldJsdom) {
  const dom = require("jsdom/lib/jsdom/living");
  exports.add = function (globalObject) {
    for (const name in dom) {
      Object.defineProperty(globalObject, name, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: dom[name]
      });
    }
    globalObject.Object = Object;
    globalObject.Array = Array;
    globalObject.eval = eval;
  }  
} else {
  const jsGlobals = require("jsdom/lib/jsdom/browser/js-globals.json");
  const jsGlobalEntriesToInstall = Object.entries(jsGlobals).filter(([name]) => name in global);
  exports.add = function (globalObject) {
    for (const [globalName, globalPropDesc] of jsGlobalEntriesToInstall) {
      const propDesc = { ...globalPropDesc, value: global[globalName] };
      Object.defineProperty(globalObject, globalName, propDesc);
    }
  }
}
