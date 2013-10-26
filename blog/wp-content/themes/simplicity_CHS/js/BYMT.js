/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
jQuery(document).ready(function(){
$(function() {
        var o = 0;
        var timeInterval = 5000;
        var $cont = $(".tab-content ul");
        var $title = $(".tab-title span");
        $cont.hide();
        $($cont[0]).show();
        function auto() {
            o < $cont.length - 1 ? o++:o = 0;
            $cont.eq(o).fadeIn(800).siblings().hide();
            $title.eq(o).addClass("selected").siblings().removeClass("selected");
        }
        set = window.setInterval(auto, timeInterval);
});
//菜单多级
$('#menu li:has(> ul) > a').append(' &rsaquo;');
//弹性搜索框
$(".field").focus(function(){
$(this).stop(true,false).animate({width:"177px"},"slow");
})
.blur(function(){
$(this).animate({width:"110px"},"slow");
});
//文章标题链接点击滑动
$('.excerpt h2 a').hover(function(){
jQuery(this).stop().animate({marginLeft:"5px"},300);
},function(){
jQuery(this).stop().animate({marginLeft:"0px"},300);
});
//检测侧边栏
$(function($){
var conheight = document.getElementById("sidebar").offsetHeight
if (conheight == 0) {
	$('#sidebar').hide();
	$('#index_content').css("width","1076px");
	$('#content').css("width","1076px");
	}
});
//侧边栏链接点击滑动
$('#sidebar li a').hover(function(){
$(this).stop().animate({'left':'4px'},'600');
},function(){
$(this).stop().animate({'left':'0px'},'600');
});
//侧边栏TAB效果
$('.tab-title span').click(function(){
	jQuery(this).addClass("selected").siblings().removeClass();
	jQuery(".tab-content > ul").eq(jQuery('.tab-title span').index(this)).fadeIn(1500).siblings().hide();
});
//图片渐隐
jQuery('img').hover(
function() {jQuery(this).fadeTo("fast", 0.8);},
function() {jQuery(this).fadeTo("fast", 1);
});
//新窗口打开
$("a[rel='external'],a[rel='external nofollow']").click(
function(){window.open(this.href);return false})
//伸缩栏
$(".toggle_content").hide();
$(".toggle_title").click(function(){
	$(this).toggleClass("active").next().slideToggle('fast');
	return false
})
});