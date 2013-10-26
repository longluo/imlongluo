<h2>评论排行</h2>
<ul>
<?php 
$my_email = "'" . get_bloginfo ('admin_email') . "'"; 
//获取管理员邮箱 
$counts = $wpdb->get_results("SELECT COUNT(comment_author) AS cnt, comment_author, comment_author_url, comment_author_email FROM (SELECT * FROM $wpdb->comments LEFT OUTER JOIN $wpdb->posts ON ($wpdb->posts.ID=$wpdb->comments.comment_post_ID) WHERE comment_date > date_sub( NOW(), INTERVAL 12 MONTH ) AND user_id='0' AND comment_author_email != $my_email AND comment_author != 'admin' AND post_password='' AND comment_approved='1' AND comment_type='') AS tempcmt GROUP BY comment_author_email
ORDER BY cnt DESC LIMIT 15"); 
foreach ($counts as $count) { 
$tavatar =get_avatar($count->comment_author_email, 38);
$c_url = $count->comment_author_url; 
$mostactive .= '<li>' . '<a href="'. $c_url . '" title="' . $count->comment_author . ' (赐教'. $count->cnt . '次)" rel="external nofollow">' . $tavatar . '</a></li>'; 
}
echo $mostactive; 
?>
</ul>