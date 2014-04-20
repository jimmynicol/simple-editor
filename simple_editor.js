/**
 * simple-editor - Medium.com like editor with plugin architecture
 * @author     James Nicol
 * @repository git@github.com:jimmynicol/simple-editor.git
 * @link       https://github.com/jimmynicol/simple-editor
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
  
    _reTidy: function(){
      var _this = this;
  
      this._retidyTimer = setInterval(function(){
        if (_this.$target.find('p[style]').length > 0){
          _this.tidy();
          clearInterval(_this._retidyTimer);
        }
      }, 100);
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
  
      // allow href and target for anchor tag
      this.$target.find('img').each(function(iter, el){
        for ( var i=0; i < el.attributes.length; i++ ){
          var name = el.attributes[i].name;
          if ( name !== 'src'){
            $(el).removeAttr(name);
          }
        }
      });
    }
  
  };
  
  var Format = {
  
    bold: function(){
      document.execCommand('bold');
    },
  
    italic: function(){
      document.execCommand('italic');
    },
  
    unorderedList: function(){
      document.execCommand('insertUnorderedList');
    },
  
    heading: function(){
      document.execCommand('formatBlock', false, '<' + this.options.headingElement + '>');
    },
  
    paragraph: function(){
      document.execCommand('formatBlock', false, '<P>');
    },
  
    link: function(url){
      document.execCommand('createLink', false, url);
      if (this.options.linkTarget.length > 0){
        this.$target.find('a').prop('target', '_blank');
      }
    },
  
    unlink: function(){
      document.execCommand('unlink');
    },
  
    undo: function(){
      document.execCommand('undo');
    },
  
    redo: function(){
      document.execCommand('redo');
    },
  
    img: function(link){
      document.execCommand('insertImage', false, link);
      this._removeAttrs();
    }
  
  };
  var SimpleEditor = function(target, opts){
    opts = opts || {};
  
    this.$target = $(target);
  
    if ( this.$target.length === 0 ) {
      throw 'The editor needs a valid target!';
    }
  
    this.target = this.$target[0];
    this.hasPlaceholder = false;
  
    this.options = {
      css: {
        target: opts.cssClass || 'f-content-section',
        placeholder: opts.placeholderClass || 'f-fc-medium f-font-italic f-fs-large',
      },
      headingElement: (opts.headingElement || 'h2').toUpperCase(),
      minHeight: opts.minHeight || 100,
      linkTarget: opts.linkTarget || '_blank',
      placeholder: opts.placeholder || this.$target.attr('placeholder') || null,
      placeholderClass: opts.placeholderClass || 'SimpleEditor-placeholder'
    };
  
    this.options.tagWhiteList = opts.tagWhiteList || [
      'p', 'b', 'strong', 'i', 'em', 'span', 'br',
      'ul', 'li', 'a', this.options.headingElement
    ];
  
    this._setupTarget();
    this._placeholder();
    this._keyboardListeners();
  
    this.log('Simple Editor initialized!', target);
  };
  
  // TODO:
  //  - link plugin
  //  - image insert plugin
  //  - autosave, write to localStorage where available
  //  - handle adding paragraph when no placeholder in place
  
  SimpleEditor.prototype = {
  
    _setupTarget: function(){
      var _this = this;
  
      this.$target.addClass(this.options.css.target);
      this.$target.prop('contentEditable', true);
      this.$target.css({
        outline: 'none',
        minHeight: this.options.minHeight,
      });
  
      this.$target.on('focus', function(){
        if (_this.hasPlaceholder){
          _this.setCursor(0);
        }
      });
    },
  
    _keyboardListeners: function(){
      var _this = this;
  
      // handle a paste into the editor
      this.$target.on('paste', null, function(){
        setTimeout(function(){
          _this.tidy();
          _this._reTidy();
        }, 100);
      });
  
      this.$target.on('keydown', function(e){
        // handle keyboard shortcuts
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
  
        // remove the placeholder if there is text in the editor
        if (_this.hasPlaceholder && !_this.isEmpty()){
          _this._removePlaceholder();
        }
      });
  
      this.$target.on('keyup', function(){
        // if the editor is empty add the placeholder back
        _this._placeholder();
      });
    },
  
    _placeholder: function(){
      if (!this.options.placeholder || !this.isEmpty()){
        return;
      }
  
      if (this.options.placeholder && !this.hasPlaceholder){
        // add in the placeholder wrapped in a p tag
        var html = '<p><span contenteditable="false" ';
        html += 'class="' + this.options.placeholderClass + ' ';
        html += this.options.css.placeholder + '">';
        html += this.options.placeholder;
        html += '</span></p>';
  
        // empty the editor of any random tags, append the placeholder and set
        // the cursor to the start of the paragraph
        this.$target.empty();
        this.$target.append(html);
        this.setCursor(0);
  
        this.hasPlaceholder = true;
  
        this.log('added placeholder');
      }
    },
  
    _removePlaceholder: function(){
      this.$target.find('.' + this.options.placeholderClass).remove();
      this.hasPlaceholder = false;
      this.log('removed placeholder');
    },
  
    isEmpty: function(){
      var text = this.$target.text();
      return $.trim(text).length === 0;
    },
  
    contents: function(){
      return $.trim(this.$target.html());
    },
  
    setCursor: function(position, elem){
      var range;
  
      elem = elem || this.target.lastChild;
      position = typeof position !== 'undefined' ? position : ($(elem).text().length - 1);
      position = position < 0 ? 0 : position;
  
      this.log('setCursor', position, elem);
  
      if( document.createRange ){
        var selection = window.getSelection(),
            elemText = elem.firstChild;
  
        selection.collapse(elemText, position);
        elem.parentNode.focus();
      } else {
        range = document.body.createTextRange();
        range.moveToElementText(elem);
        range.collapse(false);
        range.select();
      }
    }
  
  };
  
  
  $.extend(
    SimpleEditor.prototype,
    Log,
    Tidy,
    Format
  );

  SimpleEditor.VERSION = '0.0.1';

  return SimpleEditor;
}));