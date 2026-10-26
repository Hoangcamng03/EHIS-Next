const app = require('../server.cjs');
module.exports = (req,res) => {
  const route = req.query && req.query.route;
  if (typeof route !== 'string' || !/^\/(api\/[a-zA-Z]+|internal\/maintenance)$/.test(route)) return res.status(404).json({ error: 'Not found' });
  req.url = route;
  return app(req,res);
};
