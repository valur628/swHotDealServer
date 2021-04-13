const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const functions = require('firebase-functions');
const getUrls = require('get-urls');
const cors = require('cors')({ origin: true});

const cors = require('cors')({ origin: true});
const cors = require('cors')({ origin: true});
const cors = require('cors')({ origin: true});

const scrapeMetatags = (text) => {
    const urls = Array.from( getUrls(text) );

    const requests = urls.map(async url => {

        const res = await fetch(url);

        const html = await res.text();
        const $ = cheerio.load(html);
        
        const getMetatag = (name) =>  
            $('meta[name=${name}]').attr('content')
            $(`meta[name="og:${name}"]`).attr('content') ||  
            $(`meta[name="twitter:${name}"]`).attr('content');

        return { 
            url,
            title: $('title').first().text(),
            favicon: $('link[rel="shortcut icon"]').attr('href'),
            // description: $('meta[name=description]').attr('content'),
            description: getMetatag('description'),
            image: getMetatag('image'),
            author: getMetatag('author'),
        }
    });

    return Promise.all(requests);

}


function parseData(data) {
    try { JSON.parse(data); }
    catch (err) { return data; }
    return JSON.parse(data);
  }
  
  exports.scraper = functions.https.onRequest( async (request, response) => {
    console.log(request.body);
    cors(request, response, async () => {
      const body = parseData(request.body);
      const data = await scrapeMetatags(body.text);
      response.send(data);
      });
  });