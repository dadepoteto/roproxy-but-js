// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const ROBLOSECURITY = process.env.ROBLOSECURITY;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// universal proxy route
app.all("*", async (req, res) => {
  try {
    const robloxURL = `https://apis.roblox.com${req.path}`;

    const headers = {
      "Content-Type": "application/json",
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
      ...req.headers, // keep original headers
    };

    // optional: csrf handling
    if (req.method === "POST" || req.method === "PATCH") {
      // get a csrf token
      try {
        const csrf = await axios.post("https://auth.roblox.com/v2/logout", {}, {
          headers: {
            Cookie: `.ROBLOSECURITY=${ROBLOSECURITY}`,
          },
        });
      } catch (e) {
        if (e.response?.headers["x-csrf-token"]) {
          headers["x-csrf-token"] = e.response.headers["x-csrf-token"];
        }
      }
    }

    const robloxRes = await axios({
      url: robloxURL,
      method: req.method,
      headers,
      data: req.body,
      params: req.query,
    });

    res.status(robloxRes.status).json(robloxRes.data);
  } catch (err) {
    console.error("[Proxy Error]", err.response?.status, err.response?.data || err.message);
    res.status(err.response?.status || 500).json({
      error: true,
      status: err.response?.status || 500,
      message: err.response?.data || err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`roproxy full started on port ${port}`);
});
