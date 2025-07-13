// 🔥 FINAL CLEAN server.js for RoProxy-style forwarding

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.ROBLOSECURITY;

if (!token) {
  console.error("❌ .ROBLOSECURITY token is missing in environment variables");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

app.all("/*", async (req, res) => {
  const path = req.path;
  const robloxHost = req.headers["x-roblox-host"] || "apis.roblox.com";
  const fullUrl = `https://${robloxHost}${path}`;

  try {
    console.log(`📡 Forwarding: ${req.method} ${fullUrl}`);

    const response = await axios({
      method: req.method,
      url: fullUrl,
      headers: {
        "Cookie": `.ROBLOSECURITY=${token}`,
        "Content-Type": "application/json",
        "x-csrf-token": req.headers["x-csrf-token"] || ""
      },
      data: req.body
    });

    // Forward CSRF token if present
    const headers = {};
    if (response.headers["x-csrf-token"]) {
      headers["x-csrf-token"] = response.headers["x-csrf-token"];
    }

    res.set(headers).status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data || err.message;
    console.error("❌ Proxy error:", status, message);
    res.status(status).json({
      error: true,
      status,
      message
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy server running on port ${port}`);
});
