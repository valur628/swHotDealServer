/*const request = require('request-promise'); 
const axios = require('axios');
const cheerio = require('cheerio');
//const fetch = require('node-fetch');
//const functions = require('firebase-functions');
//const getUrls = require('get-urls');
//const cors = require('cors')({ origin: true});*/

//https://store.steampowered.com/search/results/?query&start=000&count=1700&dynamic_data=&force_infinite=1&category1=994%2C996&snr=1_7_7_230_7&infinite=1
//var database = firebase.database();
const firebase = require("firebase");
require("firebase/firestore");
const firestoreService = require ( 'firestore-export-import'); 
const firebaseConfig = require ('./config.js'); 
const serviceAccount = require ('./serviceAccount.json'); 

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
let HB_sublineTotal = 0;
let S_sublineTotal = 0;
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
	await HB_page.waitForTimeout(500 + (Math.floor(Math.random() * 1500)));
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
		DB_Cost: 0,
		DB_DisPrice: -1,
		DB_DisRate: 0,
		DB_PlatAddress: "Not Address",
		DB_PlatName: "Not Site",
		DB_RepPicture: "Not Main Picture",
		DB_OthPicture: "Not Sub Picture"
	}
	FB_object.DB_Cost = parseInt(100 * parseFloat(jsonSplit(splitValue, lines, 4, HB_Split)));
	FB_object.DB_DisPrice = parseInt(100 * parseFloat(jsonSplit(splitValue, lines, 5, HB_Split)));
	if((FB_object.DB_DisPrice == FB_object.DB_Cost) && (FB_object.DB_Cost != 0)){
		FB_object.DB_DisPrice = -1;
		HB_sublineTotal++;
		return "0";
	}
	FB_object.DB_LoadNumber = HB_lineTotal - HB_sublineTotal;
	nameTemp = jsonSplit(splitValue, lines, 0, HB_Split);
	nameTemp = nameTemp.replace(/&amp;/g, "&").replace(/&2122/g, "");
	nameTemp = nameTemp.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/g, "").replace(/\\u00a0/g, " ");
	FB_object.DB_SWName = nameTemp.replace(/\\u/g, "");
	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currency = jsonSplit(splitValue, lines, 3, HB_Split);
	FB_object.DB_DisRate = parseInt(100 * parseFloat(100 - (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10)));
	FB_object.DB_PlatAddress = "https://www.humblebundle.com/store/" + jsonSplit(splitValue, lines, 7, HB_Split);
	FB_object.DB_PlatName = "HumbleBundle";
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 9, HB_Split);
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 10, HB_Split);
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5);
}
async function humblebundleMain() {
	let splitValue = [];
	let dbTemp = '';
	let fileOutput = '';
	let pageNum = 5;
	fs.writeFile('HB_result.json', '{"humblebundleDB": [', 'utf8', function(error) {
		console.log(error);
	});
	for(let i = 0; i < pageNum; i++) {
		splitValue = await humblebundleWeb(i);
		for(let j = 1; j < splitValue.length; j++) {
			HB_lineTotal = (j + (i * humblebundleRepeat) - 1);
			dbTemp = humblebundleDB(splitValue, j, pageNum);
			(HB_lineTotal != (pageNum * humblebundleRepeat) - 1) && (dbTemp != "0") ? fileOutput += (dbTemp + ",") : fileOutput += "";
		}
	}
	if(fileOutput.slice(-1) == ",") { fileOutput = fileOutput.slice(0, -1); }
	fs.appendFile('HB_result.json', fileOutput + ']}', 'utf8', function(error) {
		console.log(error);
	});
	console.log("HumbleBundle-END");
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
	await S_page.waitForTimeout(500 + (Math.floor(Math.random() * 1500)));

	html = html.replace(/(?:\\[rnt]|[\r\n\t])/g, "").replace(/\s\s+/g, ' ');
	html = html.replace(/&lt;\\/g, "<").replace(/&lt;/g, "<").replace(/&gt;\\/g, ">").replace(/&gt;/g, ">");
	html = html.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
	html = html.replace(/\\\//g, "/").replace(/\\\"/g, '"').replace(/ ₩/g, "₩");
	splitValue = html.split('<a href="');
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
		DB_Cost: 0,
		DB_DisPrice: -1,
		DB_DisRate: 0,
		DB_PlatAddress: "Not Address",
		DB_PlatName: "Not Site",
		DB_RepPicture: "Not Main Picture",
		DB_OthPicture: "Not Sub Picture"
	}
	try {
		priceTemp = jsonSplit(splitValue, lines, 4, S_Split);;
		FB_object.DB_Cost = parseInt(100 * parseFloat(priceTemp.replace(/₩/g, "").replace(/ /g, "").replace(/,/g, "")));
	}
	catch(error) { }
	
	try {
		priceTemp = jsonSplit(splitValue, lines, 5, S_Split);;
		FB_object.DB_DisPrice = parseInt(100 * parseFloat(priceTemp.replace(/₩/g, "").replace(/ /g, "").replace(/,/g, "")));
	}
	catch(error) {
		S_sublineTotal++;
		return "0";
	}

	FB_object.DB_LoadNumber = S_lineTotal - S_sublineTotal;
	nameTemp = jsonSplit(splitValue, lines, 0, S_Split);
	nameTemp = nameTemp.replace(/&amp;/g, "&").replace(/&2122/g, "");
	nameTemp = nameTemp.replace(/^[\s\u00a0\u3000]+|[\s\u00a0\u3000]+$/g, "");
	FB_object.DB_SWName = nameTemp.replace(/\\u/g, "").replace(/\\u00a0/g, " ");
	FB_object.DB_DevName = "Not Dev";
	FB_object.DB_DisPeriod = 20000101;
	FB_object.DB_Currency = "KRW";
	
	FB_object.DB_DisRate = !FB_object.DB_Cost && !FB_object.DB_DisPrice ? 0 : parseInt(100 * parseFloat(100 - (Math.round(((parseInt(FB_object.DB_DisPrice) / parseInt(FB_object.DB_Cost)) * 100) * 10) / 10)));
	//!FB_object.DB_DisRate || (!FB_object.DB_Cost == ) 할인율 관련해서 뜯어고치고, 할인율이 있는 상품만 저장하는 방식으로 변경, 당연하지만 할인율이 맨 위에 가서 최적화할 수 있게 설계
	FB_object.DB_PlatAddress = "https://store.steampowered.com/" + jsonSplit(splitValue, lines, 7, S_Split);
	FB_object.DB_PlatName = "Steam";
	appidTemp = jsonSplit(splitValue, lines, 9, S_Split);
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/capsule_231x87.jpg';
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/header.jpg';
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5);
}
async function steamMain() {
	let splitValue = [];
	let dbTemp = '';
	let fileOutput = '';
	let pageNum = parseInt(500 / steamRepeat);
	fs.writeFile('S_result.json', '{"steamDB": [', 'utf8', function(error) {
		console.log(error);
	});
	for(let i = 0; i < pageNum; i++) {
		splitValue = await steamWeb(i);
		for(let j = 1; j < steamRepeat + 1; j++) {
			S_lineTotal = (j + (i * steamRepeat) - 1);
			dbTemp = steamDB(splitValue, j, pageNum);
			(S_lineTotal != (pageNum * steamRepeat) - 1) && (dbTemp != "0") ? fileOutput += (dbTemp + ",") : fileOutput += "";
		}
	}
	if(fileOutput.slice(-1) == ",") { fileOutput = fileOutput.slice(0, -1); }
	fs.appendFile('S_result.json', fileOutput + ']}', 'utf8', function(error) {
		console.log(error);
	});
	console.log("STEAM-END");
}

const jsonToFirestore = async (jsonName) => {
	try {
	  console.log('Initialzing Firebase');
	  await firestoreService.initializeApp(serviceAccount, firebaseConfig.databaseURL);
	  console.log('Firebase Initialized');
  
	  await firestoreService.restore('./' + jsonName);
	  console.log('Upload Success');
	}
	catch (error) {
	  console.log(error);
	}
  };
  

async function WebScraper()
{
	await humblebundleMain();
	await steamMain();
	await jsonToFirestore("HB_result.json");
	await jsonToFirestore("S_result.json");
	console.log("END");
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
/*
function webSend(){
	firebase.initializeApp({
		apiKey: "AIzaSyA8BmTLD9zOdLXlK3i39I7odZIvAboomHE",
		authDomain: "swhotdealtest.firebaseapp.com",
		projectId: "swhotdealtest",
		storageBucket: "swhotdealtest.appspot.com",
		messagingSenderId: "998725582733",
		appId: "1:998725582733:web:d9326e7cedd09649f947c4",
		measurementId: "G-1ZKX1DXN3Q"
});

var db = firebase.firestore();
HB_Result
var humblebundleData = [{
	"DB_LoadNumber": 0,
	"DB_SWName": "DisplayFusion",
	"DB_DevName": "Not Dev",
	"DB_DisPeriod": 20000101,
	"DB_Currency": "USD",
	"DB_Cost": 3499,
	"DB_DisPrice": 1748,
	"DB_DisRate": 5000,
	"DB_PlatAddress": "https://www.humblebundle.com/store/displayfusion",
	"DB_PlatName": "HumbleBundle",
	"DB_RepPicture": "https://hb.imgix.net/f4905ead68a0e8281d400ff203b1620a34791f90.jpg?auto=compress,format&fit=crop&h=154&w=270&s=5c5ad4f08ce0f6d29a6efb7bb080048f",
	"DB_OthPicture": "https://hb.imgix.net/f4905ead68a0e8281d400ff203b1620a34791f90.jpg?auto=compress,format&fit=crop&h=353&w=616&s=919dd2ceae3ca020df15b0db9eca0f37"
},{
	"DB_LoadNumber": 1,
	"DB_SWName": "Black Ink",
	"DB_DevName": "Not Dev",
	"DB_DisPeriod": 20000101,
	"DB_Currency": "USD",
	"DB_Cost": 5999,
	"DB_DisPrice": 3599,
	"DB_DisRate": 4000,
	"DB_PlatAddress": "https://www.humblebundle.com/store/black-ink",
	"DB_PlatName": "HumbleBundle",
	"DB_RepPicture": "https://hb.imgix.net/0f5f1c8dfe9c94db17036db8ba6bc7534f3b1705.jpg?auto=compress,format&fit=crop&h=154&w=270&s=b66b7f3cc78323a1b04144b4c09fbe97",
	"DB_OthPicture": "https://hb.imgix.net/0f5f1c8dfe9c94db17036db8ba6bc7534f3b1705.jpg?auto=compress,format&fit=crop&h=353&w=616&s=cc30f9e90c10e0421efa5b4d001434b3"
},{
	"DB_LoadNumber": 2,
	"DB_SWName": "Movavi Video Suite 2020 Steam Edition - - Video Making Software - Edit, Convert, Capture Screen, and more",
	"DB_DevName": "Not Dev",
	"DB_DisPeriod": 20000101,
	"DB_Currency": "USD",
	"DB_Cost": 7998,
	"DB_DisPrice": 2799,
	"DB_DisRate": 6500,
	"DB_PlatAddress": "https://www.humblebundle.com/store/movavi-video-suite-2020",
	"DB_PlatName": "HumbleBundle",
	"DB_RepPicture": "https://hb.imgix.net/6762f9ce598b043321e10ed4e409cf67f7835d43.jpeg?auto=compress,format&fit=crop&h=154&w=270&s=24e2ebaf30d7b7adde6d7c9e07a8776f",
	"DB_OthPicture": "https://hb.imgix.net/6762f9ce598b043321e10ed4e409cf67f7835d43.jpeg?auto=compress,format&fit=crop&h=353&w=616&s=c7fee6073cf7357a3419ace8c859a44f"
},{
	"DB_LoadNumber": 3,
	"DB_SWName": "3DMark, PCMark 10 & VRMark Bundle",
	"DB_DevName": "Not Dev",
	"DB_DisPeriod": 20000101,
	"DB_Currency": "USD",
	"DB_Cost": 5999,
	"DB_DisPrice": 899,
	"DB_DisRate": 8500,
	"DB_PlatAddress": "https://www.humblebundle.com/store/3dmark-pcmark10-and-vrmark-bundle",
	"DB_PlatName": "HumbleBundle",
	"DB_RepPicture": "https://hb.imgix.net/ecb9eb5ff6cd7e38d7f8d9976d81176db71b799d.jpg?auto=compress,format&fit=crop&h=154&w=270&s=26333227287250fd3cf6d649741497b6",
	"DB_OthPicture": "https://hb.imgix.net/ecb9eb5ff6cd7e38d7f8d9976d81176db71b799d.jpg?auto=compress,format&fit=crop&h=353&w=616&s=ca0c50fa90f319db774167daac90ef2e"
}];
let steamData;

//humblebundleData = [fs.readFileSync('HB_result.json', 'utf8')];

fs.readFile('S_result.json', 'utf8', function(err, data){
	console.log(err);
	steamData = data;
});


humblebundleData.forEach(function(obj){
	db.collection("humblebundleData").add({
			DB_LoadNumber : obj.DB_LoadNumber,
			DB_SWName : obj.DB_SWName,
			DB_DevName :obj.DB_DevName,
			DB_DisPeriod :obj.DB_DisPeriod,
			DB_Currency :obj.DB_Currency,
			DB_Cost :obj.DB_Cost,
			DB_DisPrice : obj.DB_DisPrice,
			DB_DisRate : obj.DB_DisRate,
			DB_PlatAddress : obj.DB_PlatAddress,
			DB_PlatName : obj.DB_PlatName,
			DB_RepPicture : obj.DB_RepPicture,
			DB_OthPicture : obj.DB_OthPicture
	}).then(function(docRef) {
		console.log("Document written with ID: ", docRef.id);
	})
	.catch(function(error) {
		console.error("Error adding document: ", error);
	});
})
}
*/