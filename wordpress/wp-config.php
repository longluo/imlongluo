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
define('AUTH_KEY',         '/>V&+k#rfAG4AS!~V,2T6%,V0y?,7mazvG_u=(-Kt94-~#,4+>7B*]q,Nq9Ny:if');
define('SECURE_AUTH_KEY',  'U^2d8= o-^k;9N@$LK6nJ&?vb*CnE@q1iQZ+(`wNjNYF<MQ2?,wJ>;K,|jvl|SI.');
define('LOGGED_IN_KEY',    '-ES)9mQnomlcHAyi1ZU~9vMj#.X4!N1yhk$6^EO+IWYY4RUQlv f g}ab_gh#sQ#');
define('NONCE_KEY',        'a)5<?MhEYF=u+B|HV,Z.H8F6GHdUO_3v-Q plP|S:j6S4BWW=KD.TR%tT8m!pthu');
define('AUTH_SALT',        '3Angjt1#aW-B.Ox&aPbvNOoKHRZF}yPGmKYPD8_8Gw.0m!p;?%*%F]nxcZ@< /o3');
define('SECURE_AUTH_SALT', 'zFauq091S/YI>#${0/,%,jgNV!_L)|Oga^jh>KKDrLh .; %11sNmnuhgglf.2Ln');
define('LOGGED_IN_SALT',   'h1Lw%?g^L@g372Px%B[VH~%l[Zu?fDZ,~uhH_}kXiU4GY2Tb8ExEQpC1ad~v_}x5');
define('NONCE_SALT',       'aG[<rJ~eRapk@3bZ|yr);IxBn~|A6sn2_S5zw)AA8Sf?@#J4*:V/iQ-S|bx3=w)T');

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

