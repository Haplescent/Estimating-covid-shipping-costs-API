const express = require("express");
const path = require("path");
const port = process.env.PORT || 3000;
const app = express();
const getPriceForShipment = require("./api-call");
// send the user to index html page inspite of the url
app.get("/", async (req, res) => {
  const data = await getPriceForShipment();
  res.json(data);
});

app.listen(port);
