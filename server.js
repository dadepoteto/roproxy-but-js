const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
const ROBLOSECURITY = process.env.ROBLOSECURITY;

// hardcoded csrf token (valid)
const csrfToken = "q9Ag3LLCCcw2";

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.all("*", async (req, res) => {
  try {
    const targetHost = req.headers["x-roblox-host"] || "apis.roblox.com";
    const robloxURL = `https://${targetHost}${req.path}`;

    const headers = {
      "Content-Type": "application/json",
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
      "x-csrf-token": csrfToken,
      "User-Agent": "Mozilla/5.0"
    };

    // clean incoming headers to avoid Roblox anger
    delete req.headers["x-roblox-host"];
    delete req.headers["host"];
    delete req.headers["accept-encoding"];

    const response = await axios({
      url: robloxURL,
      method: req.method,
      headers: headers,
      data: req.body,
      params: req.query
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    console.error("[Proxy Error]", err?.response?.status || 500, err?.response?.data || err.message);
    res.status(err?.response?.status || 500).json({
      error: true,
      status: err?.response?.status || 500,
      message: err?.response?.data || err.message
    });
  }
});

app.listen(port, () => {
  console.log(`✅ roproxy-modded running on port ${port}`);
});
