const rp = require("request-promise");
const request = require("request");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const config = require("./config/twitter.js");

const storeFile = path.resolve(__dirname, "./store/", `${config.name}.json`);
// 动态加载config文件
// function getConfig(filePath) {
//   let Module = module.constructor;
//   const code = fs.readFileSync(filePath, "utf8");
//   let m = new Module();
//   m._compile(code, "first.js");
//   let a = m.exports;
//   return a;
// }

/*
Store
  tree #状态树
    Context #上下文
      *url
      *title
      type download|json|string|html(default)
  record #历史记录

*/

(async () => {
  let store = { tree: [config.entry], record: [] };
  //如果存在记录则继续上次爬取
  if (fs.existsSync(storeFile)) {
    console.log(
      `发现爬取记录，如果不需要接着上次记录下载。请手动删除[${storeFile}]文件`
    );
    store = fs.readFileSync(storeFile, "utf8");
    store = JSON.parse(store);
  }
  walk(store);
})();

async function walk(store) {
  let current = store.tree.pop();
  // 如果记录存在则跳过
  if(store.record.includes(current.url)){
    return next(store);
  }
  console.log(`还有[${store.tree.length}]页`);
  //判断是否是下载内容
  if (current.type == "download") {
    //下载文件处理
    let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
    current.fileName = current.fileName.replace(fileNameRegex, "");
    let saveDir = path.resolve(__dirname, "./download/", current.save);
    mkdirsSync(saveDir);
    let filePath = path.resolve(saveDir, current.fileName);
    //下载标记文件
    let loadFilePath = filePath + ".load";
    //文件是否需要下载
    if (!fs.existsSync(filePath) || fs.existsSync(loadFilePath)) {
      fs.writeFileSync(loadFilePath, "", "utf8");
      console.log(`下载[${filePath}]`);
      await new Promise((resolve, reject) => {
        request
          .get({url:current.url,...config.options})
          .on("end", () => {
            //删除下载标记文件
            fs.unlinkSync(loadFilePath);
            resolve();
          })
          .on("error", reject)
          .pipe(fs.createWriteStream(filePath));
      });
    }
  } else {
    console.log(`正在解析页面${current.url}`);
    //获取网页内容
    let body = await rp.get({ uri: current.url, ...config.options });
    //格式化数据
    let $ = formatDataByType(current.type, body);
    //使用规则匹配
    for (let { test, handle } of config.rule) {
      if (test.test(current.url)) {
        //解析按规则内容
        let children = await handle.call(current, $, body);
        //如果处理返回的是列表
        if (Array.isArray(children)) {
          children.map(item => {
            addChildren(store, item, current);
          });
        } else if (children) {
          addChildren(store, children, current);
        }
      }
    }
  }
  // 加入历史记录
  store.record.push(current.url);
  saveState(store);
  return next(store);
  
}
// 下一步
function next(store){
  if (store.tree.length !== 0) {
    return walk(store);
  } else {
    console.log("全部下载完成");
  }
 
}


// 通过类型格式化数据
function formatDataByType(type, body) {
  switch (type) {
    case "json":
      return JSON.parse(body);
    case "string":
      return body;
    case "html":
    default:
      return cheerio.load(body);
  }
}

function addChildren(store, item, parent) {
  // 添加链
  item.parent = parent;
  if (!item.url) {
    throw `rule ${item.test} return url is undefined`;
  } else {
    store.tree.push(item);
  }
}

//保存状态
function saveState(store) {
  mkdirsSync(path.resolve(__dirname, "./store"));
  fs.writeFileSync(storeFile, JSON.stringify(store), "utf8");
}

// 递归创建目录 同步方法
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}
