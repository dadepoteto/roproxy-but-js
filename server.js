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

app.all("*", async (req, res) => {
  try {
    const targetHost = req.headers["x-roblox-host"] || "apis.roblox.com";
    const robloxURL = `https://${targetHost}${req.path}`;

    // clone headers and delete things Roblox doesn't like
    const headers = {
      ...req.headers,
      "Content-Type": "application/json",
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`
    };

    delete headers["host"];
    delete headers["x-roblox-host"];

    // get csrf if needed
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
      const csrfRes = await axios.post("https://auth.roblox.com/v2/logout", {}, {
        headers: {
          "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`
        }
      }).catch(err => err.response);

      const csrfToken = csrfRes?.headers?.["x-csrf-token"];
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
    }

    // proxy the request
    const response = await axios({
      url: robloxURL,
      method: req.method,
      headers,
      data: req.body,
      params: req.query,
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data || err.message || "Unknown error";

    console.error("[Proxy Error]", status, message);
    res.status(status).json({
      error: true,
      status,
      message,
    });
  }
});

app.listen(port, () => {
  console.log(`🔥 roproxy-modded up on ${port}`);
});
