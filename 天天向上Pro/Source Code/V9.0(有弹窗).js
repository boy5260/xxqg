
var hamibot={env:{fenxiang:"true",wenzhang:"true",meizhou:"daoxu",zhuanxiang:"daoxu",dingyue:"zhengxu",shipin:"true",meiri:"true",siren:"true",bendi:"true",shuangren:"true",dacuo_num:"2",yinliang:"0",tiaozhan:"true",duizhan_mode:"suiji",yl_on:true,zhanghao:"11111111111:11111111111\n22222222222:22222222222",APP_ENV:"production",USER_ID:"",ROBOT_ID:"",SCRIPT_ID:"",TIMESTAMP:""},plan:{name:"免费",onFreeTrial:false,model:"free"},robotName:"",};
hamibot.postMessage=function(){};hamibot.exit=function(){exit();};
auto.waitFor(mode = "fast");//mode = "fast"
var delay_time = 3000;
// 读取自定义配置
const { fenxiang, shipin, wenzhang, meiri, meizhou, zhuanxiang, tiaozhan, ocr_plugin, duizhan_mode,
       jisu, siren, dacuo_num, shuangren, bendi, dingyue, pushplus, yl_on, yinliang, zhanghao } = hamibot.env;
launch('com.hamibot.hamibot');
// text("Hamibot").waitFor();
textMatches(/Hamibot|日志/).waitFor();
sleep(delay_time);
/*****************更新内容弹窗部分*****************/
var storage = storages.create('songgedodo');
// 脚本版本号
var last_version = "V8.6";
var engine_version = "V9.0";
if (storage.get(engine_version, true)) {
  storage.remove(last_version);
//   以下为自定义弹窗代码
//   let checked = gengxin_show();
//   if (checked) {storage.put(engine_version, false);}
  let gengxin_rows = ["强国APP版本v2.34.0以上不支持订阅，可以在豌豆荚中下载历史版本",
                      "1.更换了更新题库的方式，尝试解决网络报错，用起来更快更方便",
                      "2.稍微增加了每篇视频和文章的时长",
                      "3.修复多账号退出登录时可能卡住的bug",
                      "4.修复对战可能出现报错的bug",
                      "联系方式：qq群: 586076765；tg: t.me/wyqg_ttxs",
                      "（点击取消不再提示）"]
  let is_show = confirm(engine_version + "版更新内容", gengxin_rows.join("\n"));
  if (!is_show) {storage.put(engine_version, false);}
}
var w = fInit();
// console.setTitle("天天向上");
// console.show();
fInfo("脚本初始化");
fInfo("版本号检测："+ app.versionCode);
if (app.versionCode < 110) {
  alert("请进入下载页点击下载测试版！！\n版本号为v1.3.0-beta.3");
  let req = http.get("https://hamibot.com/download");
  let resp_str = req.body.string();
  let reg = '/<a href="(.*)?" target="_blank" data-v-402fe7d6>'
  +'<button type="button" appearance="default" spacing="default" data-v-4ab5aafc data-v-402fe7d6>/';
  let link = resp_str.match(eval(reg))[1];
  //log(link);
  app.openUrl(link);
  exit();
}
// 初始化宽高
var [device_w, device_h] = init_wh();
// log("fina:", device_w, device_h);
// OCR初始化，重写内置OCR module
if (ocr_plugin) {
  fInfo("初始化第三方ocr插件");
  try {
    ocr = plugins.load("com.hraps.ocr");
    ocr.recognizeText = function (img) {
      let results = this.detect(img.getBitmap(),1);
      let all_txt = "";
      for (let i=0;i<results.size();i++) {
        let re = results.get(i);
        all_txt += re.text;
      }
      return all_txt
    }
  }
  catch(e) {
    fError("未安装第三方OCR插件，请安装后重新运行");
    alert("未安装第三方OCR插件，点击确认跳转浏览器下载，密码为ttxs");
    app.openUrl("https://wwc.lanzouo.com/ikILs001d0wh");
    exit();
  }
}
// sleep(2000);
// 自动允许权限进程
threads.start(function() {
  //在新线程执行的代码
  //sleep(500);
  toastLog("开始自动获取截图权限");
  var btn = className("android.widget.Button").textMatches(/允许|立即开始|START NOW/).findOne(5000);
  if (btn) {
    sleep(1000);
    btn.click();
  }
  toastLog("结束获取截图权限");
});
fInfo("请求截图权限");
// 请求截图权限、似乎请求两次会失效
if (!requestScreenCapture(false)) { // false为竖屏方向
  fError('请求截图失败');
  hamibot.exit();
}
// 防止设备息屏
fInfo("设置屏幕常亮");
device.keepScreenOn(3600 * 1000);
// 下载题库
var update_info = get_tiku_by_http("https://gitee.com/songgedodo/songge_tiku/raw/master/info.json");
fInfo("测试对战题库");
var tiku = get_tiku_by_http(update_info["tiku_link"]);
// var tiku = get_tiku_by_gitee();
fInfo("检测题库更新");
var dati_tiku = [];
try {dati_tiku = update_dati_tiku()}
catch (e) {
  fError("网络原因未获取到在线题库，请尝试切换流量或者更换114DNS");
  dati_tiku = get_tiku_by_ct('https://webapi.ctfile.com/get_file_url.php?uid=35157972&fid=555754562&file_chk=94c3c662ba28f583d2128a1eb9d78af4&app=0&acheck=2&rd=0.14725283060014105');
}
// 调整音量
if (yl_on) {
  fInfo("设置媒体音量");
  var yuan_yl = device.getMusicVolume();
  var max_yl = device.getMusicMaxVolume();
  let yl = Math.ceil(yinliang*max_yl/100);
  //log(yuan_yl, max_yl, yl, typeof yl);
  device.setMusicVolume(yl);
  fInfo("当前音量："+ device.getMusicVolume());
}
fInfo("运行前重置学习APP");
exit_app("学习强国");
// 检测地理位置权限代码，出现就点掉
fInfo("开始位置权限弹窗检测");
var nolocate_thread = threads.start(function() {
  //在新线程执行的代码
  id("title_text").textContains("地理位置").waitFor();
  fInfo("检测到位置权限弹窗");
  sleep(1000);
  var btn = text("暂不开启").findOne();
  btn.click();
  fInfo("已关闭定位");
});
fInfo("跳转学习APP");
// launch('cn.xuexi.android');
app.launchApp('学习强国');
sleep(2000);
// console.hide();
// 命令行方式启动，似乎需要root
// var result_shell = shell("pm disable cn.xuexi.android");
// log(result_shell.code, result_shell.error);
/***************不要动****************
 * **********************************
// 创建一个安卓动作，打开软件，此功能可以跳过开屏页，还在实验中
// app.startActivity({
//   action: 'android.intent.action.VIEW',
//   data: 'dtxuexi://appclient/page/study_feeds',
//   packageName: 'cn.xuexi.android',
// });
 * **********************************
*************************************/


function do_fenxiang() {
  // 点击分享"去看看"回首页
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(11).child(3).click();
  fSet("title", "分享和评论…");
  fClear();
  sleep(1000);
  swipe(device_w/2, device_h*0.7, device_w/2, device_h*0.4, 1000);
  let wen_box = id("general_card_title_id").findOne().parent().parent();
  fInfo("尝试点击title:"+ id("general_card_title_id").findOne().text());
//   //log("文章click:", wen_box.click());
//   while (!id("general_card_title_id").findOne().parent().parent().click()) {log("文章click: false");}
//   log("文章click: true");
  real_click(id("general_card_title_id").findOne().parent().parent());
  log("等待加载");
  idContains("image-text-content").waitFor();
  let text_edit = text("欢迎发表你的观点");
  log("查找评论框");
  text_edit.waitFor();
  sleep(1500);
  while (pinglun = text_edit.findOne(1500)) {
    fInfo("尝试点击评论框中");
    log(pinglun.click());
    sleep(500);
    fRefocus();
  }
  fInfo("评论框click: true");
  let content_list = ["全心全意为人民服务", "不忘初心，牢记使命", "不忘初心，方得始终", "永远坚持党的领导"];
  className("android.widget.EditText").findOne().setText(content_list[random(0, content_list.length-1)]);
  sleep(1000);
  text("发布").findOne().click();
  sleep(1000);
  text("删除").findOne().click();
  sleep(1000);
  text("确认").findOne().click();
  sleep(1000);
  // 下面是分享
  for (let i=0; i<2; i++) {
    text_edit.findOne().parent().child(3).click();
    sleep(500);
    textContains("学习强国").findOne().parent().click();
    sleep(500);
    text("创建新的聊天").waitFor();
    sleep(1000);
    back();
    sleep(1000);
  }
  // 回到首页
  back();
  // 返回积分页
  jifen_init();
  ran_sleep();
  return true;
}

/********时长部分*********/
function do_shipin() {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(2).child(3).click();
  fSet("title", "视听学习…");
  fClear();
  desc("百灵").findOne().click();
  sleep(1000);
  fInfo("检测温馨提示弹窗");
  if (text("温馨提示").findOne(1500)) {
    text("关闭").findOne().click();
    fInfo("检测到温馨提示并已关闭");
  }
  desc("百灵").findOne().click();
  let shu = text("竖").findOne();
  sleep(1000);
  // 定位到整个百灵frame_box
  let frame_box = shu.parent().parent().parent().parent();
  textMatches(/\d{2}:\d{2}/).waitFor();
  let video_list = frame_box.findOne(className("android.widget.ListView"));
  video_list.child(1).child(1).child(0).click();
  text("分享").waitFor();
  if (idContains("guide_view").findOne(1500)) {
    fInfo("检测到引导遮罩");
    sleep(1000);
    click(device_w / 2, device_h / 2);
    sleep(1000);
    click(device_w / 2, device_h / 4);
  }
  sleep(800);
  //log(text("刷新重试").exists());
  if (text("刷新重试").exists()) {
    fInfo("检测到流量提醒");
    text("刷新重试").findOne().click();
  }
  sleep(random(8000,9500));
  for (let i=0; i<6; i++) {
    click(device_w / 2, device_h / 2);
    sleep(500);
    swipe(device_w/2, device_h*0.8, device_w/2, device_h*0.1, 1000);
    sleep(random(8000,9500));
  }
  back();
  fInfo("视频个数已刷完");
  // 返回积分页
  jifen_init();
  ran_sleep();
  return true;
}

function do_wenzhang() {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  // 点击进入本地
  let old_wen = storage_user.get("old_wen_list", []);
  //log(typeof old_wen, old_wen);
  jifen_list.child(13).child(3).click();
  fSet("title", "选读文章…");
  fClear();
  fInfo("切换地区为北京");
  text("切换地区").findOne(3000);
  if (text("立即切换").exists()) {
    text("取消").findOne(3000).click();
  }
  log("切换地区");
  text("切换地区").findOne().click();
  log("查找北京");
  text("北京").waitFor();
  sleep(500);
  log("切换北京");
  text("北京").findOne().parent().parent().click();
  log("查找banner");
  let banner = className("android.support.v7.widget.RecyclerView").findOne();
  log("查找末项");
  while (banner.findOne(text("北京新闻广播")) == null) {banner.scrollForward();}
  log("点击末项", text("北京新闻广播").findOne().parent().click());
  fInfo("视听广播时长");
  sleep(11500);
  back();
  // 下面正式刷文章
  fInfo("开始文章");
  sleep(1500);
  banner = className("android.support.v7.widget.RecyclerView").findOne();
  while (banner.findOne(text("北京学习平台")) == null) {banner.scrollBackward();}
  sleep(1000);
  log("查找首项，尝试点击");
//   while (!text("北京学习平台").findOne().parent().click()) {log("click: false");}
//   log("click: true");
  real_click(text("北京学习平台").findOne().parent());
  log("等待加载");
  sleep(1000);
  text("新思想扎根京华").waitFor();
  sleep(1000);
  let swipe_y = text("新思想扎根京华").findOne().parent().parent().bounds().bottom;
  log("识别出顶部：", swipe_y);
  fRefocus();
  let listview = className("android.widget.ListView").depth(17).findOne();
  // 先判断是否有可刷文章，没有则停止脚本
  // while (!id("general_card_image_id").findOne(1000)) {listview.scrollForward();}
  for (i=0; i<2; i++) {
    listview.scrollForward();
    sleep(500);
  }
  // 自定义没有刷过的文章筛选器
  let wen_box_slt = className("android.view.ViewGroup").depth(20).filter(function(l) {
    let title = l.findOne(idContains("general_card_title_id"));
    let image = l.findOne(idContains("general_card_image_id"));
    if (title && image) {
      return old_wen.indexOf(title.text())==-1 && title.text().indexOf("【专题】")==-1;
    }
    return false;
  });
  log("查找文章");
  //while (!idContains("general_card_image_id").findOne(500)) {
  while (!wen_box_slt.findOne(500)) {
    listview.scrollForward();
    //sleep(500);
  }
  log("找到文章");
  // 下面那句会定位到新思想的文章，不能加载过新思想
  let wen_box = wen_box_slt.findOne();
  // 先做5次
  let wen_num = 0;
  while (wen_num < 6) {
    let title = wen_box.findOne(idContains("general_card_title_id")).text();
    old_wen.push(title);
    if (old_wen.length > 60) {old_wen.shift();}
    fClear();
    fInfo("点击文章："+title);
    //wen_box.click();
    let title_click = wen_box.parent().parent().click();
    fInfo("点击："+title_click);
    classNameContains("com.uc.webview.export").waitFor();
    let father_view = className("android.webkit.WebView").findOne();
    sleep(1000);
//     let father_view = className("android.view.View").depth(16).findOne();
    // 判断是否为专题而不是文章
    if (father_view.find(idContains("__next")).empty()) {
      idContains("image-text-content").waitFor();
      // log(idContains("image-text-content").findOne().id());
      // 不先点一下划不动
      idContains("xxqg-article-header").findOne().child(0).click();
      swipe(device_w/2, device_h*0.7, device_w/2, device_h*0.3, 1000);
      if (wen_num < 5) {
        sleep(random(8000,9500));
      }
     	else {
        // 第6次停顿刷时间
        //console.show();   
        toastLog("正在刷时长程序未停止");
        let shichang = 6*random(55, 60);
        fClear();
        fInfo("开始刷时长，总共" + shichang + "秒");
        let wait_time = 1;
        for (let i=0; i<shichang; i++){ //*random(55, 60)
          // 每15秒增加一次滑动防息屏
          if (i%15==0) {
            swipe(device_w/2, device_h*0.6, device_w/2, device_h*0.6-100, 500);
            sleep(500);
          }
          else {sleep(1000);}
          //w.info.setText("已观看文章" + wait_time + "秒，总共" + shichang + "秒");
          fSet("info", "已观看文章" + wait_time + "秒，总共" + shichang + "秒");
          wait_time++;
        }
        fSet("info", "已结束文章时长");
        console.hide();
        back();
        break;
      }
    }
    else {wen_num -= 1;}
    back();
    //id("general_card_image_id").waitFor();
    className("android.widget.ListView").scrollable().depth(17).waitFor();
    sleep(1000);
    while (!wen_box_slt.exists()) {
      listview.scrollForward();
      sleep(200);
    }
    wen_box = wen_box_slt.findOne();
    wen_num += 1;
  }
  // 更新已读文章库
  storage_user.put("old_wen_list", old_wen);
  sleep(3000);
  // 关闭音乐
  close_video();
  back(); 
  sleep(3000);
  // 返回积分页
  jifen_init();
  ran_sleep();
  return true;
}

/********每日答题*********/
function do_meiri() {
  // 点击进入每日答题
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(4).child(3).click();
  fSet("title", "每日答题…");
  fClear();
  // 等待加载
  text("查看提示").waitFor();
  // 获取右上题号，如1 /5
  var tihao = className("android.view.View").depth(24).findOnce(1).text();
  var num = Number(tihao[0]);
  var sum = Number(tihao[tihao.length-1]);
  var substr = tihao.slice(1);
  while (num<=sum) {
    fClear();
    fInfo("第"+num+"题");
    // 等待加载
    text(num+substr).waitFor();
    num++;
//     // 如果是视频题则重新开始
//     if (className("android.widget.Image").exists()) {
//       num = 1;
//       restart(0);
//       continue;
//     }
    do_exec();
    // 点击确定下一题
    depth(20).text("确定").findOne().click();
		ran_sleep();
    // 如果题做错了重来
    if (text("下一题").exists() || text("完成").exists()) {
      fInfo("答错重试");
      num = 1;
      restart(0);
      continue;
    }
  }
	// 循环结束完成答题
  text("返回").findOne().click();
  text("登录").waitFor();
  ran_sleep();
  return true;
}

/********每周答题*********/
function do_meizhou() {
  // 点击进入每周答题
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(5).child(3).click();
  fSet("title", "每周答题…");
  fClear();
  // 等待加载
  textContains("月").waitFor();
  let scoll = depth(21).scrollable().findOne();
  // 下面是倒叙作答
  if (meizhou_dao) {
    fInfo("倒序查找未做题目");
    //当出现已作答时，点击最后一个未作答
    while (!text("已作答").exists()) {
      scoll.scrollForward();
      sleep(300);
    }
    var clt = text("未作答").find();
    if (clt.empty()) {
      fInfo("每周答题全部已作答。");
      back();
      text("登录").waitFor();
      ran_sleep();
      return true;
    }
    var title = clt[clt.length-1].parent().child(0).text();
    fInfo(title + "开始作答");
    clt[clt.length-1].parent().click();
    // 测试用
    // text("已作答").findOnce(0).click();
  }
  // 下面是正序作答
  else {
    fInfo("正序查找未做题目");
    // 找到未作答就停止滚动
    let dixian_slt = text("您已经看到了我的底线").filter(function(w) {
      log("底线：", w.bounds().top, device_h);
      return w.bounds().top <= device_h-30;
    });
    //while (true) { //测试用
    while (!text("未作答").exists()) {
      // 如果到底则设置倒序为true
      if (dixian_slt.exists()) {
        //storage_user.put('meizhou_dao', true);
        fInfo("每周答题全部已作答。");
        back();
        text("登录").waitFor();
        ran_sleep();
        return true;
      }
      scoll.scrollForward();
      sleep(200);
    }
    title = text("未作答").findOne().parent().child(0).text();
    fInfo(title + "开始作答");
    text("未作答").findOne().parent().click();
  } 
  // 等待加载
  text("查看提示").waitFor();
  // 获取右上题号，如1 /5
  var tihao = className("android.view.View").depth(24).findOnce(1).text();
  var num = Number(tihao[0]);
  var sum = Number(tihao[tihao.length-1]);
  var substr = tihao.slice(1);
  while (num<=sum) {
    fClear();
    fInfo("第"+num+"题");
    // 等待加载
    text(num+substr).waitFor();
    num++;
    do_exec("（每周）");
    // 点击确定下一题
    depth(20).text("确定").findOne().click();
		ran_sleep();
    // 如果题做错了重来
    if (text("下一题").exists() || text("完成").exists()) {
      //toastLog(title + "我无能为力啦，请手动作答吧");
      fInfo("做错尝试重答");
      text("答案解析").waitFor();
      upload_wrong_exec("（每周）");
      storage.put('dati_tiku', dati_tiku);
      back();
      text("退出").findOne().click();
  		ran_sleep();
      back();
      text("登录").waitFor();
      ran_sleep();
      return false;
    }    
  }
	// 循环结束完成答题
  text("返回").findOne().click();
  sleep(1000);
  back();
  text("登录").waitFor();
  ran_sleep();
  return true;
}

/********专项答题*********/
/*专项答题中提示的层次与每日每周的不一样
 * 专项答题出现的倒计时会影响22,23层的结构*/
function do_zhuanxiang() {
  // 点击进入专项答题
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(6).child(3).click();
  fSet("title", "专项答题…");
  fClear();
  // 等待加载
  depth(23).waitFor();
  ran_sleep();
  let scoll = depth(21).indexInParent(1).scrollable().findOne();
  //let new_tihao = [];
  // 下面是倒序答题
  if (zhuanxiang_dao) {
    // 当出现已满分时，点击最后一个开始答题
    while (!text("已满分").exists()) {
      scoll.scrollForward();
      // 不加延迟会很卡
      sleep(200);
    }
    var clt = text("开始答题").find();
    if (clt.empty()) {
      fInfo("专项答题全部已作答。");
      back();
      text("登录").waitFor();
      ran_sleep();
      return true;
    }
    // 点击最后一项
    clt[clt.length-1].click();
  }
  // 下面是正序
  else {
    // 直到找到开始答题
    let dixian_slt = text("您已经看到了我的底线").filter(function(w) {
      return w.bounds().top <= device_h-30;
    });
    //while (true) { //测试用
    while (!text("开始答题").exists()) { //开始答题
      // 如果到底则设置倒序为true
      if (dixian_slt.exists()) {
        //storage_user.put('zhuanxiang_dao', true); 自定义不用读取
        fInfo("专项答题全部已作答。");
        back();
        text("登录").waitFor();
        ran_sleep();
        return true;
      }
      // 滚动20次
      for (i=0; i<15; i++) {
        scoll.scrollForward();
        // 不加延迟会很卡
        sleep(300);
      }
    }
    text("开始答题").findOne().click();
  }
  ran_sleep();
  // 等待加载
  text("查看提示").waitFor();
  sleep(2000);
  // 获取右上题号，如1 /5
  var tihao = className("android.view.View").depth(24).findOnce(1).text();
  // 需要加个斜杠转义
  let reg = /(\d+) \/(\d+)/;
  var num = Number(tihao.match(reg)[1]);
  var sum = Number(tihao.match(reg)[2]);
  var substr = " /" + sum;
  //log(tihao);
  while (num<=sum) {
    fClear();
    fInfo("第"+num+"题");
    // 等待加载
    text(num+substr).waitFor();
    num++;
    do_exec();
    // 点击确定下一题
    let next = className("android.view.View").filter(function(l) {
      return (l.text() == "下一题") || (l.text() == "完成");
    });
    next.findOne().click();
//     if (!click("下一题")) {
//       click("完成");
//     }
    ran_sleep();
  }
  // 循环结束完成答题
  text("查看解析").waitFor();
  sleep(1000);
  // 如果题目答错，循环每一题并添加错题
  if (textMatches(/\d+分/).findOne().text() != "100分") {
    fInfo("有错题，尝试上传错题");
    text("查看解析").findOne().click();
    tihao = textMatches(reg).findOne().text();
    num = Number(tihao.match(reg)[1]);
    sum = Number(tihao.match(reg)[2]);
    substr = " /" + sum;
    //log(tihao);
    sleep(1500);
    while (num<=sum) {
      // 等待加载
      text(num+substr).waitFor();
      num++;
      if (textEndsWith("回答错误").exists()) {
        upload_wrong_exec();
      }
      // 点击确定下一题
      let next = className("android.view.View").filter(function(l) {
        return (l.text() == "下一题") || (l.text() == "完成");
      });
      next.findOne().click();
      sleep(random(1000, 1500));
    }
    storage.put('dati_tiku', dati_tiku);
  }
  else {
    back();
    ran_sleep();
  }
  back();
  text("登录").waitFor();
  ran_sleep();
  return true;
}

/********挑战答题*********/
function do_tiaozhan() {
  // 点击进入挑战答题
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(7).child(3).click();
  fSet("title", "挑战答题…");
  fClear();
  // 等待加载、积分页面也有Image和List，需要用depth筛选
  className("android.widget.Image").depth(24).waitFor();
  let total = 0;
  while (true) {
    fClear();
    fInfo("第"+(total+1)+"题");
    // 等待选项列表
    let xuan_list = className("android.widget.ListView").findOne().children();
    // 获取题目
    let que_txt = className("android.widget.ListView").findOne().parent().child(0).text();
    //log(que_txt);
    // 获取答案列表，可能找到多个答案
    // let ans_list = get_ans_by_http(que_txt.replace(/来源：.*|出题单位：.+/, ""));
    let ans_list = get_ans_by_tiku(que_txt.replace(/[^\u4e00-\u9fa5\d]|来源：.+|出题单位：.+/g, ""));
//     fInfo(que_txt.replace(/[^\u4e00-\u9fa5\d]|来源：.+|出题单位：.+/g, ""));
    log("答案："+ans_list);
    ran_sleep();
    if (total >= 5) {
      // 题数数够了随便选
      fInfo("已答对5题，全选A");
      xuan_list[0].child(0).click();
    }else if (ans_list.length != 0) {
      let max_simi = 0;
      let xuanxiang = null;
      // 循环对比所有选项和答案，选出相似度最大的
      for (let xuan_box of xuan_list) {
        let xuan_txt = xuan_box.child(0).child(1).text();
        //log(xuan_txt);
        for (let ans of ans_list) {
          let similar = str_similar(ans.slice(2), xuan_txt);
          //log(xuan_txt, similar);
          if (similar > max_simi) {
            max_simi = similar;
            xuanxiang = xuan_box.child(0);
          }
        }
      }
      if (xuanxiang != null) {
        fInfo("最终："+ xuanxiang.child(1).text());
        xuanxiang.click();
      }
      else {
        fInfo("无匹配答案");
        xuan_list[0].child(0).click();
      }
    }
    // 如果没找到答案
    else {
      fInfo("未找到答案");
      // 选第一个选项
      xuan_list[0].child(0).click();
    }
    sleep(2500);
    // 判断题是否答错
    if (text("结束本局").exists()) {
      sleep(5000);
      click("结束本局");
      text("再来一局").waitFor();
      if (total < 5) {
        fInfo("答错重试");
        console.warn("warn:", que_txt);
      	text("再来一局").findOne().click();
      }
      else {
        // 退出
        back();
        text("登录").waitFor();
        ran_sleep();
        return true;
      }
      total = 0;
      sleep(2000);
      continue;
    }
    // 没答错总数加1
    total += 1;
  }
}

/********双人、四人赛*********/
function do_duizhan1(renshu) {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  fClear();
  if (renshu == 2) {
    // 点击进入双人对战
    jifen_list.child(9).child(3).click();
    fSet("title", "双人对战");
    fInfo("等待随机匹配");
    text("随机匹配").waitFor();
    sleep(500);
    let match_click = text("随机匹配").findOne().parent().child(0).click();
    fInfo("点击："+match_click);
  }
  else if (renshu == 4) {
    // 点击进入四人赛
    jifen_list.child(8).child(3).click();
    fSet("title", "四人赛…");
    // 等待开始比赛并点击
    fInfo("等待开始比赛");
    let start_click = text("开始比赛").findOne().click();
    fInfo("点击："+start_click);
  }
  let delay = Number(jisu);
  if (delay > 0 && duizhan_mode == "guding") {
    ui.run(function() {
      let title = w.title.getText();
      w.title.setText(title+"(急速)");
      toastLog("极速模式开启");
    });
  } else if (duizhan_mode == "shoudong") {
    ui.run(function() {
      let title = w.title.getText();
      w.title.setText(title+"(手动)");
      toastLog("请手动点击答案");
    });
  }
  text("开始").waitFor();
  fClear();
  let num = 1;
  let err_flag = true;
  while (true) {
    // 如果是第一题或者下面出错，则跳过前面等待过渡
    if (num != 1 && err_flag) {
      // 检查到其中一个过渡界面为止
      while (true) {
        // 检测是否结束并退出
        if (text("继续挑战").exists()) {
          sleep(1000);
          text("继续挑战").findOne().click();
          sleep(1500);
          back();
          if (renshu == 2) {
            text("退出").findOne().click();
          }
          text("登录").waitFor();
          ran_sleep();
          return true;
        }
        else if (text("第" + num + "题").exists()) {
          fClear();
          fInfo("第"+num+"题");
          break;
        }
      }
      // 直到过渡界面消失，再匹配下一题
      while (text("第" + num + "题").exists()) {} //sleep(100);
    }
    else if (!err_flag) {
      err_flag = true;
      if (text("继续挑战").exists()) {
        sleep(1000);
        text("继续挑战").findOne().click();
        sleep(1500);
        back();
        if (renshu == 2) {
          text("退出").findOne().click();
        }
        text("登录").waitFor();
        ran_sleep();
        return true;
      }
    }
    let listview = className("android.widget.ListView").findOne(1000);
    if (!listview) {
      log("找不到listview");
      err_flag = false;
      sleep(200);
      continue;
    }
    sleep(100); // 追求极限速度，不知道会不会出错
    let view_d28 = className("android.view.View").depth(28).indexInParent(0).findOne(1000);
    if (!view_d28) {
      toastLog("找不到view_d28");
      err_flag = false;
      sleep(200);
      continue;
    }
    // 根据父框的孩子数
    if (view_d28.childCount() > 0) {
      que_x = view_d28.bounds().left;
      que_y = view_d28.bounds().top;
      que_w = view_d28.bounds().width();
      que_h = view_d28.child(0).bounds().bottom - view_d28.bounds().top;
    }
    else {
      toastLog("找不到框体");
      log(view_d28.childCount(), view_d28.bounds());
      err_flag = false;
      sleep(200);
      continue;
    }
    let img = captureScreen();
    // 裁剪题干区域，识别题干
    let que_img = images.clip(img, que_x, que_y, que_w, que_h);
    //images.save(que_img, '/sdcard/1/que_img' + num + '.png');
//     let results = ocr.recognize(que_img).results;
//     let que_txt = ocr_rslt_to_txt(results).replace(/[^\u4e00-\u9fa5\d]|^\d{1,2}\.?/g, "");
    // 为了适配OCR插件改为下面这句
    let que_txt = ocr.recognizeText(que_img).replace(/[^\u4e00-\u9fa5\d]|\d{1,2}\./g, "");
    que_img.recycle();
    fInfo("题目识别："+ que_txt);
    let ans_list = get_ans_by_tiku(que_txt);
    //log(ans_list);
    let idx_dict = {"A": 0, "B": 1, "C": 2, "D": 3};
/************以下是因为随机选项顺序后失效的代码*****************/
    try { //防止别人先答完出错
      let idx = 0;
      if (ans_list.length <= 1) {
        if (ans_list.length == 1 && idx_dict[ans_list[0][0]] != undefined) {
          idx = idx_dict[ans_list[0][0]];
          fTips("答案:"+ ans_list[0].slice(2));
//           fInfo("答案:"+ ans_list[0]);
        }
        else if (ans_list.length == 0) {
          fInfo("未找到答案");
        }
        if (delay > 0 && num != 1) {sleep(random(delay, delay+50));}
        else {
          // 直到选项完全出现在屏幕
          while (className("android.widget.ListView").findOne(1000).indexInParent() == 0) {}
        }
        if (duizhan_mode == "guding") {
          let is_click = className("android.widget.RadioButton").findOnce(idx).parent().click();
          log(is_click);
          if (!is_click) {
            sleep(200);
            log(className("android.widget.RadioButton").findOnce(idx).parent().click());
          }
          num++;
          continue;
        } else if (duizhan_mode == "shoudong") {
          num++;
          textMatches(/第.+题|继续挑战/).waitFor();
          continue;
        }
      }
    }
    catch (e) {
      log("error1:", e);
    }
/************以上是因为随机选项顺序后失效的代码*****************/
    
    
    // 如果上面答案不唯一或者不包含找到的选项，直到选项完全出现在屏幕
    try {
    	while (className("android.widget.ListView").findOne(1000).indexInParent() == 0) {}
    } catch (e) {
      log("error2:", e);
      err_flag = false;
      sleep(200);
      continue;
    }
    let xuanxiang_list = className("android.widget.ListView").findOne(1000);
    let xuanxiang_index = xuanxiang_list.indexInParent();
    let xuanxiang_list_x = xuanxiang_list.bounds().left;
    let xuanxiang_list_y = xuanxiang_list.bounds().top;
    let xuanxiang_list_w = xuanxiang_list.bounds().width();
    let xuanxiang_list_h = xuanxiang_list.bounds().height();
    
    if (xuanxiang_list.parent().child(0) == null || !xuanxiang_list.parent().childCount() || !xuanxiang_list) {
      log("xuan_box is null");
      err_flag = false;
      sleep(200);
      continue;
    }
    log("开始截选项");
    img = captureScreen();
    // 裁剪所有选项区域
    let allx_img = images.clip(img, xuanxiang_list_x, xuanxiang_list_y, xuanxiang_list_w, xuanxiang_list_h);
		//images.save(allx_img, '/sdcard/1/x_img' + num + '.png');
    let xuan_txt_list = [];
    let allx_txt = "";
    allx_txt = ocr.recognizeText(allx_img);
    // 获取选项列表
    xuan_txt_list = allx_txt.match(/[a-f][^a-z\u4e00-\u9fa5\d]\s*.*?(?=[a-f][^a-z\u4e00-\u9fa5\d]|$)/gi);
    allx_img.recycle();
    if (!xuan_txt_list) {
      log("识别不出选项");
      err_flag = false;
      sleep(200);
      continue;
    }
    log(xuan_txt_list.toString());
    
    if (xuan_txt_list.length != 0) {
      let max_simi = 0;
      let right_xuan = '';
      let right_xuan2 = '';
      let ans_txt = '';
      for (let xuan_txt of xuan_txt_list) {
        let txt = xuan_txt.replace(/^[A-Z]\.?/gi, "");;
        for (let ans of ans_list) {
          let similar = str_similar(ans.slice(2), txt);
          if (similar > max_simi) {
            max_simi = similar;
            ans_txt = ans;
            if (duizhan_mode == "guding") {
              // 答案默认顺序优先
              right_xuan = ans[0];
              right_xuan2 = xuan_txt[0].toUpperCase();
            } else {
              // 文本匹配优先
              right_xuan2 = ans[0];
              right_xuan = xuan_txt[0].toUpperCase();
            }
          }
        }
      }
      if (ans_list.length > 1) {fTips("匹配答案:"+ ans_txt);}
      if (right_xuan != '' && duizhan_mode != "shoudong") {
        let idx = idx_dict[right_xuan];
        fInfo("最终:"+ right_xuan);
        try {className("android.widget.RadioButton").findOnce(idx).parent().click();}
        catch (e) {
          idx = idx_dict[right_xuan2];
          fInfo("备选:"+ right_xuan2);
          try {className("android.widget.RadioButton").findOnce(idx).parent().click();}
          catch (e1) {
            log("error3:", e1);
            err_flag = false;
            sleep(200);
            continue;
          }
        }
        //log(a);
      } else if (duizhan_mode == "shoudong") {
        textMatches(/第.+题|继续挑战/).waitFor();
      }
      else {
        try {className("android.widget.RadioButton").findOnce().parent().click();}
        catch (e1) {
          log("error4:", e1);
          err_flag = false;
          sleep(200);
          continue;
        }
      }
    }
    else {
      console.warn("未识别出选项");
      err_flag = false;
      sleep(200);
      continue;
    }
    img.recycle();
    num++;
  }
}

// 对战答错版
function dacuo(renshu) {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  if (renshu == 2) {
    // 点击进入双人对战
    jifen_list.child(9).child(3).click();
    text("随机匹配").waitFor();
    sleep(500);
    text("随机匹配").findOne().parent().child(0).click();
  }
  else if (renshu == 4) {
    // 点击进入四人赛
    jifen_list.child(8).child(3).click();
    // 等待开始比赛并点击
    fInfo("等待开始比赛");
    let start_click = text("开始比赛").findOne().click();
    fInfo("点击："+start_click);
  }
  fInfo("等待开始过渡");
  text("开始").waitFor();
  let num = 1;
  let err_flag = true;
  while (true) {
    // 如果是第一题或者下面出错，则跳过前面等待过渡
    if (num != 1 && err_flag) {
      // 检查到其中一个过渡界面为止
      while (true) {
        // 检测是否结束并退出
        if (text("继续挑战").exists()) {
          sleep(1000);
          text("继续挑战").findOne().click();
          sleep(1500);
          back();
          if (renshu == 2) {
            text("退出").findOne().click();
          }
          text("登录").waitFor();
          ran_sleep();
          fClear();
          return true;
        }
        else if (text("第" + num + "题").exists()) {break;}
      }
      // 直到过渡界面消失，再匹配下一题
      log("等待题号过渡");
      while (text("第" + num + "题").exists()) {} //sleep(100);
    }
    else if (!err_flag) {
      err_flag = true;
      if (text("继续挑战").exists()) {
        sleep(1000);
        text("继续挑战").findOne().click();
        sleep(1500);
        back();
        if (renshu == 2) {
          text("退出").findOne().click();
        }
        text("登录").waitFor();
        ran_sleep();
        return true;
      }
    }
    log("开始第"+num+"题，等待listview");
    //className("android.widget.ListView").waitFor();
    let listview = className("android.widget.ListView").findOne(1000);
    if (!listview) {
      log("找不到listview");
      err_flag = false;
      sleep(200);
      continue;
    }
    else {log("listview已存在");}
    sleep(100); // 追求极限速度，不知道会不会出错
    log("find view_d28");
    // listview父框体
    let view_d28 = className("android.view.View").depth(28).indexInParent(0).findOne(1000);
    if (!view_d28) {
      log("找不到view_d28");
      log('far:', listview.parent());
      log('garfa', listview.parent().parent());
      err_flag = false;
      sleep(200);
      continue;
    }
    if (view_d28.childCount() > 0) {
      que_x = view_d28.bounds().left;
      que_y = view_d28.bounds().top;
      que_w = view_d28.bounds().width();
      que_h = view_d28.child(0).bounds().bottom - view_d28.bounds().top;
    }
    else {
      toastLog("找不到框体内容");
      log(view_d28.childCount(), view_d28.bounds());
      err_flag = false;
      sleep(200);
      continue;
    }
    let idx_dict = {"A": 0, "B": 1, "C": 2, "D": 3};
    try { //防止别人先答完出错
      while (className("android.widget.ListView").findOne(1000).indexInParent() == 0) {}
      sleep(random(2000, 3000));
      log("选项显现");
      className("android.widget.RadioButton").findOnce(random(0,3)).parent().click();
      num++;
      continue;
    }
    catch (e) {
      log("error1:", e);
      err_flag = false;
      sleep(200);
      continue;
    }
    num++;
  }
}

/********订阅*********/
function do_dingyue() {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(10).child(3).click();
  fSet("title", "订阅…");
  fClear();
  let tab1 = descContains("Tab").findOne(9000);
  if (!tab1) {back();text("登录").waitFor();return false}
  let zuo1 = descContains("上新").findOne(9000);
  if (!zuo1) {back();text("登录").waitFor();return false}
  // 上方标签
  let tab_clt = descContains("Tab").untilFind();
  let total_click = 0;
  for (let tab of tab_clt) {
    tab.click();
    sleep(500);
    // 左方分类
    let zuo_clt = className("android.view.View").depth(14).findOne().children();
    for (let zuo of zuo_clt) {
      if (dingyue_dao) {zuo = zuo_clt[zuo_clt.length-1];}
      zuo.click();
      sleep(500);
      // 右方列表
      className("android.view.View").depth(14).waitFor();
      let you_clt = className("android.view.View").depth(14).findOnce(1);
      let last_desc = "";
      while (you_clt) {
        let img = captureScreen();
        // 订阅按钮集合
        let dingyue_clt = className("android.widget.ImageView").indexInParent(2).untilFind();
        // 最底下订阅的名称
        last_desc = dingyue_clt[dingyue_clt.length-1].parent().child(1).desc();
        for (let dingyue of dingyue_clt) {
          if (dingyue.bounds().bottom > device_h) {continue;}
          let pot = findColorInRegion(img, "#E42417", dingyue.bounds().left, dingyue.bounds().top,
                                    dingyue.bounds().width(), dingyue.bounds().height(), 20);
          //if (pot && dingyue.bounds().bottom < device_h) {
          if (pot) {
            fInfo("找到一个订阅");
            sleep(1000);
            let is_click = dingyue.click();
            fInfo("点击："+ is_click);
            //click(dingyue.bounds().centerX(), dingyue.bounds().centerY());
            sleep(1000);
            //click(pot.x, pot.y+5);
            total_click += 1;
          }
          if (total_click >= 2) {
            fInfo("订阅已完成");
            back();
            text("登录").waitFor();
            ran_sleep();
            return true;
          }
        }
        img.recycle();
        you_clt.scrollForward();
        sleep(500);
        // 滑动后重新查找最底下订阅的名称，判断是否到底
        dingyue_clt = className("android.widget.ImageView").indexInParent(2).untilFind();
        //log(dingyue_clt[dingyue_clt.length-1].parent().child(1).desc(), last_desc);
        try {
          if (dingyue_clt[dingyue_clt.length-1].parent().child(1).desc() == last_desc) {
            //toastLog("到底了");
            break;
          }
          last_desc = dingyue_clt[dingyue_clt.length-1].parent().child(1).desc();
        }
        catch (e) {log(e);}
      }
      if (dingyue_dao) {fInfo("只检查年度上新");break;}
    }
    sleep(1000);
  }
  fInfo("无可订阅项目");
  back();
  text("登录").waitFor();
  ran_sleep();
  return true;
}

/*********本地*********/
function do_bendi() {
  jifen_list = className("android.widget.ListView").depth(21).findOne();
  jifen_list.child(13).child(3).click();
  fSet("title", "本地…");
  fClear();
  text("切换地区").findOne(5000);
  if (text("立即切换").exists()) {
    text("取消").findOne(3000).click();
  }
  let banner = className("android.support.v7.widget.RecyclerView").findOne();
  let txt = banner.child(0).child(1).text();
  banner.child(0).click();
  className("android.widget.TextView").depth(11).text(txt).waitFor();
  sleep(1500);
  back();
  ran_sleep();
  jifen_init();
  ran_sleep();
  return true;
}
/**************************************上方为执行各项目函数*********************************************/



// 做一次题
function do_exec(type) {
  // 等待加载
  let tishi = text("查看提示").findOne();
  //log(tishi);
  // 点击查看提示按钮
  tishi.click();
  // 随机延迟、等待提示
  ran_sleep();
  // 等待加载
  text("提示").waitFor();
  
  // 判断题型
  /******************单选题*******************/
  if (textStartsWith("单选题").exists()) {
    // 获取题目
		//let que_txt = className("android.view.View").depth(23).findOnce(1).text();
    // 上面被专项答题影响了22、23层的元素数，只能通过其他层定位
    let que_txt = className("android.view.View").depth(24).findOnce(1).parent().parent().child(1).text();
    // log(que_txt);
    var ans = get_ans_by_re(que_txt);
    if (ans && depth(26).text(ans).exists()) {
      // 定位选项并点击
      depth(26).text(ans).findOnce().parent().click();
    }
    //else if (ans = get_ans_by_http_dati(que_txt)) {
    else {
      if (type) {ans = get_ans_by_dati_tiku(que_txt, type);}
      else {ans = get_ans_by_dati_tiku(que_txt);}
      let reg = /[A-F]/;
      if (ans && reg.test(ans) && ans.length == 1) {
        ans = ans.match(reg)[0];
        let idx_dict = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5};
        className("android.widget.RadioButton").findOnce(idx_dict[ans[0]]).parent().click();
      }
      // 否则用ocr
      else {
        if (!ans) {ans = get_ans_by_ocr1().replace(/\s/g, "");}
        if (depth(26).text(ans).exists()) {
          depth(26).text(ans).findOne().parent().click();
        }
        else {
          // 筛选出相似度最大的
          let xuan_clt = className("android.widget.RadioButton").find();
          let max_simi = 0;
          let xuanxiang = null;
          for (let n of xuan_clt) {
            let similar = str_similar(ans, n.parent().child(2).text());
            if (similar > max_simi) {
              max_simi = similar;
              xuanxiang = n.parent();
            }
          }
          //点击选项
          if (xuanxiang) {xuanxiang.click();}
          else {className("android.widget.RadioButton").findOne().parent().click();}
          //log(xuanxiang.find().size());
        }
      }
    }
  }
  /******************填空题*******************/
  else if (textStartsWith("填空题").exists()) {
    // 填空题题干会被空格分割
    //let que = className("android.view.View").depth(23).findOnce(1).children();
    // 上面被专项答题影响了22、23层的元素数，只能通过其他层定位
    let que = className("android.view.View").depth(24).findOnce(1).parent().parent().child(1).children();
    // 第一个编辑框的父元素
    let text_edit = className("android.widget.EditText").findOne().parent().children();
    // 第一个空答案字数，后期考虑换成全部答案字数
    let word_num = text_edit.find(className("android.view.View")).length;
    // 填空数
    let kong_num = 0;
    let que_txt = "";
    for (let i of que) {
      // 如果没有text则加个空格
      if (i.text()) {que_txt = que_txt + i.text();}
      else {
        kong_num += 1;
        que_txt = que_txt + "    ";
      }
    }
    // log(que_txt);
    // log("kong_num:", kong_num);
    // 判断是否只有一个空，re只能得出第一空答案
    if (kong_num <= 1) {
      //一个空时，先正则匹配，再题库匹配，以防题库出错，最后OCR
      //var ans = get_ans_by_http_dati(que_txt);
      if (type) {ans = get_ans_by_dati_tiku(que_txt, type);}
      else {ans = get_ans_by_dati_tiku(que_txt);}
      if (!ans) {ans = get_ans_by_re(que_txt);}
      //长度和空格数相等才会填充
      if (ans && word_num == ans.length) {
        // 定位填空并填入
        depth(25).className("android.widget.EditText").findOne().setText(ans);
      }
      else {
        ans = get_ans_by_ocr1().replace(/\s/g, "");
        if (!ans) {ans = "未识别出文字";}
        depth(25).className("android.widget.EditText").setText(ans);
      }
    }
    // 如果多个空，直接ocr按顺序填入
    else {
      //ans = get_ans_by_http_dati(que_txt);
      if (type) {ans = get_ans_by_dati_tiku(que_txt, type);}
      else {ans = get_ans_by_dati_tiku(que_txt);}
      if (!ans) {ans = get_ans_by_ocr1().replace(/\s/g, "");}
      if (!ans) {ans = "未识别出文字";}
      edit_clt = className("android.widget.EditText").find();
      for (let edit of edit_clt) {
        let n = edit.parent().children().find(className("android.view.View")).length;
        edit.setText(ans.slice(0, n));
        ans = ans.slice(n);
      }
    }
  }
  /******************多选题*******************/
  else if (textStartsWith("多选题").exists()) {
    // 获取题目
		// let que_txt = className("android.view.View").depth(23).findOnce(1).text();
    // 上面被专项答题影响了22、23层的元素数，只能通过其他层定位
    let que_txt = className("android.view.View").depth(24).findOnce(1).parent().parent().child(1).text();
    // log(que_txt);
    // 这里匹配出全部挖空
    let reg1 = /\s{3,}/g;
    let res = que_txt.match(reg1);
    // log(res);
    // 先看挖空数量和选项数量是否一致，判断是否全选
    let collect = className("android.widget.CheckBox").find();
    // 如果全选
    if (res.length == collect.length) {
      ans = "全选";
      for (let n of collect) {
        // 直接点击会点不上全部
        n.parent().click();
      }
    }
    //else if (ans = get_ans_by_http_dati(que_txt)) {
    else {
      if (type) {ans = get_ans_by_dati_tiku(que_txt, type);}
      else {ans = get_ans_by_dati_tiku(que_txt);}
      let reg = /[A-F]{1,6}/;
      if (ans && reg.test(ans)) {
        ans = ans.match(reg)[0];
        let idx_dict = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5};
        for (let n of ans) {
          className("android.widget.CheckBox").findOnce(idx_dict[n]).parent().click();
        }
      }
      // 如果不是全选
      else {
        ans = get_ans_by_ocr1();
        // 下面为匹配子串法
        ans = ans.replace(/[^\u4e00-\u9fa5\w]/g, "");
        log(ans);
        for (let n of collect) {
          let xuan_txt = n.parent().child(2).text().replace(/[^\u4e00-\u9fa5\w]/g, "");
          if (ans.indexOf(xuan_txt) >= 0) {
            n.parent().click();
          }
        }
      }
    }
  }
  fInfo("答案："+ans);
  // 返回退出查看提示界面
  back();
  sleep(1000);
  return true;
}

// 通过re匹配答案
function get_ans_by_re(que_txt) {
  // 定位挖空两侧字符，限制在两个标点符号内
  let reg1 = /([^，。？、；：” ]*?)\s{3,}([^，。？、；：” ]*)/;
  let res = que_txt.match(reg1);
  if (res[1] == '' && res[2] == '') {
    reg1 = /([^，。？、；：” ]*?[，。？、；：” ]*?)\s{3,}([，。？、；：” ]*?[^，。？、；：” ]*)/;
    res = que_txt.match(reg1);
  }
  // log(res);
  // 生成正则表达式
  let reg2_str = "/" + res[1] + "([^，。？、；：” ]*)" + res[2] + "/";
  let reg2 = eval(reg2_str);
  // log(reg2);
  // 获取试题信息、匹配答案
  // let tishi_txt = className("android.view.View").depth(23).findOnce(6).text();
  // 上面的查找方式会被出题方干扰
  // let tishi_txt = className("android.view.View").depth(22).findOnce(2).child(0).text();
  // 上面的层次在专项答题中出现变化
  let tishi_txt = text("提示").findOne().parent().parent().child(1).child(0).text();
  //log(tishi_txt);
  // 如果匹配到答案
  if (tishi_txt.match(reg2)) {
    let ans = tishi_txt.match(reg2)[1];
    log(ans);
    return ans;
  }
  else {return 0;}
}

// 通过ocr匹配答案
function get_ans_by_ocr1() {
  // 定位提示框位置
  //let tishi_box = className("android.view.View").depth(22).findOnce(2).child(0).bounds();
  // 上面的层次在专项答题中出现变化
  let tishi_box = text("提示").findOne().parent().parent().child(1).child(0).bounds();
  fInfo('开始截屏');
  let img = captureScreen();
  // 控制截图范围
  img = images.clip(img, tishi_box.left-10, tishi_box.top-10, tishi_box.width()+20, tishi_box.height());
  //images.save(img, '/sdcard/1/1.png');
  // 二值化
  img = images.interval(img, "#FD1111", 120);  //比inRange()好用多了
  //images.save(img, '/sdcard/1/2.png');
  let ans = "";
//   let resp = ocr.recognize(img).results;
//   ans = ocr_rslt_to_txt(resp);
  // 为适配第三方OCR改动
  ans = ocr.recognizeText(img);
  if (!ans) {fInfo("未识别出文字");}
  else {log(ans);} 
  img.recycle();
  return ans;
}

// 通过http请求匹配答案
function get_ans_by_http(que_txt) {
  // 匹配题空两边汉字、字母及数字
  let reg = /[\u4e00-\u9fa5\d]+/g;
  //let reg = /(\S*)\s{2,}(\S*)/;
  let res = que_txt.match(reg);
  if (res == null) {return [];}
  // 此处可以加个判断，不然截图没截好时会有bug
  // 选取长的一边并控制在十个字
  let longest = '';
  for (let r of res) {
    if (r.length > longest.length && r.indexOf("中华人民共和") < 0 && r.indexOf("习近平总书记") < 0) {
      longest = r;
    }
  }
  let keyword = longest.slice(0, 6);
  log(keyword);
  // 获取答案html并解析
  let req = http.get('http://www.syiban.com/search/index/init.html?modelid=1&q=' + encodeURI(keyword));
  let resp_str = req.body.string();
  let resp_list = resp_str.match(/答案：(.*?)<\/span><\/p>/g);
  let ans_list = [];
  if (resp_list != null) {
    for (let a of resp_list) {
      // 查找出来后答案中有不可见的ZERO WIDTH SPACE，需要清洗
      ans = a.match(/答案：(.*?)<\/span><\/p>/)[1].replace(/[\u200B-\u200D\uFEFF]/g, "");
      //log(ans);
      ans_list.push(ans);
    }
  }
  //log(ans_list);
  return ans_list;
}

// 通过离线答题题库匹配答案
function get_ans_by_dati_tiku(que_txt, type) {
  let keyword = que_txt.replace(/\s/g, "");
  let ans_list = [];
  let ans = null;
  if (dati_tiku.length == 0) {return false;}
  //for (let ti of dati_tiku) {
  for (let i = dati_tiku.length - 1; i >= 0; i--) {
    let ti = dati_tiku[i];
    if (ti[0].indexOf(keyword) > -1) {
      ans = ti[1];
      if (ans != "None") {ans_list.push(ans);}
    }
  }
  //if (!ans || ans == "None") {return false;}
  if (!ans_list) {return false;}
  if (type && ans_list.length > 1) {
    for (let a of ans_list) {
      if (a.indexOf(type) > -1) {
        ans = a.replace(type, "");
        break;
      }
    }
  }
  log("匹配题库：", ans);
  return ans;
}

// 通过http请求匹配答题答案
function get_ans_by_http_dati(que_txt) {
  // 获取答案html并解析
  let keyword = que_txt.replace(/\s/g, "");
  let req = http.get('https://tiku.3141314.xyz/search?table_name=tiku&page=1&rows=20&keyword=' + encodeURI(keyword));
  let resp_json = req.body.json();
  if (resp_json["total"] == 0) {return false;}
  let rows = resp_json["rows"];
  log(rows[0]);
  let ans_list = [];
  let ans = rows[0]["answer"];
  if (ans == "None") {return false;}
  //log(ans_list);
  return ans;
}

// 检测|更新离线题库
function update_dati_tiku() {
  let total_req = http.get("https://tiku.3141314.xyz/tableCount");
  let total = 1;
  let last_dati_tiku_link = storage.get("dati_tiku_link", "");
  let dati_tiku = storage.get('dati_tiku', []);
  if (total_req.statusCode == 200) {
    total = total_req.body.json()[0][0];
  } else {
    try {
      //dati_tiku = get_tiku_by_ct('https://webapi.ctfile.com/get_file_url.php?uid=35157972&fid=555754562&file_chk=94c3c662ba28f583d2128a1eb9d78af4&app=0&acheck=2&rd=0.14725283060014105');
      //dati_tiku = get_tiku_by_gitee('https://gitee.com/songgedodo/songge_tiku/raw/master/dati_tiku.txt');
      if (update_info["dati_tiku_link"] != last_dati_tiku_link) {
        dati_tiku = get_tiku_by_http(update_info["dati_tiku_link"]);
        storage.put("dati_tiku_link", update_info["dati_tiku_link"]);
        storage.put('dati_tiku', dati_tiku);
        fInfo("未识别出在线题库，已更新离线题库");
      }
      else {fInfo("未检测到题库更新，已用历史题库");}
      return dati_tiku
    } catch (e) {
      console.warn(e);
      if (dati_tiku) {
        fInfo("未识别出离线题库，已用历史题库");
        return dati_tiku
      }
    }
  }
  //log("update total:", total);
  if (!dati_tiku || dati_tiku.length != total) {
    let req = http.get("https://tiku.3141314.xyz/getAnswer");
    if (req.statusCode == 200) {
      dati_tiku = req.body.json();
      storage.put('dati_tiku', dati_tiku);
      fInfo("题库已更新");
    }
    else {
      fInfo("网络问题识别不出在线题库");
    }
  }
  return dati_tiku;
}

//上传错题
function upload_wrong_exec(endstr) {
  text("答案解析").waitFor();
  let que_txt = "";
  if (textStartsWith("填空题").exists()) {
    let que = className("android.view.View").depth(24).findOnce(1).parent().parent().child(1).children();
    for (let i of que) {
      // 如果没有text则加个空格
      if (i.text()) {que_txt = que_txt + i.text();}
      else {
        que_txt = que_txt + "    ";
      }
    }
  }
  else {
    que_txt = className("android.view.View").depth(24).findOnce(1).parent().parent().child(1).text();
  }
  let ans_txt = textStartsWith("正确答案：").findOne().text().replace(/正确答案：|\s+/g, "");
  let question = que_txt.replace(/\s/g, "");
  if (endstr) {ans_txt += endstr;}
  fError("错题:", question, ans_txt);
  //dati_tiku.unshift([question, ans_txt, null, null, null]);
  dati_tiku.push([question, ans_txt, null, null, null]);
  try {
  	updateToServer(question,ans_txt);
  }
  catch (e) {log(e);}
}

// 上传题目：
function updateToServer(question,answer) {
  fInfo("开始上传");
  var res = http.post("https://tiku.3141314.xyz/insertOrUpdate", 
                      {"question": question,"answer": answer, "pswd": "X2417481092ZY"});
  if (res.body.json()==200) {
    fInfo("成功");
    return true;
  }
  else {
    log(res.body.string());
    return false;
  }
}

// 通过缓存题库获取答案
function get_ans_by_tiku(que_txt) {
  let ans_list = [];
  let max_simi = 0;
  for (let ti of Object.keys(tiku)) {
    //log(ti.replace(/[\s_]/g, "").indexOf(que_txt));
    let ti_txt = ti.replace(/\[.+\]|^\d+\./g, "").replace(/[^\u4e00-\u9fa5\d]/g, "");
    //log(ti_txt);
    let len = que_txt.length;
    let simi = str_similar(ti_txt.slice(0, len+6), que_txt);
    //if (ti_txt.indexOf(que_txt) >= 0) {
    if (simi >= 0.25) {
      if (simi > max_simi) {
        ans_list.length = 0;
        ans_list.push(tiku[ti][1]);
        max_simi = simi;
      }
      else if (simi == max_simi) {ans_list.push(tiku[ti][1]);}
    }
  }
  return ans_list;
}

// 获取直链json
function get_tiku_by_http(link) {
  // 通过gitee的原始数据保存题库
  if (!link) {link = "https://gitee.com/songgedodo/songge_tiku/raw/master/tiku_json.txt"}
  let req = http.get(link);
  // log(req.statusCode);
  // 更新题库时若获取不到，则文件名+1
  if (req.statusCode != 200) {
    fError("网络错误，获取资源失败，退出脚本");
    exit();
    return false;
  }
  return req.body.json();
}

// 获取gitee题库
function get_tiku_by_gitee(link) {
  // 通过gitee的原始数据保存题库
  if (!link) {link = "https://gitee.com/songgedodo/songge_tiku/raw/master/tiku_json.txt"}
  let req = http.get(link);
  log(req.statusCode);
  // 更新题库时若获取不到，则文件名+1
  if (req.statusCode != 200) {
    link2 = link.replace(/(\w+)(?=\.txt)/, "$1"+"1");
    log(link2);
    req = http.get(link2);
  }
  return req.body.json();
}

// 获取城通网盘题库
function get_tiku_by_ct(link) {
  // 获取答案html并解析
  // 城通网盘解析
  if (!link) {link = "https://webapi.ctfile.com/get_file_url.php?uid=35157972&fid=546999609&file_chk=e83f4b72a2f142cca6ee87c64baba15c&app=0&acheck=2&rd=0.9023931062078081"}
  let req = http.get(link);
//   let resp_str = req.body.string();
//   let result = eval("("+ resp_str + ")");
  let result = req.body.json();
  let file = http.get(result["downurl"]);
//   return eval("("+ file.body.string() + ")");
  return file.body.json();
}

// 把ocr结果转换为正序的字符串
function ocr_rslt_to_txt(result) {
  let top = 0;
  let previous_left = 0;
  let txt = "";
  let txt_list = [];
  for (let idx in result) {
    if (top == 0) {top = result[idx].bounds.top;}
    if (previous_left == 0) {previous_left = result[idx].bounds.left;}
    if (result[idx].bounds.top >= top-10 && result[idx].bounds.top <= top+10) {
      if (result[idx].bounds.left > previous_left) {txt = txt + "   " + result[idx].text;}
      else {txt = result[idx].text + "   " + txt;}
    }
    else {
      top = result[idx].bounds.top;
      txt_list.push(txt);
      txt = result[idx].text;
    }
    if (idx == result.length-1) {txt_list.push(txt);}
    previous_left = result[idx].bounds.left;
  }
  //每行直接加个换行
  let ans = txt_list.join("\n");
  //log(ans);
  return ans;
}

// 重启每日、每周
function restart(restart_flag) {
  // 点击退出
  ran_sleep();
  back();
  text("退出").findOne().click();
  ran_sleep();
  switch (restart_flag) {
      // 0为每日答题
    case 0:
      text('登录').waitFor();
      jifen_list.child(4).child(3).click();
      break;
      // 1为每周答题
    case 1:
      // 等待列表加载
      text('本月').waitFor();
      //当出现已作答时，点击最后一个未作答
      while (!text("已作答").exists()) {
        depth(21).scrollable().findOne().scrollForward();
        sleep(200);
      }
      var clt = text("未作答").find();
      clt[clt.length-1].parent().click();
      break;
  }
}

// 从首页进入积分界面初始化
function jifen_init() {
  id("comm_head_xuexi_score").findOne().click();
  while (true) {
    let denglu = className("android.view.View").depth(24).text("登录").findOne(9000);
    if (denglu) {break;}
    back();
    sleep(1000);
    id("comm_head_xuexi_score").findOne().click();
  }
  fRefocus();
  className("android.webkit.WebView").scrollable().findOne().scrollForward();
  //jifen_list = className("android.widget.ListView").depth(21).findOne();
}

// 模拟随机时间0.5-3秒，后期可以用户自定义
function ran_sleep() {
  return sleep(random(1000, delay_time));
}

// 比较两个字符串相似度
function str_similar(str1, str2) {
  str1 = str1.replace(/[^\u4e00-\u9fa5\u2460-\u2469\wāáǎàōóǒòēéěèīíǐìūúǔùüǖǘǚǜ]/g, "");
  str2 = str2.replace(/[^\u4e00-\u9fa5\u2460-\u2469\wāáǎàōóǒòēéěèīíǐìūúǔùüǖǘǚǜ]/g, "");
  if (str1 == str2) {return 99;}
  if (str1.length > str2.length) {
    var muzi = str2;
    var instr = str1;
  }
  else {
    muzi = str1;
    instr = str2;
  }
  let reg = "/[" + muzi + "]{1}/g";
  let resu = instr.match(eval(reg));
	if (resu) {
    return (resu.length / instr.length);
  }
	else {return 0;}
}

// 关闭音乐浮动插件
function close_video() {
  let imv = className("android.widget.ImageView").find();
  //log(imv.empty());
  let swtch = imv[imv.length-1];
  swtch.click();
  sleep(1000);
  swtch.click();
  return true;
}

// 屏幕宽高、方向初始化
function init_wh() {
  fInfo("屏幕方向检测");
  log(device.width + "*" + device.height);
  var device_w = depth(0).findOne().bounds().width();
  var device_h = depth(0).findOne().bounds().height();
  log(device_w + "*" + device_h);
  if (device.width == device_h && device.height == device_w) {
    fError("设备屏幕方向检测为横向，后续运行很可能会报错，建议调整后重新运行脚本");
    sleep(10000);
  }
  else if (device.width == 0 || device.height == 0) {
    fError("识别不出设备宽高，建议重启hamibot后重新运行脚本");
    sleep(10000);
  }
  return [device_w, device_h]
}

// 尝试成功点击
function real_click(obj) {
  for (let i=1; i<=3; i++) {
    if (obj.click()) {log("real click: true"); return true;}
    sleep(300);
  }
  console.warn("控件无法正常点击：", obj);
  log("尝试再次点击");
  click(obj.bounds().centerX(), obj.bounds().centerY());
  return false;
}

// 测试ocr功能
function ocr_test() {
  try {
    fInfo("测试ocr功能，开始截图");
    let img_test = captureScreen();
    img_test = images.clip(img_test, 0, 100, device_w, 250);
    log("开始识别");
    console.time("OCR识别结束");
    ocr.recognizeText(img_test);
    console.timeEnd("OCR识别结束");
    fInfo("OCR功能正常");
    img_test.recycle();
    return true;
  }
  catch (e) {
    fError(e+"：ocr功能异常，退出脚本");
    exit();
    return false;
  }
}

// pushplus推送
function send_pushplus(token) {
  let r = http.postJson("http://www.pushplus.plus/send", {
    token: token,
    title: "天天向上："+name,
    content: "用户**" + name + "**已完成：" + jinri + "\n总积分：" + zongfen,
    template: "markdown",
  });
  if (r.body.json()["code"] == 200) {fInfo("推送成功");}
  else {log(r.body.json());}
}

// 发送email通知
function send_email(email) {
  let reg = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/;
  let e_addr = email.match(reg);
  if (!e_addr) {
    fError("请配置正确的邮件格式");
    return false;
  }
  let zongfen = jifen_list.parent().child(1).text();
  let content = "用户" + name + "已完成：" + zongfen;
  var data=app.intent({action: "SENDTO"});
  data.setData(app.parseUri("mailto:"+e_addr));
  data.putExtra(Intent.EXTRA_SUBJECT, "天天向上："+name);
  data.putExtra(Intent.EXTRA_TEXT, content);
  app.startActivity(data);
  return true;
}

// 强行退出应用名称
function exit_app(name) {
  // fClear();
  fInfo("尝试结束"+name+"APP");
  var packageName = getPackageName(name);
  if(!packageName){
    if(getAppName(name)){
      packageName = name;
    }else{
      return false;
    }
  }
	log("打开应用设置界面");
  app.openAppSetting(packageName);
  var appName = app.getAppName(packageName);
  //log(appName);
  log("等待加载界面")
  //textMatches(/应用信息|应用详情/).findOne(5000);
  text(appName).findOne(5000);
  sleep(1500);
  log("查找结束按钮")
  //let stop = textMatches(/(^强行.*|.*停止$|^结束.*)/).packageNameMatches(/.*settings.*|.*securitycenter.*/).findOne();
  let stop = textMatches(/(强.停止$|.*停止$|结束运行|停止运行|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp])/).findOne();
  log("stop:", stop.enabled())
  if (stop.enabled()) {
    //log("click:", stop.click());
    real_click(stop);
    sleep(1000);
    log("等待确认弹框")
    //let sure = textMatches(/(确定|^强行.*|.*停止$)/).packageNameMatches(/.*settings.*|.*securitycenter.*/).clickable().findOne();
    let sure = textMatches(/(确定|.*停止.*|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp]|O[Kk])/).clickable().findOne(1500);
    if (!sure) {
      fInfo(appName + "应用已关闭");
      back();
      return false;
    }
    log("sure click:", sure.click());
    fInfo(appName + "应用已被关闭");
    sleep(1000);
    back();
  } else {
    fInfo(appName + "应用不能被正常关闭或不在后台运行");
    back();
  }
  return true;
}

// 登录
function login(username, pwd) {
  var begin_obj = idMatches(/.*comm_head_xuexi_mine|.*btn_next/).findOne();
  if (begin_obj.text() == "登录") {
    log("查找ab");
    let a = className("EditText").id("et_phone_input").findOne();
    let b = className("EditText").id("et_pwd_login").findOne();
    a.setText(username);
    sleep(1000);
    b.setText(pwd);
    sleep(1000);
    begin_obj.click();
    sleep(3000);
    let packageName = getPackageName('学习强国');
    if (currentPackage() != packageName) {
      log("检测到弹窗，尝试返回");
      if (textMatches(/取消/).exists()) {
        textMatches(/取消/).findOne().click();
      }
      else {back();}
    }
  }
}

// 更新内容弹窗
// function gengxin_show() {
//   var dlg = dialogs.build({
//     title: engine_version + "版更新内容", 
//     content: "请授予hamibot悬浮窗(显示在其他应用上层)权限\n更新只答四人赛版本，可以市场搜索 对战_test,运行测试后反馈给我",
//     positive: "确定", checkBoxPrompt: '不再提示',
//   }).show();
//   while (!dlg.isShowing()) {}
//   log("dialog showing");
//   while (dlg.isShowing()) {sleep(500);}
//   return dlg.promptCheckBoxChecked;
// }

// 显示一个对象的所有方法，不知道ocr的返回对象有啥方法
function displayProp(obj) {    
    var names="";
    for(var name in obj){
       names+=name+": "+obj[name]+", ";
    }
    log(names);
}

/*******************悬浮窗*******************/
function fInit() {
  // ScrollView下只能有一个子布局
  var w = floaty.rawWindow(
    <card cardCornerRadius='8dp' alpha="0.8">
      <vertical>
        <horizontal bg='#FF000000' padding='10 5'>
        <text textColor="#FFFFFF" textSize="18sp">天天向上+V9.0</text>
        <text id='title' h="*" textColor="#FFFFFF" textSize="13sp" layout_weight="1" gravity="top|right"></text>
        </horizontal>
        <ScrollView>
          <vertical bg='#AA000000' id='container' minHeight='20' gravity='center'></vertical>
        </ScrollView>
      </vertical>
    	<relative  gravity="right|bottom">
    		<text id="username" textColor="#FFFFFF" textSize="12sp" padding='5 0'></text>
    	</relative>
    </card>
  );
  ui.run(function() {
    w.title.setFocusable(true);
  });
  w.setSize(700, -2);
  w.setPosition(50, 50);
  w.setTouchable(false);
  return w;
}

function fSet(id, txt) {
  ui.run(function() {
    w.findView(id).setText(txt);
  });
}

function fInfo(str) {
  ui.run(function() {
    let textView = ui.inflate(
      <text id="info" maxLines="2" textColor="#7CFC00" textSize="15sp" padding='5 0'></text>,
      w.container);
    textView.setText(str);
    w.container.addView(textView);
  });
  console.info(str);
}

function fError(str) {
  ui.run(function() {
    let textView = ui.inflate(
      <text id="error" maxLines="2" textColor="#FF0000" textSize="15sp" padding='5 0'></text>,
      w.container);
    textView.setText(str);
    w.container.addView(textView);
  });
  console.error(str);
}

function fTips(str) {
  ui.run(function() {
    let textView = ui.inflate(
      <text id="tips" maxLines="2" textColor="#FFFF00" textSize="15sp" padding='5 0'></text>,
      w.container);
    textView.setText(str);
    w.container.addView(textView);
  });
  console.info(str);
}

function fClear() {
  ui.run(function() {
    w.container.removeAllViews();
  });
}

function fRefocus() {
  threads.start(function() {
    ui.run(function() {
      w.requestFocus();
      w.title.requestFocus();
      ui.post(function() {
        w.title.clearFocus();
        w.disableFocus();
      }, 200);
    });
  });
  sleep(500);
}

/*******************主程序部分*******************/
/********定义全局变量*********/
var jifen_list, meizhou_dao, zhuanxiang_dao, dingyue_dao, storage_user, name, jinri, zongfen;
// 分割账号
if (zhanghao) {
  var zhanghao_list = [];
  for (let zh of zhanghao.split("\n")) {
    let userinfo = zh.split(/:|：/);
    zhanghao_list.push(userinfo);
  };
  if (zhanghao_list.length > 3) {zhanghao_list.length = 3;}
  for (let userinfo of zhanghao_list) {
    main(userinfo[0], userinfo[1]);
  }
  fClear();
  fInfo("登录回账号1");
  login(zhanghao_list[0][0], zhanghao_list[0][1]);
} else {
  main();
}

// main("18802583389", "xhbj.39000");
// main("15849082086", "zhangfpan0711");
// main("17684809426", "qxpcdodo");
// main("18647101545", "zhoukun147753");

function main(username, pwd) {
  // 检测更新提示代码，出现就点掉
  fInfo("开始更新弹窗检测");
  var noupdate_thread = threads.start(function() {
    //在新线程执行的代码
    className("android.widget.Button").text("立即升级").waitFor();
    fInfo("检测到升级弹窗");
    sleep(1000);
    var btn = className("android.widget.Button").text("取消").findOne();
    btn.click();
    fInfo("已取消升级");
  });
//   var keepQG_thread = threads.start(function() {
//     //在新线程执行的代码
//     let packageName = getPackageName('学习强国');
//     while (true) {
//       try {
//         if (currentPackage() != packageName) {
//           fInfo("请切换回学习强国");
//         }
//         text("当做sleep方法").findOne(1000);
//       } catch (e) {console.warn(e);}
//     }
//   });
  /********登录*********/
  fClear();
  login(username, pwd);
  /********获取用户姓名并读取本地数据*********/
  text("我的").findOne().click();
  name = id("my_display_name").findOne().text();
  storage_user = storages.create('songgedodo:'+name);
  fSet("username", name);
  back();
  ran_sleep();
  if (meizhou == "zhengxu") {meizhou_dao = false;}
  else if (meizhou == "daoxu") {meizhou_dao = true;}
  if (zhuanxiang == "zhengxu") {zhuanxiang_dao = false;}
  else if (zhuanxiang == "daoxu") {zhuanxiang_dao = true;}
  if (dingyue == "zhengxu") {dingyue_dao = false;}
  else if (dingyue == "daoxu") {dingyue_dao = true;}
  // 中断地理位置弹窗检测
  if (nolocate_thread.isAlive()) {
    nolocate_thread.interrupt();
    fInfo("终止位置权限弹窗检测");
  }
  // 中断更新弹窗检测
  if (noupdate_thread.isAlive()) {
    noupdate_thread.interrupt();
    fInfo("终止更新弹窗检测");
  }

  /********进入积分界面*********/
  // 点击积分
  id("comm_head_xuexi_score").findOne().click();
  // 等待"登录"项目加载
  // className("android.view.View").depth(24).text("登录").waitFor();
  text("登录").waitFor();
  // 往下滑一段加载
  className("android.webkit.WebView").depth(18).findOne().scrollForward();
  // jifen_list第一层child[0-14]为每一项，第二层child{0:项目名称; 1:积分规则; 2:已获分数; 3:跳转按钮}
  jifen_list = className("android.widget.ListView").depth(21).findOne();

  // 先判断评论分享
  if (fenxiang == "true") {
    if (jifen_list.child(11).child(2).text().match(/\d+/)[0] == "0" || jifen_list.child(12).child(2).text().match(/\d+/)[0] == "0") {
      toastLog("开始分享和评论");
      do_fenxiang();
      jifen_list = className("android.widget.ListView").depth(21).findOne();
    }
  }
  if (shipin == "true" && jifen_list.child(2).child(3).text() != "已完成") { // 视听学习
    toastLog("开始视听次数");
    do_shipin();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  if (wenzhang == "true" && jifen_list.child(1).child(3).text() != "已完成") { // 文章
    toastLog("开始文章次数与时长");
    do_wenzhang();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  if (meiri == "true" && jifen_list.child(4).child(3).text() != "已完成") { // 每日答题
    toastLog("每日答题开始");
    do_meiri();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  var meizhou_right = 1;
  if (meizhou != "false" && jifen_list.child(5).child(2).text().match(/\d+/)[0] == "0") { // 每周答题
    toastLog("每周答题开始");
    var meizhou_right = do_meizhou();
    while (!meizhou_right) {meizhou_right = do_meizhou();}
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  var zhuanxiang_right = 1;
  if (zhuanxiang != "false" && jifen_list.child(6).child(2).text().match(/\d+/)[0] == "0") { // 专项答题
    toastLog("专项答题开始");
    var zhuanxiang_right = do_zhuanxiang();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  if (tiaozhan == "true" && jifen_list.child(7).child(3).text() != "已完成") { // 挑战答题
    toastLog("挑战答题开始");
    do_tiaozhan();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  // 四人赛前先ocr功能测试
  ocr_test();
  if (siren == "true" && parseInt(jifen_list.child(8).child(2).text().match(/\d+/)[0]) <= 3) { // 四人两次
    toastLog("四人赛开始");
    do_duizhan1(4);
    do_duizhan1(4);
    let dacuo_n = Number(dacuo_num);
    if (dacuo_n) {
      fSet("title", "平衡胜率…");
      fClear();
      console.info("开始平衡胜率，答错次数："+dacuo_n);
      for (i=0; i<dacuo_n; i++) {
        fInfo("答错第"+ (i+1) + "轮");
        dacuo(4);
        fClear();
      }
    }
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  if (shuangren == "true" && jifen_list.child(9).child(2).text().match(/\d+/)[0] == "0") { // 双人对战
    toastLog("双人对战开始");
    do_duizhan1(2);
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  if (bendi == "true" && jifen_list.child(13).child(3).text() != "已完成") {
    toastLog("本地开始");
    do_bendi();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  var dingyue_right = 1;
  if (dingyue != "false" && jifen_list.child(10).child(2).text().match(/\d+/)[0] == "0") { // 订阅
    toastLog("订阅开始");
    var dingyue_right = do_dingyue();
    jifen_list = className("android.widget.ListView").depth(21).findOne();
  }
  jinri = jifen_list.parent().child(1).text();
  zongfen = text("成长总积分").findOne().parent().child(3).text();
  if (meizhou != "false" && !meizhou_right) {
    fError("每周答题可能由于识别错误、包含视频题而不能满分，请手动作答");
  }
  if (dingyue != "false" && !dingyue_right) {
    fError("未能识别出订阅界面，订阅不支持学习强国V2.33.0以上版本");
  }
  // push+推送
  if (pushplus) {
    try {send_pushplus(pushplus);}
    catch (e) {fError(e+":push+推送失败，请尝试切换流量运行或者设置114DNS");}
  }
  if (!zhanghao) {return true}
  // 退出登录
  back();
  text("我的").findOne().click();
  log("等待设置按钮");
  let setting = id("my_setting").findOne();
  sleep(1000);
  log("点击设置按钮");
  real_click(setting);
  // log(setting.click());
  log("等待退出登录");
  let signout = id("setting_sign_out").findOne();
  sleep(1000);
  log("点击退出登录");
  real_click(signout);
  // log(signout.click());
  text("确认").findOne().click();
  return true
}
/*****************结束后配置*****************/
launch('com.hamibot.hamibot');
//console.show();
// console.clear();
fInfo("已全部结束");
// 调回原始音量
if (yl_on) {
  fInfo("调回初始音量:"+ yuan_yl);
  device.setMusicVolume(yuan_yl);
}
// 取消屏幕常亮
fInfo("取消屏幕常亮");
device.cancelKeepingAwake();
// exit_app("学习强国");
// if (email) {
//   send_email(email);
// }
// 震动提示
device.vibrate(500);
fInfo("十秒后关闭悬浮窗");
sleep(10000);
console.hide();
home();

