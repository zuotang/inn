const rp = require("request-promise");
const request = require("request");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const config = require("./lianjia.js");

// 动态加载config文件
// function getConfig(filePath) {
//   let Module = module.constructor;
//   const code = fs.readFileSync(filePath, "utf8");
//   let m = new Module();
//   m._compile(code, "first.js");
//   let a = m.exports;
//   return a;
// }
(async () => {
  let store = { tree: [config.entry], record: [] };
  //如果存在记录则继续上次爬取
  if (fs.existsSync(config.store)) {
    console.log(
      "发现爬取记录，如果不需要接着上次记录下载。请手动删除store.json文件"
    );
    store = fs.readFileSync(config.store, "utf8");
    store = JSON.parse(store);
  }
  walk(store);
})();

async function walk(store) {
  let current = store.tree.pop();
  console.log(`还有[${store.tree.length}]页`);
  //判断是否是下载内容
  if (current.type == "download") {
    //下载文件处理
    let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
    current.fileName = current.fileName.replace(fileNameRegex, "");
    mkdirsSync(current.save);
    let filePath = path.resolve(__dirname, current.save, current.fileName);
    console.log(`下载[${filePath}]`);
    await new Promise((resolve, reject) => {
      request
        .get(current.url)
        .on("end", resolve)
        .on("error", reject)
        .pipe(fs.createWriteStream(filePath));
    });
  } else {
    console.log(`正在解析页面${current.url}`);
    //获取网页内容
    let body = await rp.get({ uri: current.url, ...config.options });
    const $ = cheerio.load(body);
    //使用规则匹配
    for (let { test, handle } of config.rule) {
      if (test.test(current.url)) {
        //解析按规则内容
        let children = await handle.call(config, { body, $, ...current });
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

  //下一步
  if (store.tree.length !== 0) {
    saveState(store);
    return walk(store);
  } else {
    console.log("全部下载完成");
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
  fs.writeFileSync(config.store, JSON.stringify(store), "utf8");
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
