const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { unidecode } = require('unidecode');
const { Decimal } = require('decimal.js');

async function getData(ticker, refresh = false) {
    const fileName = path.join(__dirname, 'cache', `${ticker}.json`);
    try {
        const dataLoaded = JSON.parse(fs.readFileSync(fileName, 'utf8'));
        const date = dataLoaded.date || 1701625668;
        if (dataLoaded) {
            if ((Date.now() / 1000 - date) > 1296000) {
                if (refresh) {
                    console.log("Cache antigo, atualizando.");
                    return await getRefreshedData(ticker);
                } else {
                    console.log("Cache antigo, mas não atualizando.");
                }
            }
            return dataLoaded;
        }
    } catch (err) {
        console.log("Arquivo não encontrado. Atualizando dados.");
    }

    if (refresh) {
        console.log("Atualizando dados.");
        return await getRefreshedData(ticker);
    }
    console.log("Dados não encontrados. Ative o refresh para atualizar.");
    return {};
}

async function getRefreshedData(ticker) {
    const fileName = path.join(__dirname, 'cache', `${ticker}.json`);
    const url = `https://investidor10.com.br/acoes/${ticker}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 6.1; rv:2.2) Gecko/20110201',
                'Accept': 'text/html, text/plain, text/css, text/sgml, */*;q=0.01'
            }
        });

        const content = response.data;
        const $ = cheerio.load(content);

        const indicatorsDiv = $('#table-indicators');
        const companyNumbersDiv = $('#table-indicators-company');

        const result = {};

        if (indicatorsDiv.length) {
            indicatorsDiv.children('div').each((i, cell) => {
                const title = removeAcentos($(cell).find('span').first().text().trim());
                const value = toDecimal($(cell).find('div').next().text().trim());
                result[toCamelCase(title)] = parseFloat(value);
            });
        } else {
            console.log("Div 'table-indicators' not found.");
        }

        if (companyNumbersDiv.length) {
            companyNumbersDiv.children('div').each((i, cell) => {
                const title = removeAcentos($(cell).find('span').first().text().trim());
                let value;
                try {
                    value = $(cell).find('span').eq(1).contents().eq(3).text().trim();
                } catch (err) {
                    value = $(cell).find('span').eq(1).text().trim();
                }
                value = fromStringToCorrectType(value);
                result[toCamelCase(title)] = value;
            });
        } else {
            console.log("Div 'table-indicators-company' not found.");
        }

        result.date = Date.now() / 1000;

        fs.writeFileSync(fileName, JSON.stringify(result, null, 4));
        return result;
    } catch (err) {
        console.log(err);
        console.log(`Ticker: ${ticker}, Erro ao abrir a página. Verifique se o ticker está correto. ${url}`);
        if (err.response && err.response.status === 404) {
            console.log("Ticker não encontrado, salvando arquivo vazio.");
            fs.writeFileSync(fileName, JSON.stringify({ date: Date.now() / 1000 }));
        }
        return {};
    }
}

function toCamelCase(s) {
    s = s.replace('.', '').replace(' / ', ' ').replace('/', ' ').replace(' - ', ' ');
    const parts = s.split(' ');
    return parts[0].toLowerCase() + parts.slice(1).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
}

function fromStringToCorrectType(value) {
    try {
        value = toDecimal(value);
    } catch (err) {
        // Do nothing
    }
    return value;
}

function toDecimal(string) {
    if (string === "-") {
        return 0;
    }
    string = string.replace('.', '').replace(',', '.');

    if (string.endsWith('%')) {
        string = string.slice(0, -1);
        return parseFloat(new Decimal(string).div(100));
    } else if (string.startsWith('R$')) {
        string = string.slice(2);
        return parseFloat(new Decimal(string));
    } else {
        return parseFloat(new Decimal(string));
    }
}

function removeAcentos(text) {
    return unidecode(text);
}

(async () => {
    const result = await getData(process.argv[2]);
    console.log(JSON.stringify(result, null, 4));
})();

module.exports = { getData };