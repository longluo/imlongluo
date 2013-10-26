<h2 class="tab-title"><span class="selected">最新文章</span><span>热评文章</span><span>随机文章</span></h2>
    <div class="tab-content">
        <ul class="hide"><?php $myposts = get_posts('numberposts=10&offset=0');foreach($myposts as $post) :?>
            <li><a href="<?php the_permalink(); ?>" rel="bookmark" title="<?php the_title_attribute(); ?>"><?php echo BYMT_cut_str($post->post_title,37); ?></a></li>
                <?php endforeach; ?>
        </ul>
        <ul><?php BYMT_get_most_viewed(); ?></ul>
		<ul class="hide"><?php $myposts = get_posts('numberposts=10&orderby=rand');foreach($myposts as $post) :?>
            <li><a href="<?php the_permalink(); ?>" rel="bookmark" title="<?php the_title_attribute(); ?>"><?php echo BYMT_cut_str($post->post_title,37); ?></a></li>
                <?php endforeach; ?>
        </ul>
    </div>