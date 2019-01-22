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
    url: "https://gz.lianjia.com/ershoufang/rs/",
    title: "list"
  },
  store: path.resolve(__dirname, "store.json"),
  options: {
    headers: {
      Host: "gz.lianjia.com",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,ko;q=0.8,en;q=0.7",
      Cookie:
        "lianjia_ssid=a491bc69-6e71-4f39-b1b6-8d6730024e27; lianjia_uuid=fa1e1638-2d94-4242-b049-6e0df95cbced; select_city=440100; all-lj=dafad6dd721afb903f2a315ab2f72633; TY_SESSION_ID=454b4314-a7ac-4a1e-b9da-bd297257f942; _smt_uid=5c46eae8.12abc066; Hm_lvt_9152f8221cb6243a53c83b956842be8a=1548151529; UM_distinctid=16875059f6c8b7-0ae8c74003c70d-47e1e39-1fa400-16875059f6d31d; CNZZDATA1255849599=1019480268-1548146761-%7C1548146761; CNZZDATA1254525948=1707318241-1548148688-%7C1548148688; CNZZDATA1255633284=600964053-1548147015-%7C1548147015; CNZZDATA1255604082=145860209-1548149149-%7C1548149149; _jzqa=1.250916574193066340.1548151530.1548151530.1548151530.1; _jzqc=1; _jzqckmp=1; _qzjc=1; _ga=GA1.2.1250622738.1548151533; _gid=GA1.2.1132953478.1548151533; Hm_lpvt_9152f8221cb6243a53c83b956842be8a=1548152044; _qzja=1.43775714.1548151530707.1548151530707.1548151530707.1548151746942.1548152044435.0.0.0.6.1; _qzjb=1.1548151530707.6.0.0.0; _qzjto=6.1.0; _jzqb=1.6.10.1548151530.1"
    }
  },
  rule: [
    {
      test: /ershoufang\/.*?\/$/,
      handle: ({ $, url, body, title, parent }) => {
        let list = [];
        $(".sellListContent>li").each(function(i, item) {
          let title = $(this)
            .find(".title>a")
            .text();
          let price = $(this)
            .find(".totalPrice>span")
            .text();
          let url = $(this)
            .find(".title>a")
            .attr("href");
          list.push({ title, url, price });
          console.log({ title, url, price });
        });
        return list;
      }
    },
    {
      test: /ershoufang\/.*?\.html$/,
      handle: ({ url, title, $, body, parent }) => {
        console.log(title, "详情页");
      }
    }
  ]
};

module.exports = config;
