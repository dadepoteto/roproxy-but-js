// server.js — fixed, robust, and less cursed

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.ROBLOSECURITY;

if (!token) {
  console.error("❌ Missing .ROBLOSECURITY token in environment variables!");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.all("/*", async (req, res) => {
  const robloxHost = req.headers["x-roblox-host"] || "apis.roblox.com";
  const fullUrl = `https://${robloxHost}${req.path}`;

  try {
    console.log("🔗 Proxying to:", fullUrl);

    const robloxRes = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        Cookie: `.ROBLOSECURITY=${token}`,
        "Content-Type": "application/json",
        "x-csrf-token": req.headers["x-csrf-token"] || ""
      },
      data: req.body
    });

    const forwardedHeaders = {};
    if (robloxRes.headers["x-csrf-token"]) {
      forwardedHeaders["x-csrf-token"] = robloxRes.headers["x-csrf-token"];
    }

    res.set(forwardedHeaders).status(robloxRes.status).json(robloxRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const msg = err.response?.data || err.message;

    console.error("❌ Proxy Error:", status, msg);

    res.status(status).json({
      error: true,
      status,
      message: msg
    });
  }
});

app.listen(port, () => {
  console.log(`🟢 Proxy live on port ${port}`);
});
