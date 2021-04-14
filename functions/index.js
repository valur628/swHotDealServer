const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
//const fetch = require('node-fetch');
//const functions = require('firebase-functions');
//const getUrls = require('get-urls');
//const cors = require('cors')({ origin: true});

var resultList = [];
var cnt = 0;

function delay(ms) {
    return new Promise(function(resolve, reject) {
        setTimeout(function(){
            resolve();
        },ms);
    });
}

function getHTML(url) {
    return new Promise(resolve=>{
        delay(500).then(function() {
            axios.get(url).then(function(data) {
                resolve(data);
            });
        });
    })    
}
function main() {
    console.log('1');
    fs.readFile('search_list.txt','utf8',function(err, data){
        var allText = data;
        var list = allText.split('\n');
        var result = [];
        console.log('2');
        for(var i=0; i<list.length-1;i++){
            result.push(list[i]);
        }
        console.log('3');
        for(var j=0;j<result.length;j++){
            console.log('4');
            getHTML(result[j]).then(html => {
                let result = {};
                const $ = cheerio.load(html.data);
                result['SW_Name'] = $("body").find(".mature_content_filtered").text();
                /*result['title'] = $("body").find(".search_tit").text();
                result['date'] = $("body").find(".tit_loc").text();
                result['content_origin'] = $("body").find(".ins_view_pd").find(".paragraph").eq(1).text();*/
                return result;
            })
            .then(res => {
                console.log('5');
                cnt++;
                resultList.push(res);
                if(result.length == cnt){
                    fs.writeFile('result_json.txt', JSON.stringify(resultList), 'utf8', function(error){
                        console.log('write end');
                    });
                } 
            });
        }
        console.log('6');
    })
}

main()

/*

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
  });*/