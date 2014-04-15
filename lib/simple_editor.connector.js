// @echo BANNER

// Simple Editor
// -----------------

(function(root, factory){
  'use strict';

  // AMD
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function($){
      return factory(root, $);
    });

  // CommonJS: for Node.js or Browserify
  } else if (typeof exports !== 'undefined') {
    var $ = require('jquery');

    module.exports = factory(root, $);

  // Finally, as a browser global.
  } else {
    root.SimpleEditor = factory(root, root.jQuery);
  }

}(this, function(root, $){
  'use strict';

  // pull out some functions from primitive prototypes
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  // @include simple_editor.log.js
  // @include simple_editor.tidy.js
  // @include simple_editor.js

  SimpleEditor.VERSION = '/* @echo VERSION */';

  return SimpleEditor;
}));