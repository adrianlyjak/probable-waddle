import models from "./models";
import Engine from "./engine"
import { buildFrom, createBuilders } from "./classless";

const scenarios = {
  test: {
    gameobjects: [models.bouncingRectangle()]
  }
}


var engine = Engine({ scenario: scenarios.test });

engine.play({ fps: 30 });
