const { copy } = require("../sugar");
const environment = require("../environment");
const { asBuilder } = require("./gameobject");

module.exports = {
  KeyState: asBuilder(() => {  // singleton
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
        console.log("update")
        nextKeyState[keyName] = true;
      },
      events() {
        let eventState = copy(nextKeyState);
        nextKeyState = Object.assign({}, emptystate); // reset
        return { keystate: eventState }
      },
    }
    instance.initialize();
    return instance;
  })
}
