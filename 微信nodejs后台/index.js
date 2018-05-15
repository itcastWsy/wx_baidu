var express = require('express');
var app = express();
var path=require("path");
var fs = require('fs');
var Multiparty = require('multiparty');
// 转码工具
var ffmpeg = require('fluent-ffmpeg');
var AipSpeechClient = require("baidu-aip-sdk").speech;

// #region 创建百度授权 
// 设置APPID/AK/SK
var APP_ID = "xxx";
var API_KEY = "xxx";
var SECRET_KEY = "xxx";

// 百度请求对象
var client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY);


// 新建一个对象，建议只保存一个对象调用服务接口
app.post('/post', function (req, res, next) {
  //生成multiparty对象，并配置上传目标路径
  var form = new Multiparty.Form({
    uploadDir: path.join(__dirname,'uploads/')
  });
  //上传完成后处理
  form.parse(req, function (err, fields, files) {
    var filesTemp = JSON.stringify(files, null, 2);
    // fffile 为微信 上传录音文件代码中 定义的 name属性
    var inputFile = files.fffile[0];
    var uploadedPath = inputFile.path;
    var command = ffmpeg();
    command.addInput(uploadedPath)
      // 将1.aac 变为1.wav
      .save(uploadedPath.slice(0, -3) + "wav")
      .on('error', function (err) {
        console.log(err);
      })
      .on('end', function () {
        // 将录音文件转为buffer
        var voice = fs.readFileSync(uploadedPath.slice(0, -3) + "wav");
        var voiceBuffer = new Buffer(voice);

        // 发送buffer到百度接口 返回语音对应的字符串
        client.recognize(voiceBuffer, 'wav', 16000).then(function (result) {
          console.log('<recognize>: ' + JSON.stringify(result));
          res.end(JSON.stringify(result));
        }, function (err) {
          console.log(err);
        });
      });
  });
});
var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});