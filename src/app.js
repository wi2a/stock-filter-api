const express = require('express');
const cron = require('node-cron');
const { getStocks } = require('./services/stockService.js');
// const { getData } = require('./services/stockServiceV2.js');
const {getStocksfun} = require('./services/stockServicev3.js');
const {getData} = require('./services/stockServicev4.js');
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

app.get('/stocksv2', async (req, res) => {
  try {
    const stocks = await getData();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar ações', error });
  }
});

app.get('/stocksv3', async (req, res) => {
  try {
    const tickers = req.query.tickers ? req.query.tickers.split(',') : [];
    const stocks = await getStocksfun(tickers);
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
