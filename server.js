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
    // 👇 check if the request needs to go to a different domain
    const targetHost = req.headers["x-roblox-host"] || "apis.roblox.com";
    const robloxURL = `https://${targetHost}${req.path}`;

    // clone headers safely
    const headers = {
      "Content-Type": "application/json",
      "Cookie": `.ROBLOSECURITY=${ROBLOSECURITY}`,
      ...req.headers, // include any custom headers
    };

    // remove x-roblox-host before forwarding (Roblox doesn't like unknown headers)
    delete headers["x-roblox-host"];

    // get CSRF if it's a write-type request
    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
      try {
        await axios.post("https://auth.roblox.com/v2/logout", {}, {
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

    // send the actual request
    const robloxRes = await axios({
      url: robloxURL,
      method: req.method,
      headers,
      data: req.body,
      params: req.query,
    });

    // forward the response back to the client
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
  console.log(`roproxy-modded running on port ${port}`);
});
