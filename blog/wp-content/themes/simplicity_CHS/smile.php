<?php
/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
?>
<?php
function wp_smilies() {
	global $wpsmiliestrans;
	if ( !get_option('use_smilies') or (empty($wpsmiliestrans))) return;
	$smilies = array_unique($wpsmiliestrans);
	$link='';
	foreach ($smilies as $key => $smile) {
		$file = get_bloginfo('template_url').'/images/smilies/'.$smile;
		$value = " ".$key." ";
		$img = "<img src=\"{$file}\" alt=\"{$smile}\" />";
		$imglink = htmlspecialchars($img);
		$link .= "<a href=\"###\" title=\"{$value}\" onclick=\"document.getElementById('comment').value += '{$value}'\">{$img}</a>&nbsp;";
	}
	echo $link;
}
?>
<?php wp_smilies();?>