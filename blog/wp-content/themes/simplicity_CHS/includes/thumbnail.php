<?php
/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
?>
<div class="thumbnail_box">
	<div class="thumbnail">
		<?php if ( get_post_meta($post->ID, 'wailianimg', true) ) : ?>
		<?php $image = get_post_meta($post->ID, 'wailianimg', true); ?>
		<a href="<?php the_permalink() ?>" rel="bookmark" title="<?php the_title(); ?>"><img src="<?php echo $image; ?>" alt="<?php the_title(); ?>"/></a>
		<?php else: ?>
		<a href="<?php the_permalink() ?>" rel="bookmark" title="<?php the_title(); ?>">
		<?php if (has_post_thumbnail()) { the_post_thumbnail('thumbnail'); } else { ?>
		<img src="<?php echo BYMT_catch_first_image() ?>" width="140px" height="100px" alt="<?php the_title(); ?>"/>
		<?php } ?>
		</a>
		<?php endif; ?>
	</div>
</div>
