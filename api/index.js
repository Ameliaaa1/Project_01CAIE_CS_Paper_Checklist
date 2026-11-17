try {
  module.exports = require("../server");
} catch (error) {
  if (error.code !== "PAPERLENS_PRODUCTION_CONFIGURATION_INCOMPLETE") throw error;

  console.error(error.message);
  module.exports = function unavailable(_req, res) {
    res.writeHead(503, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(JSON.stringify({ error: "PaperLens online services are temporarily unavailable." }));
  };
}
