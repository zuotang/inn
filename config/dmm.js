const path = require("path");
const cheerio = require("cheerio");
const { download, urlToExt, urlToFileName, fileNameRegex } = require('../tools');
const { postModel, userModel } = require('./db');
const sizeOf = require('image-size');

let options = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.79 Safari/537.36",
  },
  proxy: {
    host: '127.0.0.1',
    port: 1080,
  }
};

const config = {
  entry: {
    url:
      "https://www.dmm.co.jp/mono/dvd/-/list/=/sort=ranking/",
  },
  name: "dmm",
  options,
  rule: [
    {
      test: /\/list\//,
      handle: function ($, body) {
        let list = [];
        let next;
        $(".list-boxcaptside.list-boxpagenation>ul>li>a").map(function () {
          if (!next && $(this).text() == "次へ") {
            next = 'https://www.dmm.co.jp' + $(this).attr('href');
            list.push({ url: next });
          }
        })


        $("#list>li").map(function () {
          list.push({
            url: $(this).find('a').attr('href')
          })
        })
        return list;
      }
    },
    {
      test: /\/detail\//,
      handle: async function ($, body) {
        let title = $('#title').text();
        let imgObj = await downloadFile(title, $('#sample-video a').attr('href'), {});
        let img = getPhotoFromPath(imgObj);

        let imgs = [];
        let id;
        let tags = [];
        let cid = /cid\=(.*?)\//.exec(this.url)[1];

        $('#performer a').map(function () {
          tags.push($(this).text());
        })

        let date = $('.wrapper-product tr').eq(1).find('td').eq(1).text();
        $('.wrapper-product tr').eq(8).find('td a').map(function () {
          tags.push($(this).text());
        })
        let imgUrls = [];
        $('#sample-image-block img').map(function () {
          let src = $(this).attr('src');
          if (!id) {
            let regx = /video\/(.*?)\//;
            id = regx.exec(src)[1];
          }
          let imgUrl = src.replace('-', 'jp-');
          imgUrls.push(imgUrl)
        })

        for (var item of imgUrls) {
          let imgObj = await downloadFile(title, item, {});
          imgs.push(getPhotoFromPath(imgObj))
        }

        let res = {
          img, title, imgs, tags, date
        }
        if (!id) {
          console.log('没有视频');

          return false;
        }

        return {
          ...res,
          type: 'string',
          url: `https://www.dmm.co.jp/service/-/html5_player/=/cid=${cid}/mtype=AhRVShI_/service=mono/floor=dvd/mode=/`,
        };
      }
    },
    {
      test: /\/html5_player\//,
      handle: async function (_, body) {
        let res = /var params \=(.*?)\;/.exec(body);
        let type = 'video';
        if (res) {
          let video = JSON.parse(res[1]);
          let dmb = video.bitrates[video.bitrates.length - 1];
          if (dmb) {
            console.log('下载', this.video);
            //下载视频
            let videoFile = await downloadFile(this.title, 'https:' + dmb.src, {});
            this.video = videoFile.url;

          } else {
            console.log('视频未找到', video.bitrates)
            type = 'photo';
          }
        }

        let user = await addUser();
        let post = {
          user,
          content: this.title,
          creationDate: this.date ? new Date(this.date) : new Date(),
          updateDate: new Date(),
          hotNum: 1,
          commentNum: 0,
          likeNum: 0,
          readNum: 0,
          type,
          tags: this.tags,
          rootUser: user,
          fromUser: user,
          photos: this.imgs,
          src: this.video,
          thumbnail: this.img,
        };

        await postModel(post).save();

        console.log('视频下载完成');
      }
    },
  ]
};

//添加用户到数据库
const cleckUserToDB = async user => {
  let resUser = await userModel.findOne({ name: user.name }).exec();
  if (resUser) return resUser;
  return await userModel(user).save();
};


//添加
const addUser = async () => {
  let user = {};
  //用户头像
  user.avatar = 'https://pics.dmm.co.jp/mono/movie/adult/tkssni420/tkssni420pt.jpg';
  user.name = "fanza";
  user.password = "123456";
  user.nick_name = "Fanza";
  user.nick_name = "Fanza";
  user.sex = 1;
  user.roles = ['admin'];
  //添加用户到数据库
  user = await cleckUserToDB(user);
  return user;
};

async function downloadFile(title, url, options) {
  let savePath = title.replace(fileNameRegex, "");
  return await download({
    url,
    save: savePath,
    fileName: urlToFileName(url)
  }, 'dmm', options);
}

module.exports = config;


const getPhotoFromPath = (fileObj) => {
  try {
    let size = sizeOf(fileObj.filePath);
    return {
      url: fileObj.url,
      width: size.width,
      height: size.height,
    };
  } catch (err) {
    throw `get image size error ${err}`;
  }
};