const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory demo state for channels and yields
const state = {
  balances: {}, // { recipientAddress: number USDC }
  apy: 0.08,
};

// POST /send { to, amount }
app.post('/send', (req, res) => {
  const { to, amount } = req.body || {};
  if (!to || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  state.balances[to] = (state.balances[to] || 0) + amount;
  // Simulate NitroLite off-chain update acknowledgement
  return res.json({ ok: true, channelUpdateId: Date.now(), newBalance: state.balances[to] });
});

// GET /receive?address=0x...
app.get('/receive', (req, res) => {
  const address = req.query.address;
  if (!address) return res.status(400).json({ error: 'Missing address' });
  const balance = state.balances[address] || 0;
  return res.json({ balance });
});

// POST /withdraw { address, amount }
app.post('/withdraw', (req, res) => {
  const { address, amount } = req.body || {};
  if (!address || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const current = state.balances[address] || 0;
  if (amount > current) return res.status(400).json({ error: 'Insufficient balance' });
  state.balances[address] = current - amount;
  return res.json({ ok: true, remaining: state.balances[address] });
});

// GET /yield?principal=1000&days=30
app.get('/yield', (req, res) => {
  const principal = Number(req.query.principal || 0);
  const days = Number(req.query.days || 0);
  const rate = state.apy;
  const daily = rate / 365;
  const amount = principal * Math.pow(1 + daily, days);
  return res.json({ apy: rate, days, principal, projected: Number(amount.toFixed(2)) });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mock YellowBridge server running on http://localhost:${PORT}`);
});


