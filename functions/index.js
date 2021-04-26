/*const request = require('request-promise'); 
const axios = require('axios');
const cheerio = require('cheerio');
//const fetch = require('node-fetch');
//const functions = require('firebase-functions');
//const getUrls = require('get-urls');
//const cors = require('cors')({ origin: true});*/

//https://store.steampowered.com/search/results/?query&start=000&count=1700&dynamic_data=&force_infinite=1&category1=994%2C996&snr=1_7_7_230_7&infinite=1

const fs = require('fs');
const morgan = require('morgan');
const express = require('express');
const puppeteer = require('puppeteer');
const { mainModule } = require('process');
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

let S_Split = [
	['<span class="title">', '</span>'],
	['DONT', ''],
	['DONT', ''],
	['DONT', ''],
	['>₩ ', ' </'],
	['</span><br>₩ ', ' </'],
	['DONT', ''],
	['store.steampowered.com/', '/?'],
	['DONT', ''],
	['img src="https://cdn.cloudflare.steamstatic.com/steam/', '/capsule'],
	['DONT', '']
]

let html;
let fileOutput;
let HB_lineTotal;
let S_lineTotal;
const humblebundleRepeat = 20;
const steamRepeat = 50; //25가 기본 단위

app.use(morgan('combined'));
app.listen(8080, () => {
	console.log('hosted on 8080');
});

function jsonSplit(splitValue, lines, SplitNum, DB_Split){
	return (splitValue[lines].split(DB_Split[SplitNum][0])[1].toString()).split(DB_Split[SplitNum][1])[0].toString();
}

async function humblebundleWeb(pageCount) {
	let splitValue = ["abcdefgh"];
	const HB_browser = await puppeteer.launch({
		headless: true
	});
	const HB_page = await HB_browser.newPage();
	await HB_page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36');
	await HB_page.goto('https://www.humblebundle.com/store/api/search?sort=bestselling&filter=all&genre=software&page=' + pageCount + '&request=1', {
		waitUntil: 'networkidle0'
	});

	html = await HB_page.content();
	await HB_page.waitForTimeout(500 + (Math.floor(Math.random() * 1000)));
	splitValue = html.split('standard_carousel_image":"');
	await HB_page.close();
	await HB_browser.close();
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
	FB_object.DB_LoadNumber = HB_lineTotal;
	nameTemp = jsonSplit(splitValue, lines, 0, HB_Split);
	nameTemp = nameTemp.replace(/&amp;/g, "&").replace(/&2122/g, "");
	nameTemp = nameTemp.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/g, "").replace(/\\u00a0/g, " ");
	FB_object.DB_SWName = nameTemp.replace(/\\u/g, "");
	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currency = jsonSplit(splitValue, lines, 3, HB_Split);
	FB_object.DB_Cost = parseFloat(jsonSplit(splitValue, lines, 4, HB_Split));
	FB_object.DB_DisPrice = parseFloat(jsonSplit(splitValue, lines, 5, HB_Split));
	FB_object.DB_DisRate = parseFloat(100 - (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10));
	FB_object.DB_PlatAddress = "https://www.humblebundle.com/store/" + jsonSplit(splitValue, lines, 7, HB_Split);
	FB_object.DB_PlatName = "HumbleBundle";
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 9, HB_Split);
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 10, HB_Split);
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5) + (HB_lineTotal == (pageNum * humblebundleRepeat) - 1 ? "]}" : ",");
}
async function humblebundleMain() {
	let splitValue = [];
	let fileOutput = '';
	let pageNum = 5;
	fs.writeFile('HB_result.json', '{"DB_Category":"HumbleBundle","DB_Software": [', 'utf8', function(error) {
		console.log(error);
	});
	for(let i = 0; i < pageNum; i++) {
		splitValue = await humblebundleWeb(i);
		for(let j = 1; j < splitValue.length; j++) {
			HB_lineTotal = (j + (i * humblebundleRepeat) - 1);
			fileOutput += humblebundleDB(splitValue, j, pageNum);
		}
	}
	fs.appendFile('HB_result.json', fileOutput, 'utf8', function(error) {
		console.log(error);
	});
}


async function steamWeb(pageCount) {
	let splitValue = ["abcdefgh"];
	const S_browser = await puppeteer.launch({
		headless: true
	});
	const S_page = await S_browser.newPage();
	await S_page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36');
	await S_page.goto('https://store.steampowered.com/search/results/?query&start=' + pageCount * steamRepeat + '&count=' + steamRepeat + '&dynamic_data=&sort_by=_ASC&category1=994%2C996&infinite=1', {
		waitUntil: 'networkidle0'
	});
	html = await S_page.content();
	await S_page.waitForTimeout(500 + (Math.floor(Math.random() * 1000)));

	html = html.replace(/(?:\\[rnt]|[\r\n\t])/g, "").replace(/\s\s+/g, ' ');
	html = html.replace(/&lt;\\/g, "<").replace(/&lt;/g, "<").replace(/&gt;\\/g, ">").replace(/&gt;/g, ">");
	html = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
	html = html.replace(/\\\//g, "/").replace(/\\\"/g, '"').replace(/ ₩/g, "₩");
	splitValue = html.split('<a href="');
	fs.writeFile('result_steam_txt.txt', html, 'utf8', function(error) {
		console.log(error);
	});
	await S_page.close();
	await S_browser.close();
	return splitValue;
}

function steamDB(splitValue, lines, pageNum) {
	let FB_object = {
		DB_LoadNumber: 0,
		DB_SWName: "Not SW Name",
		DB_DevName: "Not Dev Name",
		DB_DisPeriod: "0",
		DB_Currency: "KRW",
		DB_Cost: 0.0,
		DB_DisPrice: 0.0,
		DB_DisRate: 0.0,
		DB_PlatAddress: "Not Address",
		DB_PlatName: "Not Site",
		DB_RepPicture: "Not Main Picture",
		DB_OthPicture: "Not Sub Picture"
	}
	FB_object.DB_LoadNumber = S_lineTotal;
	nameTemp = jsonSplit(splitValue, lines, 0, S_Split);
	nameTemp = nameTemp.replace(/&amp;/g, "&").replace(/&2122/g, "");
	nameTemp = nameTemp.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/g, "");
	FB_object.DB_SWName = nameTemp.replace(/\\u/g, "").replace(/\\u00a0/g, " ");
	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currency = "KRW";
	try {
		priceTemp = jsonSplit(splitValue, lines, 4, S_Split);;
		FB_object.DB_Cost = parseFloat(priceTemp.replace(/₩/g, "").replace(/ /g, "").replace(/,/g, ""));
	}
	catch(error) { }
	try {
		priceTemp = jsonSplit(splitValue, lines, 5, S_Split);;
		FB_object.DB_DisPrice = parseFloat(priceTemp.replace(/₩/g, "").replace(/ /g, "").replace(/,/g, ""));
	}
	catch(error) { }
	FB_object.DB_DisRate = parseFloat(100 - (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10));
	
	FB_object.DB_PlatAddress = "https://store.steampowered.com/" + jsonSplit(splitValue, lines, 7, S_Split);
	FB_object.DB_PlatName = "Steam";
	appidTemp = jsonSplit(splitValue, lines, 9, S_Split);
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/capsule_231x87.jpg';
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/header.jpg';
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5) + (S_lineTotal == (pageNum * steamRepeat) - 1 ? "]}" : ",");
}
async function steamMain() {
	let splitValue = [];
	let fileOutput = '';
	let pageNum = parseInt(400 / steamRepeat);
	fs.writeFile('S_result.json', '{"DB_Category":"Steam","DB_Software": [', 'utf8', function(error) {
		console.log(error);
	});
	for(let i = 0; i < pageNum; i++) {
		splitValue = await steamWeb(i);
		for(let j = 1; j < steamRepeat + 1; j++) {
			S_lineTotal = (j + (i * steamRepeat) - 1);
			fileOutput += steamDB(splitValue, j, pageNum);
		}
	}
	fs.appendFile('S_result.json', fileOutput, 'utf8', function(error) {
		console.log(error);
	});
}

async function WebScraper()
{
	await humblebundleMain();
	await steamMain();
}

WebScraper();


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