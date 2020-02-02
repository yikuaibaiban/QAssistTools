# 使用方法
## 字符格式化
    $.SqAres.StrHelper.format("Hellow! {0},Welcome to {1}!", "Jack","Jquery");

## 无障碍浏览(辅助线)
    $.SqAres.Accessible.CreateAitLine();//添加辅助线  
    $.SqAres.Accessible.RemoveAitLine();//移除辅助线

## 设置背景色
    $("#div1").SqSetBackGround("#F00");

## 设置字体大小
    $("#div1").SqSetFontSize(12);

## 关键字标红
    $("#div1").SetKeyWord(new Array('keyword1','keyword2'));

## 无间断滚动内容
###  DOM
    <div id="div1">
        <div class="div1n">
        </div>
    </div>

###  CSS
    `#div1 {width:200px;height:50px;overflow:hidden;} `  
    `.div1n {float:left;white-space: nowrap;}`

###  Usage
    `$("#div1").Marquee(options);`
###  options
    direction: 'left',//滚动方向，'left','right','up','down'
    scrollAmount:1,//步长
    scrollDelay:20//时长
---
# 更新记录
* # 2013-6-24[v1.0.0.0]
  + 字符格式化，类似.net的string.Format
  + 无障碍浏览(辅助线)
  + 设置背景色
  + 设置字体大小
  + 关键字标红
  + 无间断滚动内容