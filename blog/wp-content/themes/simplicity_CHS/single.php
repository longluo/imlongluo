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
			<h2>
				<?php the_title(); ?>
			</h2>
			<div class="meta_info">
				<ul id="resizer">
					<li id="f_s"><a href="javascript:void(0)">小</a></li>
					<li id="f_m"><a href="javascript:void(0)">中</a></li>
					<li id="f_l"><a href="javascript:void(0)">大</a></li>
				</ul>
				<span class="pauthor"><?php the_author() ?></span>
				<span class="ptime"><?php BYMT_time_diff( $time_type = 'post' ); ?></span>
				<span class="pcata"><?php the_category(', ') ?></span>
				<span class="pview"><?php if (function_exists('the_views')): ?><?php the_views(); ?><?php endif; ?></span>
				<span class="pcomm"><?php comments_popup_link ('抢沙发','1条评论','%条评论'); ?></span>
				<?php edit_post_link('编辑', ' [ ', ' ] '); ?>
			</div>
			<div class="clear"></div>
			<div class="context">
				<?php the_content('Read more...'); ?>
				<?php wp_link_pages(array('before' => '<div class="fanye">翻页继续：', 'after' => '</div>', 'next_or_number' => 'number','link_before' =>'<span>', 'link_after'=>'</span>')); ?>
				<div class="cut_line"><span>正文部分到此结束</span></div>
				<div class="post_copyright">
					<p>继续浏览:<?php BYMT_tags(); ?></p>
					<?php BYMT_txt_share(); ?>
				</div>
				<div class="post-navigation">
					<div class="post-previous">
						<?php previous_post_link( '%link', '<span>'. __( '上一篇:', 'tie' ).'</span> %title' ); ?>
					</div>
					<div class="post-next">
						<?php next_post_link( '%link', '<span>'. __( '下一篇:', 'tie' ).'</span> %title' ); ?>
					</div>
				</div>
			</div>
			<div class="comments">
				<?php comments_template(); ?>
			</div>
		</div>
		<?php endwhile; else: ?>
		<?php endif; ?>
	</div>
	<?php get_sidebar(); ?>
</div>
<?php get_footer(); ?>