const path = require("path");

const config = {
  entry: {
    url: "http://www.musicheng.com/learn/grade",
    title: "全部课程"
  },
  name: "musicheng",
  options: {
    headers: {
      Host: "www.musicheng.com",
      "Proxy-Connection": "keep-alive",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      Cookie:
        "_ga=GA1.2.1545204414.1547911824; Hm_lvt_23c29ef18f57ef3419152a651c437547=1547911824; ASP.NET_SessionId=2ofx2rto0ukk53u3qs1glxgc; loginmodel=loginname=&loginpassword=&chsavepsw=0; _gid=GA1.2.99412332.1548080071; _gat_gtag_UA_129654797_1=1; otinfo=_siNt=1&_clri=7635603404191521400&_otm=1548081972921; SignalRID=1_7635603404191521400; rmt=off; user=%7b%22LoginId%22%3a528152%2c%22baUserId%22%3a0%2c%22UserId%22%3a226108%2c%22LoginName%22%3a%2256%e6%9c%9f%e5%a4%a7%e9%a3%9e%22%2c%22UserType%22%3a26%2c%22ClassId%22%3a%5b1%2c2%2c5%2c6%2c8%2c4%5d%2c%22From%22%3a2%2c%22Classfor%22%3a2%2c%22InputInviteCode%22%3a%22%22%2c%22InviteCode%22%3a%22%22%2c%22GroupRight%22%3a%5b%5d%2c%22DepName%22%3a%22_%e6%97%a0%e6%88%98%e9%98%9f%22%2c%22AID%22%3a251%2c%22OpenId%22%3a%22%22%2c%22UnionId%22%3a%22%22%2c%22CheckPointFlag%22%3a0%2c%22ProductTypeId%22%3a%2226%7c%22%2c%22expit%22%3a%22%22%7d; Hm_lpvt_23c29ef18f57ef3419152a651c437547=1548081974"
    }
  },
  rule: [
    {
      test: /learn\/grade/,
      handle: function($, body) {
        let list = [];
        $(".classify-item").each(function(i, item) {
          let id = $(this)
            .find(".top-area img.live_opend")
            .attr("data-id");
          let title = $(this)
            .find(".title")
            .text();
          list.push({
            url: `http://www.musicheng.com/learn/list/${id}`,
            title
          });
        });
        return list;
      }
    },
    {
      test: /Player\/Player/,
      handle: function($, body) {
        let mp4 = $("#input-data-vido").attr("data-url");
        if (!mp4) {
          if (body.includes("请登录")) {
            throw "cookie已经过期，登录qq发远程给我";
          } else if (body.includes("请购买课程后")) {
            console.log(`视频[${this.title}]未购买,跳过`);
            return false;
          } else {
            throw body;
          }
        }
        let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
        let savePath = this.parent.title.replace(fileNameRegex, "");
        savePath = path.resolve(__dirname, savePath);
        return {
          url: mp4,
          type: "download",
          fileName: `${this.title}.mp4`,
          save: savePath
        };
      }
    },
    {
      test: /learn\/list/,
      handle: function($, body) {
        let list = [];
        $(".list-box li").each(function(i, item) {
          let title = $(this)
            .find(".title")
            .children()[0]
            .prev.data.trim();
          let img = $(this).find("img");
          let url = `http://www.musicheng.com/Player/Player?id=${img.attr(
            "data-id"
          )}&gread=${img.attr("data-pid")}&k=0`;
          list.push({ title, url });
        });
        return list;
      }
    }
  ]
};

module.exports = config;
