function apiKeyAuth(req, res, next) {
  const apiKey = req.header('x-api-key');
  const expectedKey = process.env.API_KEY;

  console.log("🔐 Received API Key:", apiKey);
  console.log("🔐 Expected API Key:", expectedKey);

  if (!apiKey) {
    return res.status(401).send("API Key is missing");
  }

  if (apiKey !== expectedKey) {
    return res.status(403).send("API Key is invalid");
  }

  console.log("✅ API Key matched");
  next();
}

module.exports = apiKeyAuth;
