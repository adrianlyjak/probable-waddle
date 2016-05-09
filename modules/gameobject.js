const { copy, lazy } = require("./copy");

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
      return copy(applied, { isGameObject: true });
    },
    gameObjFields() {
      return Object.keys(Constructor.origin).filter(field =>
        Constructor.origin[field].isGameObject);
    }
  })
  return Constructor;
}

module.exports = { asBuilder };
