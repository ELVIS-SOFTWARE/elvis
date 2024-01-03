import './application.scss';
import './application_print.scss';

import 'jquery-ujs';
import '../inspinia/js/jquery-3.1.1.min.js';
import '../inspinia/js/plugins/metisMenu/jquery.metisMenu.js';
import '../inspinia/js/plugins/slimscroll/jquery.slimscroll.js';
import '../inspinia/js/plugins/slimscroll/jquery.slimscroll.js';
import '../inspinia/js/plugins/jasny/jasny-bootstrap.js';
import '../inspinia/js/bootstrap.js';
import '../inspinia/js/inspinia.js';
import '../inspinia/font-awesome/js/all';

FontAwesome.config.autoReplaceSvg = "nest";

// Support component names relative to this directory:
var componentRequireContext = require.context('components', true);

// Support images directory
require.context('../images', true, /\.(gif|jpg|png|svg)$/i);

var ReactRailsUJS = require('react_ujs');
ReactRailsUJS.useContext(componentRequireContext);
