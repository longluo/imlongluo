<?php
/****************
Theme Name: BYMT-free
Theme URL: http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html
Author: 麦田一根葱
Author URI: http://www.yuxiaoxi.com
Version: 1.0.1.3
****************/
?>
<div id="footer" class="container">
        <div class="copyright">&copy; 2012-2013 <a href="<?php echo home_url(); ?>"><?php bloginfo('name'); ?></a> All Rights Reserved</div>
		<div class="themeauthor">Powered by <a href="http://wordpress.org/" target="_blank"><strong>WordPress</strong></a> Theme by <a href="http://www.yuxiaoxi.com/2013-08-03-wordpress-theme-bymt.html" target="_blank" title="麦田一根葱"><strong>BYMT</strong></a></div>
</div>
</div>
</div>
<script type="text/javascript" src="<?php bloginfo('template_directory');?>/js/lazyload.js"></script>
<script type="text/javascript">
	jQuery(function() {          
    	jQuery(".thumbnail img,.context p img").lazyload({
        	placeholder:"<?php bloginfo('template_url'); ?>/images/image-pending.gif",
            effect:"fadeIn"
          });
    	});
</script>
<?php wp_footer(); ?> 
</body>
</html>