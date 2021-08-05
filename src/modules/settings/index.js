import config from "../../config/index.js";
import logger from "../../util/logger.js";

export default function () {
  const settings = [
    {
      // log level
      key: "logLevel",
      type: Number,
      default: 0,
      scope: "world",
      config: false,
      public: false,
    },
  ];

  // register all settings internally
  settings.forEach((setting, index) => {
    logger.debug(`Registering setting`, setting.key, setting);
    setting.order = index;
    game.settings.register(config.module.name, setting.key, setting);
  });

  // answer to the call of the settings dialog
  window.addEventListener("vtta.configuration.query", () => {
    logger.debug("Event vtta.configuration.query received");
    const reply = new CustomEvent("vtta.configuration.submit", {
      detail: {
        name: config.module.name,
        label: config.module.label,
        settings: settings
          .filter((setting) => setting.public === true)
          .map((setting) =>
            Object.assign(setting, {
              label: game.i18n.localize(`SETTING.${setting.key}.label`),
              hint: game.i18n.localize(`SETTING.${setting.key}.hint`),
              value: game.settings.get(config.module.name, setting.key),
              min: setting.min ? setting.min : undefined,
              max: setting.max ? setting.max : undefined,
            })
          ),
      },
    });
    logger.debug("Sending reply to event vtta.configuration.query", reply);
    window.dispatchEvent(reply);
  });
}
