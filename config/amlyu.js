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
    url: "https://amlyu.com/page/1",
    title: "首页"
  },
  name: "amlyu",
  options: {
    headers: {
      Host: "amlyu.com",
      "Proxy-Connection": "keep-alive",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
    }
  },
  rule: [
    {
      test: /page\/\d/,
      handle: function($, body) {
        let list = [];
        let next = $(".next-page>a").attr("href");
        list.push({ url: next });
        $(".excerpts .excerpt").each(function(i, item) {
          let href = $(this)
            .find(".thumbnail")
            .attr("href");
          let thumb = $(this)
            .find(".thumbnail>img")
            .attr("src");
          let title = $(this)
            .find("h2>a")
            .text();
          list.push({
            url: href,
            title,
            thumb
          });
        });

        return list;
      }
    },
    {
      test: /\/\d{4}\/\d{2}\/\d{2}\//,
      handle: function($, body) {
        let list = [];
        let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
        let savePath = this.title.replace(fileNameRegex, "");
        $(".article-content img").each(function(i, item) {
          let url = $(this).attr("src");
          list.push({
            url,
            type: "download",
            fileName: urlToFileName(url),
            save: savePath
          });
        });
        return list;
      }
    }
  ]
};

module.exports = config;
