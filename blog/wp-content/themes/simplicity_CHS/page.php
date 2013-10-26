<?php
/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
?>
<?php get_header(); ?>
    <div id="content_wrap">
    <div id="content">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
            <div class="excerpt">
                <div class="context">
				<h2><?php the_title(); ?></h2>
                    <?php the_content('Read more...'); ?>
                </div>
            </div>
            <div class="comments">
			<?php comments_template(); ?>
            </div>
            <?php endwhile; ?>
        <?php endif; ?>
    </div>
<?php get_sidebar(); ?>
</div>
<?php get_footer(); ?>