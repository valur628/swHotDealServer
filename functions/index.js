const firebase = require("firebase");
require("firebase/firestore");
const firestoreService = require('firestore-export-import');
const firebaseConfig = require('./config.js');
const serviceAccount = require('./serviceAccount.json');
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
let HB_lineTotal;
let S_lineTotal;
let HB_sublineTotal = 0;
let S_sublineTotal = 0;
const humblebundleRepeat = 20;
const steamRepeat = 50; //25가 기본 단위
const hostPort = 8080;

app.use(morgan('combined'));
app.listen(hostPort, () => {
	console.log('호스트 포트: ' + hostPort);
	console.log('웹 연결...');
});

function jsonSplit(splitValue, lines, SplitNum, DB_Split) {
	return(splitValue[lines].split(DB_Split[SplitNum][0])[1].toString()).split(DB_Split[SplitNum][1])[0].toString();
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

function humblebundleDB(splitValue, lines) {
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
	if((FB_object.DB_DisPrice == FB_object.DB_Cost) && (FB_object.DB_Cost != 0)) {
		FB_object.DB_DisPrice = -1;
		HB_sublineTotal++;
		return "0";
	}
	FB_object.DB_LoadNumber = HB_lineTotal - HB_sublineTotal + (S_lineTotal - S_sublineTotal);
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
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 9, HB_Split) + '.jpg';
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://hb.imgix.net/' + jsonSplit(splitValue, lines, 10, HB_Split) + '.jpg';
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5);
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

function steamDB(splitValue, lines) {
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
	} catch(error) {}
	try {
		priceTemp = jsonSplit(splitValue, lines, 5, S_Split);;
		FB_object.DB_DisPrice = parseInt(100 * parseFloat(priceTemp.replace(/₩/g, "").replace(/ /g, "").replace(/,/g, "")));
	} catch(error) {
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
	FB_object.DB_PlatAddress = "https://store.steampowered.com/" + jsonSplit(splitValue, lines, 7, S_Split);
	FB_object.DB_PlatName = "Steam";
	appidTemp = jsonSplit(splitValue, lines, 9, S_Split);
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/capsule_231x87.jpg';
	FB_object.DB_RepPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	pictureTemp = 'https://cdn.cloudflare.steamstatic.com/steam/' + appidTemp + '/header.jpg';
	FB_object.DB_OthPicture = pictureTemp.indexOf("&amp;") == -1 ? pictureTemp : pictureTemp.replace(/&amp;/g, "&");
	return JSON.stringify(FB_object, null, 5);
}

async function scrapingMain() {
	let fileOutput = '';
	let S_splitValue = [];
	let S_dbTemp = '';
	let S_pageNum = parseInt(1000 / steamRepeat);
	fs.writeFile('DBresult.json', '{"ScrapingDB": [', 'utf8', function(error) {
		console.log("데이터베이스 파일 만들기: " + error);
	});
	console.log('크롤링 시작...');
	for(let i = 0; i < S_pageNum; i++) {
		S_splitValue = await steamWeb(i);
		for(let j = 1; j < steamRepeat + 1; j++) {
			S_lineTotal = (j + (i * steamRepeat) - 1);
			S_dbTemp = steamDB(S_splitValue, j, S_pageNum);
			(S_lineTotal != (S_pageNum * steamRepeat) - 1) && (S_dbTemp != "0") ? fileOutput += (S_dbTemp + ","): fileOutput += "";
		}
	}
	let HB_splitValue = [];
	let HB_dbTemp = '';
	let HB_pageNum = 5;
	for(let i = 0; i < HB_pageNum; i++) {
		HB_splitValue = await humblebundleWeb(i);
		for(let j = 1; j < HB_splitValue.length; j++) {
			HB_lineTotal = (j + (i * humblebundleRepeat) - 1);
			HB_dbTemp = humblebundleDB(HB_splitValue, j, HB_pageNum);
			(HB_lineTotal != (HB_pageNum * humblebundleRepeat) - 1) && (HB_dbTemp != "0") ? fileOutput += (HB_dbTemp + ","): fileOutput += "";
		}
	}

	console.log('크롤링 종료');
	if(fileOutput.slice(-1) == ",") {
		fileOutput = fileOutput.slice(0, -1);
	}

	fs.appendFile('DBresult.json', fileOutput + ']}', 'utf8', function(error) {
		console.log("데이터베이스 파일 쓰기: " + error);
	});
	console.log("크롤링 및 데이터베이스 생성 끝");
}

const jsonToFirestore = async(jsonName) => {
	try {
		console.log('Firebase 초기화 중...');
		await firestoreService.initializeApp(serviceAccount, firebaseConfig.databaseURL);
		console.log('Firebase 초기화 완료');
		await firestoreService.restore('./' + jsonName);
		console.log(jsonName + ' 업로드 성공');
	} catch(error) {
		console.log('Firebase 업로드 에러: ' + error);
	}
};

async function WebScraper() { //24시간 반복 기능 삭제
	await scrapingMain();
	await jsonToFirestore("DBresult.json");
	console.log("크롤링 및 파이어베이스 업로드 종료");
}

WebScraper();