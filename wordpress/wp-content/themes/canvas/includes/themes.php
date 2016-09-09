<?php

/*-----------------------------------------------------------------------------------

TABLE OF CONTENTS

- more_themes_page

-----------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------*/
/* more_themes_page */
/*-----------------------------------------------------------------------------------*/

function more_themes_page(){
        ?>
		<STYLE type="text/css">
		.wrap {
			margin:0 15px 0 5px;
			font-family:Tahoma,'Microsoft Yahei','Simsun',Arial,sans-serif;
		}
		.wrap h2{
			font-family:Tahoma,'Microsoft Yahei','Simsun',Arial,sans-serif;
		}
		.themes-page div.info {
			height:30px;
			line-height:26px;
			margin-top:20px;
		}
		.themes-page div.info a {
			-moz-border-radius:4px 4px 4px 4px;
			border-radius:4px 4px 4px 4px;
			background:none repeat scroll 0 0 #D7E6F2;
			float:left;
			margin:0 10px 0 0;
			padding:3px 10px;
			font-size:12px;
		}
		.themes-page div.info a:link, .themes-page div.info a:visited {
			color:#21759B;
			font-size:12px;
			font-weight:bold;
			text-decoration:none;
			text-shadow:1px 1px 0 #FFFFFF;
		}
		.themes-page div.info a:active, .themes-page div.info a:hover {
			color:#155876;
		}
		ul.themes li.theme {
			border-bottom:1px solid #DDDDDD;
			
			padding:20px 0;
		}
		ul.themes li.theme h2{
			font-size:20px;
			padding:10px;
			border-bottom:1px dashed #ccc;
			font-family:Tahoma,'Microsoft Yahei','Simsun',Arial,sans-serif;
		}
		ul.themes li.theme h2 a{
			text-decoration:none;
		}

		ul.themes li.theme span img {
		}
		ul.themes li.theme div {
			margin-left:310px;
		}
		ul.themes li.theme div h2 {
			background:none repeat scroll 0 0 #EEEEEE;
			border-bottom:1px solid #DDDDDD;
			border-top:1px solid #E1E1E1;
			font-size:20px;
			margin-bottom:10px;
			padding:0 10px;
		}
		ul.themes li.theme div h2 a:link, ul.themes li.theme div h2 a:visited {
			color:#555555;
			font-style:normal;
			text-decoration:none;
		}
		ul.themes li.theme div p {
			padding-left:5px;
			width:450px;
		}
		ul.themes li.theme div p {
			font-size:12px !important;
			margin:10px;
		}
		ul.themes li.theme div ul {
			border-top:1px solid #EEEEEE;
			color:#CCCCCC;
			float:left;
			margin-left:20px;
			padding-left:0;
			padding-top:10px;
		}
		ul.themes li.theme div ul li {
			list-style:disc inside none;
		}
		ul.themes li.theme div ul li a:link, ul.themes li.theme div ul li a:visited {
			font-size:12px !important;
			text-decoration:none;
		}
		ul.themes li.theme div ul li a:hover, ul.themes li.theme div ul li a:active {
			text-decoration:underline;
		}
		#search input{
			height:26px;
			line-height:26px;
		}
		</STYLE>
        <div class="wrap themes-page">
        <h2>更多主题</h2>
        
		<?php // Get RSS Feed(s)
        include_once(ABSPATH . WPINC . '/feed.php');
        $rss = fetch_feed('http://www.iztwp.com/feed');			
        // Of the RSS is failed somehow.
        if ( is_wp_error($rss) ) {
                        
            $error = $rss->get_error_code();
                            
            if($error == 'simplepie-error') {
            
                //Simplepie Error
                echo "<div class='updated fade'><p>An error has occured with the RSS feed. (<code>". $error ."</code>)</p></div>";
            }
            return;
         } 
        ?>
        <div class="info">
			<a target="_blank" href="http://www.iztwp.com/">爱主题首页</a>
			<a target="_blank" href="http://list.qq.com/cgi-bin/qf_invite?id=f787cf0c754b8d7a680140374c107295a5579926ebd07b7c">订阅爱主题</a>
            <form id="search" method="get" action="http://www.iztwp.com/">
              <input type="text" name="s" id="textfield" onblur="if (this.value == '') {this.value = '输入关键词搜索...';}" onfocus="if (this.value == '输入关键词搜索...') {this.value = '';}" value="输入关键词搜索..." />
              <input type="submit" id="submit" value="搜索" />
          </form>
		</div>
        <?php
            $maxitems = $rss->get_item_quantity(30); 
			$items = $rss->get_items(0, 30);
        ?>
        <ul class="themes">
		<?php if (empty($items)) echo '<li>No items</li>';
        else
			foreach ( $items as $item ) : ?>
				<li class="theme">
                <h2><a target="_blank" href='<?php echo esc_url( $item->get_permalink() ); ?>'
        title='<?php echo $item->get_title(); ?>'>
        <?php echo esc_html( $item->get_title() ); ?></a></h2>
					<?php echo $item->get_content();?>
				</li>
			<?php 
			endforeach; ?>
        </ul>
    </div>        
         <?php
    }
	if (!function_exists('more_themes_recommend_page')):
	function izt_more_themes() {
	add_menu_page("More Themes", "<strong>更多主题</strong>", 0, 'iztwp', 'more_themes_page',get_bloginfo('template_url').'/images/izt_ico.png');
	}
	add_action('admin_menu', 'izt_more_themes');
	endif;
?>