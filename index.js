const https = require('https');
let fs = require("fs")
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


const wikiUrl = 'https://en.wikipedia.org/wiki/Road_safety_in_Europe'

const config = {
    messages: {
        unknownError: "Something went wrong: Please check if the layout of wiki page has been modified",
        successMessage: "CSV file successfully created :./"
    },
    headingRow: 'Country,Area,Population in 2018,GDP per capita in 2018,Population density (inhabitants per km2) in 2017,Vehicle ownership (per thousand inhabitants) in 2016,Total Road Deaths in 2018,Road deaths per Million Inhabitants,Year'
}

function begin() {
    https.get(wikiUrl, async (resp) => {
        let data = '';
        // a data chunk has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // complete response has been received.
        resp.on('end', () => {
            const dom = new JSDOM(data);
            initiateProcessing(dom);
        });

    }).on("error", (err) => {
        console.log("Error " + err.message);
    });
}

function initiateProcessing(dom) {
    try {
        const filename = getFilename(dom);
        checkCsvExists(filename);
        parseData(dom, filename);
    } catch (error) {
        console.log("Error " + error.message);
    }
}

function getFilename(dom) {
    if (!dom.window.document.querySelector(".wikitable.sortable,.jquery-tablesorter")) {
        throw new Error(config.messages.unknownError)
    }
    let filename = dom.window.document.querySelector(".wikitable.sortable,.jquery-tablesorter").children[0].textContent.trim().replace(/ /g, "_") + ".csv";
    return "./data/" + filename
}

function parseData(dom, filename) {
    let i = 1;
    let c = 0;
    const result = []
    while (c <= 0) {
        let row = dom.window.document.querySelector(".wikitable.sortable,.jquery-tablesorter").children[1].children.item(i); // Parse DOM for each row
        if (row) {
            row = row.textContent.trim().replace(/,/g, "").replace(/\n/g, ",").replace(/,,/g, ",");
            row = row.split(",")
            row = [row[0], row[1], row[2], row[3], row[4], row[5], row[7], row[8]]
            row.push('2018')
            value = row[7] // value is used for sorting by Road deaths per Million Inhabitants
            row = row.join(",")
            result.push({ row, value })
            i++;
        } else {
            c++;
        }
    }
    let sortedResult = result.sort((a, b) => b.value - a.value).map(el => el.row) //sort Road deaths per Million Inhabitants in descending order
    sortedResult = [config.headingRow, ...sortedResult]

    const csvString = sortedResult.join("\n")
    fs.writeFileSync(filename, csvString);

    console.log(`${config.messages.successMessage}${filename}`);
}

function checkCsvExists(filename) {
    // delete the csv file if it already exist
    try {
        fs.statSync(filename);
        fs.unlinkSync(filename);
    } catch (error) {
        console.log("Pass");
    }
}

begin()