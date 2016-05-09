const environment      = require("./environment");
const levels           = require("./levels");
const Engine           = require("./engine")

const initialState = levels.testLevel;
const engine = Engine(initialState);
engine.play();
