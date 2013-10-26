<?php
/****************
Theme Name: BYMT
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.2
****************/
?>
<?php if ( is_home() ) { ?><title><?php bloginfo('name'); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('description'); ?></title><?php } ?>
<?php if ( is_search() ) { ?><title>"<?php the_search_query(); ?>"的搜索结果<?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if ( is_single() ) { ?><title><?php echo trim(wp_title('',0)); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if ( is_page() ) { ?><title><?php echo trim(wp_title('',0)); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if ( is_category() ) { ?><title><?php single_cat_title(); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if ( is_month() ) { ?><title><?php the_time('F'); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if ( is_404() ) { ?><title>404错误：<?php echo trim(wp_title('',0)); ?> | <?php bloginfo('name'); ?></title><?php } ?>
<?php if (function_exists('is_tag')) { if ( is_tag() ) { ?><title>Tag：<?php  single_tag_title("", true); ?><?php if($paged > 1) printf(' - 第%s页',$paged); ?> | <?php bloginfo('name'); ?></title><?php } ?> <?php } ?>
<?php
if (!function_exists('utf8Substr')) {
 function utf8Substr($str, $from, $len)
 {
     return preg_replace('#^(?:[\x00-\x7F]|[\xC0-\xFF][\x80-\xBF]+){0,'.$from.'}'.
          '((?:[\x00-\x7F]|[\xC0-\xFF][\x80-\xBF]+){0,'.$len.'}).*#s',
          '$1',$str);
 }
}
if ( is_single() ){
    if ($post->post_excerpt) {
        $description  = $post->post_excerpt;
    } else {
   if(preg_match('/<p>(.*)<\/p>/iU',trim(strip_tags($post->post_content,"<p>")),$result)){
    $post_content = $result['1'];
   } else {
    $post_content_r = explode("\n",trim(strip_tags($post->post_content)));
    $post_content = $post_content_r['0'];
   }
         $description = utf8Substr($post_content,0,220);  
  } 
    $keywords = "";     
    $tags = wp_get_post_tags($post->ID);
    foreach ($tags as $tag ) {
        $keywords = $keywords . $tag->name . ",";
    }
}
?>
<?php echo "\n"; ?>
<?php if ( is_single() ) { ?>
<?php if (strstr($description,"countdown")) { ?>
<meta name="description" content="这里面是什么内容？倒计时结束后，马上为您揭晓！" />
<?php }else{ ?>
<meta name="description" content="<?php echo trim($description); ?>" />
<?php } ?>
<meta name="keywords" content="<?php echo rtrim($keywords,','); ?>" />
<?php }else{ ?>
<meta name="description" content="<?php bloginfo('description'); ?>" />
<meta name="keywords" content="<?php bloginfo('keywords'); ?>" />
<?php } ?>