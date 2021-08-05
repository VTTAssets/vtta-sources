import logger from "../../util/logger.js";

const api = () => {
  const loadScene = (scene) => {
    return new Promise((resolve, reject) => {
      const token = game.settings.get("vtta-core", "access_token");

      const getAPIUrl = () => {
        switch (game.settings.get("vtta-core", "environment")) {
          case "PRODUCTION":
            return "https://parser.vtta.io/sources";
          case "STAGING":
            return "https://parser.vtta.dev/sources";
          default:
            return "http://localhost:3006/sources";
        }
      };
      const API_URL = getAPIUrl();

      logger.info("Querying API", API_URL + "/" + scene.flags.vtta.id);
      logger.info("Token", token);

      fetch(API_URL + "/" + scene.flags.vtta.id, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw response.status;
        })
        .then((json) => {
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  const submitScene = (data) => {
    return new Promise((resolve, reject) => {
      const token = game.settings.get("vtta-core", "access_token");

      const getAPIUrl = () => {
        switch (game.settings.get("vtta-core", "environment")) {
          case "PRODUCTION":
            return "https://api.vtta.io";
          case "STAGING":
            return "https://api.vtta.dev";
          default:
            return "http://localhost:3006";
        }
      };

      const API_URL = getAPIUrl();

      const id = data.scene.id;
      logger.info("Querying API", API_URL + "/" + id);
      logger.info("Token", token);

      fetch(API_URL + "/" + id, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw response.status;
        })
        .then((json) => {
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  return {
    scene: {
      load: loadScene,
      submit: submitScene,
    },
  };
};

export default api;
