const config = {
  module: {
    name: "vtta-sources",
    label: "VTTA Sources",
  },
  templates: {
    SceneCenter: "modules/vtta-sources/src/templates/SceneCenter.handlebars",
  },
  messaging: {
    core: {
      query: "vtta-core.query",
      response: "vtta-core.available",
      timeout: 100,
      retries: 20,
    },
  },
};

export default config;
