// server.js (Fixed for Roproxy Lite)

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv\config");

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.ROBLOSECURITY;

app.use(cors());
app.use(express.json());

app.use(async (req, res) => {
  const targetHost = req.headers["x-roblox-host"] || "apis.roblox.com";
  const fullUrl = `https://${targetHost}${req.path}`;

  try {
    const robloxRes = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        Cookie: `.ROBLOSECURITY=${token}`,
        "Content-Type": "application/json",
        "x-csrf-token": req.headers["x-csrf-token"] || "",
      },
      data: req.body,
    });

    // pass along headers if needed
    res.set("x-csrf-token", robloxRes.headers["x-csrf-token"] || "");
    res.status(robloxRes.status).send(robloxRes.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    res.status(status).send({
      error: true,
      status,
      message,
    });
  }
});

app.listen(port, () => {
  console.log(`roproxy-lite running on port ${port}`);
});
