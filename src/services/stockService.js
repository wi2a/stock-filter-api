const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const NodeCache = require('node-cache');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // apenas para testes

const API_B3_URL = 'https://b3api.me/api/fundamentus/available';
const cache = new NodeCache({ stdTTL: 3600 }); // Cache com tempo de expiração de 1 hora

async function getStocks() {
  try {
    // Verificar se os dados já estão no cache
    let allTickers = cache.get('allTickers');
    if (!allTickers) {
      // 1. Buscar todos os tickers da B3API
      const response = await axios.get(API_B3_URL);
      allTickers = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      cache.set('allTickers', allTickers); // Armazenar no cache
    }

    // 2. Extrair os códigos (ex: PETR4) e transformar para padrão do Yahoo (ex: PETR4.SA)
    const tickers = allTickers.map(stock => stock.ticker + '.SA');

    const results = [];

    for (const ticker of tickers) {
      try {
        // Verificar se os dados do ticker já estão no cache
        let stockData = cache.get(ticker);
        if (!stockData) {
          const result = await yahooFinance.quoteSummary(ticker, {
            modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData"],
          });

          const price = result.price || {};
          const stats = result.defaultKeyStatistics || {};
          const financials = result.financialData || {};
          const summaryDetail = result.summaryDetail || {};

          const dividendYield = summaryDetail.dividendYield;
          const evEbit = stats.enterpriseToEbitda;
          const ebitMargin = financials.ebitdaMargins;
          const volume = financials.totalRevenue;

          stockData = {
            ticker,
            ev_ebit: evEbit,
            margem_ebit: ebitMargin,
            dividend_yield: dividendYield,
            volume: volume,
          };

          cache.set(ticker, stockData); // Armazenar no cache
        }

        results.push(stockData);

      } catch (err) {
        console.warn(`⚠️ Erro ao buscar ${ticker}: ${err.message}`);
      }
    }

    console.log(results);

    // 3. Filtro final conforme premissas
    const filtered = results.filter(stock =>
      stock.ev_ebit !== null &&
      stock.margem_ebit !== null &&
      stock.dividend_yield !== null &&
      stock.volume > 1000000 &&
      stock.ev_ebit > 0 &&
      stock.margem_ebit > 0 &&
      stock.dividend_yield > 0
    );

    // 4. Ordenar por EV/EBIT crescente
    filtered.sort((a, b) => a.ev_ebit - b.ev_ebit);

    return filtered;

  } catch (error) {
    console.error('Erro geral:', error.message);
    throw error;
  }
}


module.exports = { getStocks };