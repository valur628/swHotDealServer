/*const request = require('request-promise'); 
const axios = require('axios');
const cheerio = require('cheerio');
//const fetch = require('node-fetch');
//const functions = require('firebase-functions');
//const getUrls = require('get-urls');
//const cors = require('cors')({ origin: true});*/

const fs = require('fs');
const morgan = require('morgan');
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
let HB_Split = [
	['"human_name":"', '"'],
	['DONT', ''],
	['DONT', ''],
	['"full_price":{"currency":"', '"'],
	['"full_price":{"currency":"USD","amount":', '}'],
	['"current_price":{"currency":"USD","amount":', '}'],
	['DONT', ''],
	['DONT', ''],
	['DONT', ''],
	['&amp;h=206&amp;w=360&amp;', '"'],
	['&amp;h=206&amp;w=360&amp;', '"']
]
let html;
let fileOutput = "";
app.use(morgan('combined'));
app.listen(8080, () => {
	console.log('hosted on 8080');
});
async function humblebundleWeb() {
	let splitValue = ["abcdefgh"];
	const browser = await puppeteer.launch({
		headless: true
	});
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36');
	await page.goto('https://www.humblebundle.com/store/api/search?sort=bestselling&filter=all&genre=software&page=0&request=1', {
		waitUntil: 'networkidle0'
	});
	html = await page.content();
	splitValue = html.split('standard_carousel_image":"');
	console.log("처음 " + splitValue[0]);
	page.close();
	browser.close();
	console.log("다음 " + splitValue[0]);
	return splitValue;
}

function humblebundleDB(splitValue, i) {
	let FB_object = {
		DB_LoadNumber: 0,
		DB_SWName: "Not SW Name",
		DB_DevName: "Not Dev Name",
		DB_DisPeriod: "0",
		DB_Currency: "USD",
		DB_Cost: 0.0,
		DB_DisPrice: 0.0,
		DB_DisRate: 0.0,
		DB_PlatAddress: "Not Address",
		DB_PlatName: "Not Site",
		DB_RepPicture: "Not Main Picture",
		DB_OthPicture: "Not Sub Picture"
	}
	FB_object.DB_LoadNumber = i;
	FB_object.DB_SWName = (splitValue[i].split(HB_Split[0][0])[1].toString()).split(HB_Split[0][1])[0].toString();
	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currecny = (splitValue[i].split(HB_Split[3][0])[1].toString()).split(HB_Split[3][1])[0].toString();
	FB_object.DB_Cost = (splitValue[i].split(HB_Split[4][0])[1].toString()).split(HB_Split[4][1])[0].toString();
	FB_object.DB_DisPrice = (splitValue[i].split(HB_Split[5][0])[1].toString()).split(HB_Split[5][1])[0].toString();
	FB_object.DB_DisRate = (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10) - 100;
	FB_object.DB_PlatAddress = "https://www.humblebundle.com/";
	FB_object.DB_PlatName = "HumbleBundle";
	FB_object.DB_RepPicture = "https://hb.imgix.net/880607b972d9cb3b02ebea9299905bd94c532edd.jpeg?auto=compress,format&fit=crop&h=206&w=360&" + splitValue[i].substring(splitValue[i].indexOf(HB_Split[9][0]) + 1, splitValue[i].indexOf(HB_Split[9][1]));
	FB_object.DB_OthPicture = "https://hb.imgix.net/880607b972d9cb3b02ebea9299905bd94c532edd.jpeg?auto=compress,format&fit=crop&h=206&w=360&" + splitValue[i].substring(splitValue[i].indexOf(HB_Split[10][0]) + 1, splitValue[i].indexOf(HB_Split[10][1]));
	fileOutput += JSON.stringify(FB_object, null, 5) + (i == splitValue.length - 1 ? "]}" : ",");
	/*fs.appendFile('result.json', JSON.stringify(FB_object, null, 5) + (i == splitValue.length-1 ? "]}" : ","), 'utf8', function(error) {
	    console.log(error);
	});*/
}
async function humblebundleMain() {
	splitValue = [];
	/*fs.writeFile('result.json', "", 'utf8', function(error) {
	    console.log('write start');
	});*/
	/*fs.appendFile('result.json', '{"HB_ObjName":"HumbleBundle","HB_Software": [', 'utf8', function(error) {
	    console.log(error);
	});*/
	fileOutput = JSON.stringify('{"HB_ObjName":"HumbleBundle","HB_Software": [');
	splitValue = await humblebundleWeb();
	console.log("다다음 " + splitValue);
	for(let i = 1; i < splitValue.length - 1; i++) {
		await humblebundleDB(splitValue, i);
	}
	await humblebundleDB(splitValue, splitValue.length - 1);
	fs.writeFile('result.json', fileOutput, 'utf8', function(error) {
		console.log(error);
	});
	/*fs.appendFile('result.json', "]}", 'utf8', function(error) {
	    console.log("end");
	});*/
}
humblebundleMain()




/*const scrapeMetatags = (text) => {
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
	  });*/