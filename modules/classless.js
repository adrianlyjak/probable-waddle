import extend from "extend";

export function buildFrom(original, extensions = {}) {
  return Object.freeze(extend({}, original, extensions));
}

export function createBuilders(generators) {
  const builders = {};
  for (let key of Object.keys(generators)) {
    builders[key] = factory(generators[key])
  }
  return builders;
}

export function factory(generator) {
  return function(config = {}) {
    return buildFrom(generator(), config);
  }
}
