const express = require('express');
const cron = require('node-cron');
const { getStocks } = require('./services/stockService.js');

const app = express();
const PORT = 3000;

app.get('/stocks', async (req, res) => {
  try {
    const stocks = await getStocks();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ações', error });
  }
});

// Agendamento diário às 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Executando atualização automática das ações...');
  await getStocks();
}, {
  scheduled: true,
  timezone: "America/Sao_Paulo"
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
