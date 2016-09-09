<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', 'blog');

/** MySQL database username */
define('DB_USER', 'root');

/** MySQL database password */
define('DB_PASSWORD', 'root');

/** MySQL hostname */
define('DB_HOST', 'localhost');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8mb4');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '1jj^EC[rt&-|;,xS`vAV~^u>rs9gLa]GK|UHbRP`]nB=l;6oH:9?}G<JIr9otM~q');
define('SECURE_AUTH_KEY',  '/(+sL] CY$A1e[~FeH}[^WjmYlB{CCGd7%4k`4{ &1gtn`BFpB#NAR=V<yv!3ndB');
define('LOGGED_IN_KEY',    'TY<EP<9C4<LmyR>SdodJ`II(yCtokZzz+!BG2BeSy@)h-X>|C@ 6bq|M0P`-/a88');
define('NONCE_KEY',        '(![fP<[:/4+8*X/h[IY/RT2q+9L)@BA2C8~;Pnc(7mn&Kd]Ng]R&=vq]Q<)LonN4');
define('AUTH_SALT',        '9I5qX%V-!7h4quP}eQ4}v8e9l_eoI0w${=(UvyUuzMCu=qAxl9b^p6>G:@Y|5S#q');
define('SECURE_AUTH_SALT', '^lE,4F})&:[JQh^2/<*r(vkZdZwK~R9l? fXglHB.PYm<mRdJ)0fZ<_u,wcClzv?');
define('LOGGED_IN_SALT',   'Z>ex_<6wl*/^$LU.+LQN}y|Vd1jYC3gSo~`x8@,Z11f@(D<]Nm2:BbHP*A3N=lg|');
define('NONCE_SALT',       '/}#HA2byeDCo$2`5`BU~}Vj8}GsAy2[/.9@~YY1GMUN6/Z0.[<p#Mpoj!IQyF<Cq');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', false);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');


