const phantom = require('phantom');
const fs = require('fs');
const config = require('./config');

const url = config.url;

const ms2s = 1000;
const interval = 15 * ms2s;
let count = 1;
function sleep(time) {
  // logger2(`sleep ${time/1000} s`)
  return new Promise(res => {
    setTimeout(function() {
      res();
    }, time);
  })
}
async function beep(duration) {
  while (duration > 0) {
    await sleep(300);
    console.log("\007");
    duration --;
  }
}
async function canBook(page) {
  let res = false;
  res = await page.evaluate(function() {
    return $('#zreserve').text() === '我要看房';
  });
  logger2(` 测试结果: ${res}`)
  return res;
}

async function reqBook(page) {
  console.log(`
----------testing book  第${count}次请求------------`);
  logger2(`----------testing book  第${count}次请求------------`)
  const status = await canBook(page);
  logger(new Date().toString(), status);
  if (status) {
    await beep(3000);
  } else {
    await sleep(interval);
  }
  count ++;
  return status;
}

function logger(time, result, other) {
  try {
    let record = fs.readFileSync('log', 'utf-8');
    record += ` ${time} ${result ? '可预订' : 'no'}\n`;
    fs.writeFileSync('log', record);
  } catch(e) {
    console.log(e);
  }
}

function logger2(other) {
  try {
    let record = fs.readFileSync('log', 'utf-8');
    record += `${other}\n`;
    fs.writeFileSync('log', record);
  } catch(e) {
    console.log(e);
  }
}

(async function() {
    const instance = await phantom.create();
    
    let page = await instance.createPage();
    await page.on("onResourceRequested", function(requestData) {
        console.info('Requesting', requestData.url)
        // logger2(`Requesting  ${requestData.url}`)
    });
 
    const status = await page.open(url);
    console.log(status);

    while(true) {
      await reqBook(page);
      
      logger2(` 重新加载...`)
      await page.open(url);
    }

    // await instance.exit();
}());
