const express = require('express');
const { timingSafeEqual } = require('node:crypto');
const functions = require('./lib/index');
const { runMaintenance } = require('./lib/maintenance');
const app = express();
app.disable('x-powered-by');
// Preserve already parsed Vercel bodies; parse bounded JSON for the local server.
const parse = express.json({ limit: '32kb' });
app.use((req,res,next) => {
  if(req.body === undefined) return parse(req,res,next);
  if(Buffer.byteLength(JSON.stringify(req.body),'utf8') > 32768) return res.status(413).json({error:{status:'INVALID_ARGUMENT',message:'Request too large'}});
  next();
});
app.use((_req,res,next) => { res.set('Cache-Control','no-store'); res.set('X-Content-Type-Options','nosniff'); next(); });
const names = new Set(['getMyAccess','savePatientProfile','createIncident','submitBystanderReport','acceptIncident','getVolunteerIncidentDetails','setVolunteerAvailability','finishIncident','issuePatientCard','revokePatientCard','applyVolunteer','listVolunteerApplications','reviewVolunteerApplication','markIncidentArrived','cancelPatientIncident']);
app.get('/api/health', functions.health);
app.all('/api/:operation', (req,res,next) => {
  if (!names.has(req.params.operation)) return res.status(404).json({ error: { status: 'NOT_FOUND', message: 'Unknown endpoint' } });
  // Invoke the HTTP callable wrapper, never .run(): wrapper verifies Firebase ID tokens.
  Promise.resolve(functions[req.params.operation](req,res)).catch(next);
});
app.get('/internal/maintenance', async (req,res,next) => {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) return res.status(503).json({ error: 'Maintenance not configured' });
  const actual = Buffer.from(req.get('authorization') || ''), allowed = Buffer.from(`Bearer ${expected}`);
  if (actual.length !== allowed.length || !timingSafeEqual(actual,allowed)) return res.status(401).json({ error: 'Unauthorized' });
  try { res.json(await runMaintenance()); } catch(error) { next(error); }
});
app.use((_req,res) => res.status(404).json({ error: 'Not found' }));
app.use((error,_req,res,_next) => { res.status(error.type === 'entity.too.large' ? 413 : 500).json({ error: { status: 'INTERNAL', message: 'Request could not be completed' } }); });
if (require.main === module) app.listen(Number(process.env.PORT || 5201),'127.0.0.1',()=>console.log('EHIS portable backend ready'));
module.exports = app;
