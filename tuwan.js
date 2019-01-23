const path = require("path");

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

const config = {
  entry: {
    url:
      "https://api.tuwan.com/apps/Welfare/getMenuList?from=pc&format=json&page=1",
    index: 1,
    type: "json",
    title: "首页"
  },
  store: path.resolve(__dirname, "store.json"),
  options: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36"
    }
  },
  rule: [
    {
      test: /apps\/Welfare\/getMenuList/,
      handle: function(json, body) {
        let list = json.data.map(item => {
          return {
            ...item,
            url: `https://api.tuwan.com/apps/Welfare/detail?type=image&dpr=3&format=json&id=${
              item.id
            }`,
            type: "json"
          };
        });
        let nextIndex = this.index + 1;
        console.log(this);
        list.unshift({
          url: `https://api.tuwan.com/apps/Welfare/getMenuList?from=pc&format=json&page=${nextIndex}`,
          index: nextIndex,
          type: "json",
          title: "首页"
        });
        return list;
      }
    },
    {
      test: /apps\/Welfare\/detail/,
      handle: function(json, body) {
        let list = [];
        json.thumb.map(item => {
          let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
          let savePath = this.title.replace(fileNameRegex, "");
          let url = item.replace(
            "NTgsMTU4LDksMywxLC0xLE5PTkUsLCw5MA==",
            "MjQyLDAsOSwzLDEsLTEsTk9ORSwsLDkw"
          );
          list.push({
            type: "download",
            url,
            save: savePath,
            fileName: urlToFileName(url)
          });
        });

        return list;
      }
    }
  ]
};

module.exports = config;
