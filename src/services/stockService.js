const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // apenas para testes

const API_B3_URL = 'https://b3api.me/api/fundamentus/available';

async function getStocks() {
  try {
    // 1. Buscar todos os tickers da B3API
    const response = await axios.get(API_B3_URL);
    const allTickers = Array.isArray(response.data)
      ? response.data
      : response.data.data || [];

    // 2. Extrair os códigos (ex: PETR4) e transformar para padrão do Yahoo (ex: PETR4.SA)
    const tickers = allTickers
      .map(stock => stock.ticker + '.SA')
    .slice(0, 30); // limitar para testes, pode tirar o slice depois

    const results = [];

    for (const ticker of tickers) {
      try {
        const quote = await yahooFinance.quoteSummary(ticker, {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
        });

        const {
          enterpriseValue,
          ebitda,
          totalRevenue,
          profitMargins,
        } = quote.financialData;

        const { dividendYield } = quote.summaryDetail;
        // const { averageDailyVolume3Month } = quote.defaultKeyStatistics;
        const averageDailyVolume3Month = quote.defaultKeyStatistics?.enterpriseValue || 0;

        const evEbit = enterpriseValue && ebitda
          ? enterpriseValue / ebitda
          : null;

        const margemEbit = ebitda 
        // && totalRevenue
        //   ? ebitda / totalRevenue
        //   : null;

        results.push({
          ticker,
          ev_ebit: evEbit,
          margem_ebit: margemEbit,
          dividend_yield: dividendYield,
          volume: averageDailyVolume3Month,
        });

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
