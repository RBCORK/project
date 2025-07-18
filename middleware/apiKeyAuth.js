function apiKeyAuth(req, res, next) {
  const apiKey = req.header('x-api-key') || req.query.apikey;
  const expectedKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(401).send("API Key is missing");
  }

  if (apiKey !== expectedKey) {
    return res.status(403).send("API Key is invalid");
  }

  next();
}

module.exports = apiKeyAuth;
