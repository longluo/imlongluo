<?php
/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php bloginfo('charset'); ?>" />
<?php include('includes/title.php'); ?>
<link rel="stylesheet" type="text/css" href="<?php bloginfo('template_directory'); ?>/style.css" />
<!--[if IE 7]><link rel="stylesheet" href="<?php bloginfo('stylesheet_directory'); ?>/ie7.css" type="text/css" media="screen" /><![endif]-->
<!--[if IE 8]><link rel="stylesheet" href="<?php bloginfo('stylesheet_directory'); ?>/ie8.css" type="text/css" media="screen" /><![endif]-->
<link rel="Shortcut Icon" href="<?php bloginfo('template_directory');?>/images/favicon.png" type="image/x-icon" />
<link rel="alternate" type="application/rss+xml" title="<?php bloginfo('name'); ?> RSS Feed" href="<?php bloginfo('rss2_url'); ?>" />
<link rel="alternate" type="application/atom+xml" title="<?php bloginfo('name'); ?> Atom Feed" href="<?php bloginfo('atom_url'); ?>" />
<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
<script type="text/javascript" src="http://libs.baidu.com/jquery/1.8.3/jquery.min.js"></script>
<!--[if lt IE 9]><script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->
<?php if ( is_singular() ){ ?>
<script type="text/javascript" src="<?php bloginfo('template_directory'); ?>/comments-ajax.js"></script>
<script type="text/javascript" src="<?php bloginfo('template_directory'); ?>/js/comments.js"></script>
<script type="text/javascript" src="<?php bloginfo('template_directory'); ?>/js/realgravatar.js"></script>
<?php } ?>
<script type="text/javascript" src="<?php bloginfo('template_directory'); ?>/js/BYMT.js"></script>
<?php wp_head(); ?>
</head>
<body>
<div id="wrapper">
<div id="wrapper-inner">
<div id="header" class="container">
	<div id="header_inner"> 
		<span id="logo">
		<a title="<?php bloginfo('name'); ?>" href="<?php echo home_url(); ?>"><img src="<?php bloginfo('template_url');?>/images/logo.png" width="280px" height="60px" alt="<?php bloginfo('name'); ?>" /></a> 
		</span>
        <span id="topblock">
        <!--预留广告位-->
        </span>
	</div>
	<div class="line"></div>
	<div id="menu">
		<?php MT_menu('menu'); ?>
		<form action="<?php echo home_url( '/' ); ?>" method="get">
			<div id="search" class="input">
				<input type="text" name="s" class="field" value="我是搜索酱..." onFocus="if (this.value == '我是搜索酱...') {this.value = '';}" onBlur="if (this.value == '') {this.value = '我是搜索酱...';}" />
				<input type="submit" value="" />
			</div>
		</form>
	</div>
</div>
<div id="topbar" class="container">
 <span id="bulletin">
	<?php  if (is_category()||is_search()||is_404()||is_archive()) { ?>
	<?php BYMT_breadcrunbs(); ?>
	<?php  } else { ?>
	<?php
	$page_ID=4; //用来作为公告栏的文章id
	$announcement = '';
	$comments = get_comments("number=1&post_id=$page_ID");
	if ( !empty($comments) ) {
		foreach ($comments as $comment) {
			$announcement .= ''. convert_smilies($comment->comment_content) . ' <span style="color:#999;font-size: xx-small">(' . get_comment_date('m-d H:i',$comment->comment_ID) . ')</span>'; 
			if ($user_ID) echo '<a href="' . get_page_link($page_ID) . '#respond" rel="nofollow" class="anno">[发表]</a>';
		}
	}
	if ( empty($announcement) ) $announcement = '欢迎光临本博！';
	echo $announcement;
	?>
    <?php }  ?>
 </span> 
 <span id="rss">
	<ul>
		<li><a href="#你的facebook地址" target="_blank" class="icon5" title="My Facebook"></a></li>
		<li><a href="#你的twitter地址" target="_blank" class="icon4" title="Follow me"></a></li>
		<li><a href="#你的腾讯微博地址" target="_blank" class="icon3" title="我的腾讯微博"></a></li>
		<li><a href="#你的新浪微博地址" target="_blank" class="icon2" title="我的新浪微博"></a></li>
		<li><a href="<?php bloginfo('rss2_url'); ?>" target="_blank" class="icon1" title="订阅RSS"></a></li>
		<li class="weixin"><a href="#" title="关注我的微信"><img src="<?php bloginfo('template_url');?>/images/weixin-28.png" alt="微信" /><b><span></span><i><img src="<?php bloginfo('template_url');?>/images/weixin.jpg" alt="微信" /></i></b></a></li>
	</ul>
 </span>
</div>
