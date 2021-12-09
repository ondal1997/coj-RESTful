const crypto = require("crypto");

function getDataFromAccessToken(accessToken) {
  const [payload, signature] = accessToken.split(".");

  const cmp = crypto
    .createHash(ACCESS_TOKEN_ALG)
    .update(`${payload}${ACCESS_TOKEN_SECRET}`)
    .digest("hex");

  if (cmp !== signature) {
    throw new Error("bad token");
  }

  return JSON.parse(atob(payload));
}

module.exports = { getDataFromAccessToken };
