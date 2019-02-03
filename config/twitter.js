const path = require("path");
const cheerio = require("cheerio");

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
      "https://twitter.com/i/timeline?include_available_features=1&include_entities=1&reset_error_state=false",
    type: "json"
  },
  name: "twitter",
  options: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36",
      "Cookie":'personalization_id="v1_R1EmoyozcToeRQjX3sjORQ=="; guest_id=v1%3A154731187292089357; _ga=GA1.2.208891239.1547311879; dnt=1; ads_prefs="HBISAAA="; kdt=D8nrULW0XLzGXypYmCDi8LnrYYvLfju5wO04j5iz; remember_checked_on=1; twid="u=867458500166692865"; auth_token=7c3de82b4d8732b6025b6ec6bab476b9c1d5ab1c; csrf_same_site_set=1; csrf_same_site=1; lang=zh-cn; _twitter_sess=BAh7CSIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNo%250ASGFzaHsABjoKQHVzZWR7ADoPY3JlYXRlZF9hdGwrCIUKI59oAToHaWQiJWJl%250AOTg0MDQ5ZDNlMGU1YWIwNzkxYWQ1MDUzYmUzOTUzOgxjc3JmX2lkIiVkM2Vm%250AMDU5N2E1MzM0YWJmMzI5MTYwNzVlZDA0ZTZlZQ%253D%253D--55dd92d298706fefdbc2866b84171b564c8c5cef; ct0=da482901479bfc49145874dc13fe638d; _gid=GA1.2.40090945.1548858102; app_shell_visited=1',
      "referer": "https://twitter.com/"
    },
    proxy:{
      host:'127.0.0.1',
      port:12333,
    }
  },
  rule: [
    {
      test: /i\/timeline/,
      handle: function(json, body) {
        let list = [];
        let $=cheerio.load(json.items_html);
        let nextId;
        $('.js-stream-tweet').map(function(item){
          let nickName=$(this).find('.fullname').text();
          let userName=$(this).find('.username>b').text();
          let content=$(this).find('.tweet-text').text();
          let avatar=$(this).find('img.avatar').attr('src');
          let play=$(this).find('.PlayableMedia-player')
          let id=$(this).attr('data-tweet-id');
          nextId=id;
          // if(play.attr('style')){
          //   console.log($(this).html())
          // }
          $(this).find('.AdaptiveMediaOuterContainer img').map(function(item){
            let url=$(this).attr('src');
            console.log(url)
            let fileNameRegex = /[\\\/\*\"\|\?\<\>\:]/g;
            let savePath = nickName.replace(fileNameRegex, "");
            list.push({
              type: "download",
              url,
              save: savePath,
              fileName: urlToFileName(url)
            });
          })
        })
        list.unshift({
          url:
      `https://twitter.com/i/timeline?include_available_features=1&include_entities=1&max_position=${nextId}&reset_error_state=false`,
    type: "json"
        })
        return list;
      }
    },
    
  ]
};

module.exports = config;
