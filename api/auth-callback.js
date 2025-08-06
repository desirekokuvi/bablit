export default async function handler(req, res) {
  // Handle OAuth callback from GHL
  const { code, state } = req.query;
  
  // Exchange code for access token
  // Store in your database
  
  res.redirect('/setup-complete');
}
