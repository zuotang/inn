
const rp = require("request-promise");
const request = require("request");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");



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

/*
url
save
fileName
*/
async function download(current, name, options) {
    //下载文件处理
    let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
    current.fileName = current.fileName.replace(fileNameRegex, "");
    let saveDir = path.resolve(__dirname, '../react-graphql/files', name, current.save);
    console.log(saveDir);
    let fileUrl = `/${name}/${current.save}/${current.fileName}`;
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
                .get({ url: current.url, ...options })
                .on("end", () => {
                    //删除下载标记文件
                    fs.unlinkSync(loadFilePath);
                    resolve();
                })
                .on("error", (e) => {
                    console.log('下载失败', e);
                    reject(e);
                })
                .pipe(fs.createWriteStream(filePath));
        });
    }
    return { url: fileUrl, filePath };
}


const urlToExt = url => {
    //从地址获取扩展名
    let urlArr = url.split(".");
    let extension = urlArr[urlArr.length - 1];
    return extension;
};
const urlToFileName = url => {
    let urlArr = url.split("/");
    let fileName = urlArr[urlArr.length - 1];
    return fileName;
};


const getDirName = name => {
    let splits = name.split('_');
    if (splits.length > 1 && splits[1].length > 3) {
        return splits[1].substr(0, 3);
    }
    return null;
};
module.exports = {
    download,
    mkdirsSync,
    addChildren,
    formatDataByType,
    urlToExt,
    urlToFileName,
    fileNameRegex: /[\\\/\*\"\|\?\<\>\:]/g,
    getDirName,
}