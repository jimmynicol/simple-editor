/**
 * simple-editor - Medium.com like editor with plugin architecture
 * @author     James Nicol
 * @link       undefined
 * @license    MIT
 */




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

  
  // Log
  // -----------------
  //  - simple logger, turned on via query string
  
  var Log = {
  
    _canLog: false,
  
    detectDebugMode: function(){
      if (window){
        var _this, search;
  
        // only proceed if the console object is available
        if ( !hasOwnProperty.call(window, 'console') ){
          return;
        }
  
        _this = this;
        search = window.location.search.replace(/^\?/, '').split('&');
  
        for (var i in search){
          var part = search[i];
          if (/^log=/.test(part)){
            _this._canLog = true;
          }
        }
      }
    },
  
    log: function(){
      if (this._canLog){
        console.log.apply(console, arguments);
      }
    }
  };
  
  // Detect if the browser session should be logging
  Log.detectDebugMode();
  
  // Tidy functions
  // -----------------
  //  - remove all tags and attributes we dont want
  //  - remove any html comments
  //  - primarily used as a post-process from pasting from Word
  
  var Tidy = {
  
    tidy: function(){
      this._removeComments();
      this._removeTags();
      this._removeAttrs();
    },
  
    // Remove all HTML comments
    _removeComments: function(){
      var html = this.$target.html();
      html = html.replace(/<!--[\s\S]*?-->/g, '');
      html = $.trim(html);
      this.$target.html(html);
    },
  
    // Loop through all elements and remove tags we don't like
    _removeTags: function(){
      var _this = this;
  
      this.$target.find('*').each(function(i, el){
        var tagName = el.tagName.toLowerCase();
        if ( $.inArray(tagName, _this.options.tagWhiteList) === -1 ){
          $(el).remove();
        }
      });
    },
  
    // Remove all attributes we dont want
    _removeAttrs: function(){
      var tags = $.map(this.options.tagWhiteList, function(n){
        if ( n !== 'a' || n !== 'img' ){
          return n.toLowerCase();
        }
      });
  
      // remove every attribute for the following tags
      this.$target.find(tags.join(', ')).each(function(iter, el){
        for ( var i=0; i < el.attributes.length; i++){
          var name = el.attributes[i].name;
          $(el).removeAttr(name);
        }
      });
  
      // allow href and target for anchor tag
      this.$target.find('a').each(function(iter, el){
        for ( var i=0; i < el.attributes.length; i++ ){
          var name = el.attributes[i].name;
          if ( name !== 'href' || name !== 'target'){
            $(el).removeAttr(name);
          }
        }
      });
    }
  
  };
  
  var SimpleEditor = function(target, opts){
    opts = opts || {};
  
    this.$target = $(target);
    this.target = this.$target[0];
    this.options = {
      cssClass: opts.cssClass || 'f-content-section',
      focusClass: opts.focusClass || 'f-bg-xlight-o-light',
      headingElement: (opts.headingElement || 'H2').toUpperCase(),
      minHeight: opts.minHeight || 100,
    };
    this.options.tagWhiteList = opts.tagWhiteList || [
      'p', 'b', 'strong', 'i', 'em', 'span',
      'ul', 'li', 'a', this.options.headingElement
    ];
  
    this._setupTarget();
    this._keyboardListeners();
  
    this.log('Simple Editor initialized!', target);
  };
  
  // TODO:
  //  - link plugin
  //  - image insert plugin
  //  - autosave, write to localStorage where available
  //  - default empty editor to paragraph tag
  
  SimpleEditor.prototype = {
  
    _setupTarget: function(){
      var _this = this;
  
      this.$target.addClass(this.options.cssClass);
      this.$target.prop('contentEditable', true);
      this.$target.css({
        outline: 'none',
        minHeight: this.options.minHeight
      });
      this.$target.on('focus', function(e){
        $(e.target).toggleClass(_this.options.focusClass);
      });
    },
  
    _keyboardListeners: function(){
      var _this = this;
  
      // handle a paste into the editor
      this.$target.on('paste', null, function(){
        setTimeout(function(){
          _this.tidy();
        }, 100);
      });
  
      // handle keyboard shortcuts
      this.$target.on('keypress', function(e){
        if ( e.metaKey === true ){
          // a shortcut for bold
          if ( e.which === 98 ){
            _this.bold();
          }
  
          // a shortcut for italic
          if ( e.which === 105 ){
            _this.italic();
          }
        }
      });
    },
  
    bold: function(){
      document.execCommand('bold');
      this.target.focus();
    },
  
    italic: function(){
      document.execCommand('italic');
      this.target.focus();
    },
  
    unorderedList: function(){
      document.execCommand('insertUnorderedList');
      this.target.focus();
    },
  
    heading: function(){
      document.execCommand('formatBlock', false, this.options.headingElement);
      this.target.focus();
    },
  
    paragraph: function(){
      document.execCommand('formatBlock', false, 'P');
      this.target.focus();
    },
  
    link: function(url){
      document.execCommand('createLink', false, url);
      this.$target.find('a').prop('target', '_blank');
      this.target.focus();
    },
  
    unlink: function(){
      document.execCommand('unlink');
      this.target.focus();
    },
  
    undo: function(){
      document.execComment('undo');
      this.target.focus();
    },
  
    redo: function(){
      document.execComment('redo');
      this.target.focus();
    },
  
    contents: function(){
      return $.trim(this.$target.html());
    }
  
  };
  
  
  $.extend(
    SimpleEditor.prototype,
    Log,
    Tidy
  );

  SimpleEditor.VERSION = '0.0.1';

  return SimpleEditor;
}));