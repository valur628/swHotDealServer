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
	['"human_url":"', '"'],
	['DONT', ''],
	['"featured_image_recommendation":"https://hb.imgix.net/', '"'],
	['"large_capsule":"https://hb.imgix.net/', '"']
]
let html;
let fileOutput;
let lineTotal;

app.use(morgan('combined'));
app.listen(8080, () => {
	console.log('hosted on 8080');
});
async function humblebundleWeb(pageNum) {
	let splitValue = ["abcdefgh"];
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36');
	await page.goto('https://www.humblebundle.com/store/api/search?sort=bestselling&filter=all&genre=software&page=' + pageNum + '&request=1', { waitUntil: 'networkidle0' });
	html = await page.content();
	await page.waitFor(500);
	splitValue = html.split('standard_carousel_image":"');
	page.close();
	browser.close();
	return splitValue;
}

function humblebundleDB(splitValue, lines, pageNum) {
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
	FB_object.DB_LoadNumber = lineTotal;

	nameTemp = (splitValue[lines].split(HB_Split[0][0])[1].toString()).split(HB_Split[0][1])[0].toString();
	nameTemp = nameTemp.replace(/&amp;/g, "&");
	nameTemp = nameTemp.replace(/&2122/g, "");
	nameTemp = nameTemp.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/g, "")
	nameTemp = nameTemp.replace(/\\u00a0/g, " ");
	FB_object.DB_SWName = nameTemp.replace(/\\u/g, "");

	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currecny = (splitValue[lines].split(HB_Split[3][0])[1].toString()).split(HB_Split[3][1])[0].toString();
	FB_object.DB_Cost = (splitValue[lines].split(HB_Split[4][0])[1].toString()).split(HB_Split[4][1])[0].toString();
	FB_object.DB_DisPrice = (splitValue[lines].split(HB_Split[5][0])[1].toString()).split(HB_Split[5][1])[0].toString();
	FB_object.DB_DisRate =  100 - (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10);
	FB_object.DB_PlatAddress = "https://www.humblebundle.com/store/" + (splitValue[lines].split(HB_Split[7][0])[1].toString()).split(HB_Split[7][1])[0].toString();
	FB_object.DB_PlatName = "HumbleBundle";

	pictureTemp = 'https://hb.imgix.net/' + (splitValue[lines].split(HB_Split[9][0])[1].toString()).split(HB_Split[9][1])[0].toString();
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");

	pictureTemp = 'https://hb.imgix.net/' + (splitValue[lines].split(HB_Split[10][0])[1].toString()).split(HB_Split[10][1])[0].toString();
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");

	return JSON.stringify(FB_object, null, 5) + (lineTotal == (pageNum * 20) - 1 ? "]}" : ",");
	/*fs.appendFile('result.json', JSON.stringify(FB_object, null, 5) + (i == splitValue.length-1 ? "]}" : ","), 'utf8', function(error) {
	    console.log(error);
	});*/
}
async function humblebundleMain() {
	let splitValue = [];
	fileOutput = '';
	pageNum = 5;
	fs.writeFile('result.json', '{"HB_ObjName":"HumbleBundle","HB_Software": [', 'utf8', function(error) {
		console.log(error);
	});
	/*fs.writeFile('result.json', "", 'utf8', function(error) {
	    console.log('write start');
	});*/
	/*fs.appendFile('result.json', '{"HB_ObjName":"HumbleBundle","HB_Software": [', 'utf8', function(error) {
	    console.log(error);
	});*/
	
	for(let i = 0; i < pageNum; i++) {
	splitValue = await humblebundleWeb(i);
	console.log("다다음 " + splitValue);
	for(let j = 1; j < splitValue.length; j++) {
		lineTotal = (j + (i * 20) - 1);
		fileOutput += await humblebundleDB(splitValue, j, pageNum);
	}
	}
	//await humblebundleDB(splitValue, (pageNum * 20) - 1, pageNum);
		fs.appendFile('result.json', fileOutput, 'utf8', function(error) {
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