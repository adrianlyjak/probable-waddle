function copy(...objects) {
  return Object.freeze(Object.assign({}, ...objects));
}

module.exports = { copy }
