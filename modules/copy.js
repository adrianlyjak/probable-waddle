function copy(...objects) {
  return Object.freeze(Object.assign({}, ...objects));
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

module.exports = { copy, lazy }
