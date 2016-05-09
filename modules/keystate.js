const { asBuilder } = require("./gameobject");
const { copy } = require("./copy");
const environment = require("./environment");

module.exports = {
  KeyState: asBuilder(() => {
    const emptystate = {
      left: false, right: false, up: false, down: false, space: false
    };
    let nextKeyState = Object.assign({}, emptystate);

    const instance = {
      initialize() {
        environment.registerKeyListener(this.updateNextKeyState);
      },
      uninitialize() {
        environment.removeKeyListener(this.updateNextKeyState);
      },
      updateNextKeyState(keyName) {
        nextKeyState[keyName] = true;
      },
      keystate: emptystate,
      events() {
        return { keystate: this.keystate };
      },
      next(state, events) {
        const newState = nextKeyState;
        nextKeyState = Object.assign({}, emptystate); // reset
        return copy(this, { keystate: newState });
      }
    }
    instance.initialize();
    return instance;
  })
}
