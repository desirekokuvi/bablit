export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    service: 'bablit Translation Engine - Just bablit it!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
