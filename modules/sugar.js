function copy(...objects) {
  let instance = Object.assign({}, ...objects);
  for (let obj of objects) {
    for (let prop in obj) {
      let getter = obj.__lookupGetter__(prop);
      if (getter) instance.__defineGetter__(prop, getter);
      if (prop === "__lazy__") instance.__lazy__ = {};
    }
  }
  return Object.freeze(instance);
}

function lazy(object, functions) {
  Object.keys(functions).forEach((functionName) => {
    let initializer = functions[functionName];
    Object.defineProperty(object, functionName, {
      get: function() {
        let value = initializer.call(this);
        Object.defineProperty(this, functionName, { value: value, writeable: false });
        return value;
      },
      configurable: true
    });
  });
  return object;
}

function range(start, stop, step = 1) {
  const count = Math.abs((stop - start) / step);
  return Array.from(Array(count)).map((_,i) => ((i * step) + start));
}

function buildObject(source, mapper) {
  const json = {};
  source.forEach((e) => {
    let applied = asArray(mapper(e));
    applied.forEach((e2) => Object.assign(json, e2));
  })
  return json;
}

function asArray(obj) {
  if (!obj) {
    return [];
  } else if (!Array.isArray(obj)) {
    return [obj];
  } else {
    return obj;
  }
}

function ensureApplied(func, ...args) {
  if (typeof func === "function") {
    return func(...args);
  } else {
    return func
  }
}

module.exports = { copy, lazy, range, buildObject, asArray, ensureApplied }
