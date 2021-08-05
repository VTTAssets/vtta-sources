import config from "../../config/index.js";
import logger from "../../util/logger.js";
import API from "../../modules/api/index.js";

/**
 * This is the UI application for the TokenEditor
 */
class UI extends FormApplication {
  constructor() {
    super({});
    this.api = API();
    this.selectedScene = null;

    this.localScene = null;
    this.remoteScene = null;
  }

  /** @override */
  static get defaultOptions() {
    return Object.assign(super.defaultOptions, {
      width: 720,
      resizeable: true,
      title: "VTTA Scene Submission",
      height: "auto",
      classes: ["vtta", "ui", "sources"],
      template: "modules/vtta-sources/src/templates/ui.handlebars",
    });
  }

  static compressArray = (arr, DEFAULTS) => {
    const clone = JSON.parse(JSON.stringify(arr));
    return clone.map((element) => {
      for (let prop in DEFAULTS) {
        if (element[prop] === DEFAULTS[prop]) delete element[prop];
      }
      delete element._id;
      delete element.flags;
      return element;
    });
  };

  static collectSceneData = (scene) => {
    const WALL_DEFAULT = {
      dir: 1,
      door: 0,
      ds: 0,
      move: 1,
      sense: 1,
      sound: 1,
    };

    const LIGHT_DEFAULT = {
      angle: 360,
      rotation: 0,
      t: "l",
    };

    // collect all journal entries
    const journals = scene.notes
      .map((note) => note.data)
      .map((note) => {
        const journal = game.journal.get(note.entryId);
        if (
          journal &&
          journal.data.flags &&
          journal.data.flags.vtta &&
          journal.data.flags.vtta.id
        ) {
          let data = {
            id: journal.data.flags.vtta.id,
            x: note.x,
            y: note.y,
          };
          return data;
        }
        return undefined;
      })
      .filter((note) => note !== undefined)
      .reduce((notes, note) => {
        const id = note.id;
        delete note.id;
        const existing = notes.find((n) => n.id === id);
        if (existing === undefined) {
          notes.push({
            id: id,
            positions: [note],
          });
        } else {
          existing.positions.push(note);
        }
        return notes;
      }, []);

    // collect all monsters, group by id. conserve custom names
    const monsters = scene.tokens
      .map((token) => token.data)
      .map((token) => {
        const actor = game.actors.get(token.actorId);
        if (
          actor &&
          actor.data.flags &&
          actor.data.flags.vtta &&
          actor.data.flags.vtta.id
        ) {
          let data = {
            id: actor.data.flags.vtta.id,
            x: token.x,
            y: token.y,
          };

          // custom name on that token
          if (
            token.actorData &&
            token.actorData.name &&
            token.actorData.name !== actor.data.name
          ) {
            data.name = token.actorData.name;
          }
          return data;
        }
        return undefined;
      })
      .filter((monster) => monster !== undefined)
      .reduce((monsters, monster) => {
        const id = monster.id;
        delete monster.id;
        const existing = monsters.find((m) => m.id === id);
        if (existing === undefined) {
          monsters.push({
            id: id,
            positions: [monster],
          });
        } else {
          existing.positions.push(monster);
        }
        return monsters;
      }, []);

    const walls = UI.compressArray(
      scene.walls.map((wall) => wall.data),
      WALL_DEFAULT
    );

    const lights = UI.compressArray(
      scene.lights.map((light) => light.data),
      LIGHT_DEFAULT
    );

    return {
      name: scene.name,
      code: scene.flags.vtta.code,
      id: scene.flags.vtta.id,
      type: "scene",
      entity: "Scene",
      img: {
        height: scene.height,
        width: scene.width,
        shift: {
          x: scene.shiftX,
          y: scene.shiftY,
        },
      },
      grid: {
        value: scene.grid,
        type: scene.gridType,
        distance: scene.gridDistance,
        units: scene.gridUnits,
      },
      flags: {
        vtta: {
          folders: scene.flags.vtta.folders,
        },
      },
      journals,
      monsters,
      walls: walls,
      lights: lights,
    };
  };

  static compare = (a, b) => {
    // check all the walls
    a.walls.forEach((wall) => {
      b.walls.find((w) => {
        w;
      });
    });
  };

  static generateStats = (sceneData) => {
    let stats = {
      monsters: {
        total: sceneData.monsters
          ? sceneData.monsters.reduce(
              (count, monster) => count + Math.max(monster.positions.length, 1),
              0
            )
          : 0,
        unique: sceneData.monsters ? sceneData.monsters.length : 0,
      },
      walls: sceneData.walls.length,
      lights: sceneData.lights.length,
      journals: {
        total: sceneData.journals
          ? sceneData.journals.reduce(
              (count, journal) => count + Math.max(1, journal.positions.length),
              0
            )
          : 0,
        unique: sceneData.journals ? sceneData.journals.length : 0,
      },
    };

    return stats;
  };

  async getData() {
    const scenes = game.scenes.contents
      .filter(
        (scene) =>
          scene.data.flags && scene.data.flags.vtta && scene.data.flags.vtta.id
      )
      .map((scene) => {
        return {
          name: scene.name,
          // _id: scene._id,
          _id: scene.id,
          id: scene.data.flags.vtta.id,
          selected:
            this.localScene &&
            this.localScene.scene &&
            // this.localScene.scene._id === scene.id,
            this.localScene.scene._id === scene.id,
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const diff = (a, b) => {
      const difference = a - b;
      if (difference === 0) {
        return a;
      } else {
        return difference < 0
          ? `${a} (${difference})`
          : `${a} (+${difference})`;
      }
    };

    const diffObj = (a, b) => {
      const result = {};
      for (let prop in a) {
        if (b[prop] !== undefined && typeof a[prop] === typeof b[prop]) {
          switch (typeof a[prop]) {
            case "object":
              result[prop] = diffObj(a[prop], b[prop]);
              break;
            case "number":
              result[prop] = diff(a[prop], b[prop]);
              break;
          }
        }
      }
      return result;
    };

    const hasCustomGrid = (scene) => {
      return scene.grid && scene.grid !== 50;
    };

    const hasCustomShift = (scene) => {
      return scene.shiftX !== 0 || (scene.img.shift.y && scene.shiftX !== 0);
    };

    let details = false;
    if (this.localScene && this.remoteScene) {
      details = diffObj(this.localScene.stats, this.remoteScene.stats);
      details.id = this.localScene.data.id;
      details.name = this.localScene.scene.name;
      details.lastUpdatedAgo = this.remoteScene.data.lastUpdatedAgo;
      details.updatedBy = this.remoteScene.data.updatedBy;

      const remoteQuality = this.remoteScene.quality;

      this.quality = {
        grid:
          hasCustomGrid(this.localScene.scene) ||
          hasCustomShift(this.localScene.scene),
        walls:
          remoteQuality && remoteQuality.walls
            ? remoteQuality.walls
            : this.localScene.stats.walls > 0,
        lights:
          remoteQuality && remoteQuality.lights
            ? remoteQuality.lights
            : this.localScene.stats.lights > 0,
        journals:
          remoteQuality && remoteQuality.journals
            ? remoteQuality.journals
            : this.localScene.stats.journals.total > 0,
        monsters:
          remoteQuality && remoteQuality.monsters
            ? remoteQuality.monsters
            : this.localScene.stats.monsters.total > 0,
      };
    }

    return {
      scenes,
      details,
      quality: this.quality,
    };
  }

  activateListeners(html) {
    $(html)
      .find(".scenes.list li")
      .on("click", async (event) => {
        event.preventDefault();
        const { type, id } = $(event.currentTarget).data();

        // analyze the selected scene
        const selectedScene = game.scenes.get(id);

        this.localScene = {
          scene: selectedScene.data,
          data: UI.collectSceneData(selectedScene.data),
          stats: null,
        };
        this.localScene.stats = UI.generateStats(this.localScene.data);

        try {
          const result = await this.api.scene.load(selectedScene.data);
          if (result.success) {
            this.remoteScene = {
              data: result.data,
              stats: UI.generateStats(result.data),
            };
            this.render();
          } else {
            throw new Error(result.data);
          }
        } catch (error) {
          window.vtta.ui.Notification.show(
            "Error retrieving scene",
            "<pre>" + JSON.stringify(error) + "</p>"
          );
        }
      });

    $(html)
      .find("button[type='submit']")
      .on("click", async (event) => {
        event.preventDefault();

        if (this.localScene) {
          const changelog = $('textarea[name="changelog"]').val().trim();

          const submission = {
            changelog,
            scene: { ...this.localScene.data, quality: this.quality },
          };

          logger.info("Submitting scene", submission);

          const response = await this.api.scene.submit(submission);
          if (response.success) {
            window.vtta.ui.Notification.show(
              "Scene submission: Success",
              `Follow your generated <a href="${response.data.url}">Pull Request on GitHub</a>. Thanks for your great work!`
            );
          } else {
            window.vtta.ui.Notification.show(
              "Scene submission: Error",
              response.data.message
            );
          }
        }
      });

    $(html)
      .find("button[name='clipboard']")
      .on("click", async (event) => {
        event.preventDefault();

        const sceneData = { ...this.localScene.data, quality: this.quality };
        navigator.clipboard
          .writeText(JSON.stringify(sceneData, null, 3))
          .then(() => {
            console.log("Clipboard copy successful");
          })
          .catch((error) => {
            console.log("Cold not copy to clopboard");
            console.log(error);
          });
      });

    $(html)
      .find("input[type='checkbox']")
      .on("change", (event) => {
        const data = $(event.target).data();
        const val = $(event.target).prop("checked");
        if (this.quality && this.quality[data.prop] !== undefined) {
          this.quality[data.prop] = val;
        }
      });

    super.activateListeners(html);
  }
}

export default UI;
