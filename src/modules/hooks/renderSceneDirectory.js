import logger from "../../util/logger.js";

export default function (html, app) {
  logger.info("Rendering scene directory");
  const button = $(
    `<button class="vtta vtta-sources"><i class="fas"></i> Maps</button>`
  );
  $(button).on("click", (event) => {
    event.preventDefault();
    if (app.rendered) {
      app.bringToTop();
    } else {
      app.render(true);
    }
  });

  $(html).find("header > div.action-buttons").append(button);
}
