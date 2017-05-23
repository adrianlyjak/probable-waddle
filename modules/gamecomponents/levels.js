const environment = require("../environment");
const { range } = require("../sugar");
const { KeyState } = require("./keystate");
const { Player } = require("./player");
const { Enemy, WinIfEnemiesDead } = require("./enemy");

const testEnemies = [];
range(1, 5).forEach( y => {
  range(1, 10).forEach( x => {
    testEnemies.push(Enemy({ shape: { position: { x: 80 * x,  y: 80 * y }}}));
  })
})
module.exports = {
  testLevel: [Player(), KeyState.origin, WinIfEnemiesDead()].concat(testEnemies),
}
