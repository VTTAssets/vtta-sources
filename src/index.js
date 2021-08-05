import checkCoreAvailability from "./config/checkCoreAvailability.js";
import setup from "./modules/setup.js";
import renderSceneDirectory from "./modules/hooks/renderSceneDirectory.js";
import UI from "./apps/UI/index.js";

Hooks.once("ready", async () => {
  CONFIG.debug.hooks = true;

  try {
    await checkCoreAvailability();
    await setup();
  } catch (error) {
    console.log(error);
    const core = game.modules.get("vtta-core");
    const coreMissing = core === undefined;
    const coreDisabled = core && core.active === false;

    if (coreMissing) {
      ui.notifications.error(game.i18n.localize(`ERROR.CoreMissing`), {
        permanent: true,
      });
    }

    if (coreDisabled) {
      ui.notifications.error(game.i18n.localize(`ERROR.CoreDisabled`), {
        permanent: true,
      });
    }
  }
  CONFIG.debug.hooks = false;
});

const ui = new UI();
Hooks.on("renderSceneDirectory", (app, html, options) => {
  renderSceneDirectory(html, ui);
});
