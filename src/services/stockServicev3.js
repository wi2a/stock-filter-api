const axios = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');

const stockData = new Map(); // Memória temporária para armazenar os dados

async function getStocksfun(tickers = []) {
    const url = 'http://www.fundamentus.com.br/resultado.php';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.1; rv:2.2) Gecko/20110201',
        'Accept': 'text/html, text/plain, text/css, text/sgml, */*;q=0.01'
    };

    const data = {
        pl_min: '',
        pl_max: '',
        pvp_min: '',
        pvp_max: '',
        psr_min: '',
        psr_max: '',
        divy_min: '',
        divy_max: '',
        pativos_min: '',
        pativos_max: '',
        fgrah_max: '',
        firma_ebit_min: '',
        firma_ebit_max: '',
        margemebit_min: '',
        margemebit_max: '',
        margemliq_min: '',
        margemliq_max: '',
        liqcorr_min: '',
        liqcorr_max: '',
        roic_min: '',
        roic_max: '',
        roe_min: '',
        roe_max: '',
        liq_min: '',
        liq_max: '',
        patrim_min: '',
        patrim_max: '',
        divbruta_min: '',
        divbruta_max: '',
        tx_cresc_rec_min: '',
        tx_cresc_rec_max: '',
        setor: '',
        negociada: 'ON',
        ordem: '1',
        x: '28',
        y: '16'
    };

    // Verificar se os tickers já estão em cache
    const cachedData = {};
    const tickersToFetch = [];

    tickers.forEach(ticker => {
        if (stockData.has(ticker)) {
            cachedData[ticker] = stockData.get(ticker);
        } else {
            tickersToFetch.push(ticker);
        }
    });

    try {
        const response = await axios.post(url, querystring.stringify(data), { headers });
        const content = response.data;
        const $ = cheerio.load(content);
        const result = {};

        $('table#resultado tbody tr').each((index, element) => {
            const cells = $(element).find('td');
            const key = $(cells[0]).text().trim();
            if (tickers.length === 0 || tickers.includes(key)) {
                result[key] = {
                    'Cotacao': toDecimal($(cells[1]).text()),
                    'P/L': toDecimal($(cells[2]).text()),
                    'P/VP': toDecimal($(cells[3]).text()),
                    'PSR': toDecimal($(cells[4]).text()),
                    'DY': toDecimal($(cells[5]).text()),
                    'P/Ativo': toDecimal($(cells[6]).text()),
                    'P/Cap.Giro': toDecimal($(cells[7]).text()),
                    'P/EBIT': toDecimal($(cells[8]).text()),
                    'P/ACL': toDecimal($(cells[9]).text()),
                    'EV/EBIT': toDecimal($(cells[10]).text()),
                    'EV/EBITDA': toDecimal($(cells[11]).text()),
                    'Mrg.Ebit': toDecimal($(cells[12]).text()),
                    'Mrg.Liq.': toDecimal($(cells[13]).text()),
                    'Liq.Corr.': toDecimal($(cells[14]).text()),
                    'ROIC': toDecimal($(cells[15]).text()),
                    'ROE': toDecimal($(cells[16]).text()),
                    'Liq.2meses': toDecimal($(cells[17]).text()),
                    'Pat.Liq': toDecimal($(cells[18]).text()),
                    'Div.Brut/Pat.': toDecimal($(cells[19]).text()),
                    'Cresc.5anos': toDecimal($(cells[20]).text())
                };
                stockData.set(key, result[key]); // Armazenar em memória temporária
            }
        });

        // Combinar os dados em cache com os novos dados
        return { ...cachedData, ...result };
    } catch (error) {
        console.error('Error fetching data:', error.message);
        console.error('Error details:', error.response ? error.response.data : error);
        throw new Error('Erro ao buscar ações');
    }
}

function toDecimal(string) {
    string = string.replace('.', '').replace(',', '.');
    if (string.endsWith('%')) {
        string = string.slice(0, -1);
        return parseFloat(string) / 100;
    } else {
        return parseFloat(string);
    }
}

module.exports = { getStocksfun };

// Exemplo de uso
(async () => {
    console.log('[*] Downloading...');
    try {
        const tickers = []; // Deixe a lista de tickers vazia para buscar todos
        const result = await getStocksfun(tickers);
        console.log('[*] Download complete.');

        const headers = ['Papel', 'Cotacao', 'P/L', 'P/VP', 'PSR', 'DY', 'P/Ativo', 'P/Cap.Giro', 'P/EBIT', 'P/ACL', 'EV/EBIT', 'EV/EBITDA', 'Mrg.Ebit', 'Mrg.Liq.', 'Liq.Corr.', 'ROIC', 'ROE', 'Liq.2meses', 'Pat.Liq', 'Div.Brut/Pat.', 'Cresc.5anos'];
        console.log(headers.join(' '));
        console.log('-'.repeat(190));

        for (const [key, value] of Object.entries(result)) {
            console.log([
                key,
                value['Cotacao'],
                value['P/L'],
                value['P/VP'],
                value['PSR'],
                value['DY'],
                value['P/Ativo'],
                value['P/Cap.Giro'],
                value['P/EBIT'],
               ['P/ACL'],
                value['EV/EBIT'],
                value['EV/EBITDA'],
                value['Mrg.Ebit'],
                value['Mrg.Liq.'],
                value['Liq.Corr.'],
                value['ROIC'],
                value['ROE'],
                value['Liq.2meses'],
                value['Pat.Liq'],
                value['Div.Brut/Pat.'],
                value['Cresc.5anos']
            ].join(' '));
        }
    } catch (error) {
        console.error(error.message);
    }
})();
