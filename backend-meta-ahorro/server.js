const express = require('express');
const cors = require('cors');
require('dotenv').config();

const ahorrosRoutes = require('./routes/ahorros.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/ahorros', ahorrosRoutes);

app.get('/', (req, res) => {
  res.send('API de Meta Ahorro funcionando');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});