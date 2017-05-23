const { copy, lazy, asArray } = require("../sugar");

function asBuilder(proto) {

  const Constructor = (config = {}) => {
    let subObjects = Constructor.gameObjFields.reduce((soFar, field) => { // deep merge for gameobjects
      if (config[field]) {
        soFar[field] = copy(Constructor.origin[field], config[field]);
        delete config[field];
      }
      return soFar;
    }, {});
    return copy(Constructor.origin, config, subObjects);
  }
  lazy(Constructor, {
    origin() {
      const applied = typeof proto === "function" ? proto() : proto
      if (applied.initialize) applied.initialize();
      return copy(applied, { isGameObject: true, constructor: Constructor });
    },
    gameObjFields() {
      return Object.keys(Constructor.origin).filter(field => {
        return Constructor.origin[field].isGameObject;
      });
    }
  });
  return Constructor;
}

function lazyProp(obj, key, getter) {
  if (typeof obj.__lazy__[key] === "undefined") obj.__lazy__[key] = getter()
  return obj.__lazy__[key];
}
/** interface EventRegister must have a
  `register(obj): Unit`
  `events()`: Iterable[Json]
*/
function asEventRegister(proto) {
  let instance = {
    register(elements) {
      /** game engine builds EventRegister lazily per event cycle */
      return {
        isEventRegister: true,
        build: () => typeof proto === "function" ? proto() : proto,
        components: elements,
        get registerBuilder() { return instance; }
      };
    }
  }
  return instance;
}

function asHook(proto) {
  return {
    isHook: true,
    action: proto
  }
}

module.exports = { asBuilder, asEventRegister, asHook, lazyProp };
