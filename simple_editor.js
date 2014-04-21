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
  
  var slice = [].slice;
  
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
        var args = ['SimpleEditor:'].concat(slice.call(arguments));
        console.log.apply(console, args);
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
      this._updateTags();
      this._removeTags();
      this._removeAttrs();
    },
  
    _reTidy: function(){
      var _this = this;
  
      this._retidyTimer = setInterval(function(){
        if (_this.$target.find('p[style], p[class]').length > 0){
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
  
    _updateTags: function(){
      var _this = this;
  
      // clicking return when in a heading makes a div on a newline, need to
      // convert this to a p tag.
      this.$target.find('div').each(function(i, el){
        var $el = $(el),
            $newP = $('<p>').html($el.html());
        $(el).replaceWith($newP);
      });
  
      // wrap any hanging spans in a p tag
      this.$target.find('> span').each(function(i, el){
        $(el).wrap('<p></p>');
      });
    },
  
    // Loop through all elements and remove tags we don't like
    _removeTags: function(){
      var _this = this;
  
      // remove tags that are not in the whitelist
      this.$target.find('*').each(function(i, el){
        var tagName = el.tagName.toLowerCase();
        if ( $.inArray(tagName, _this.options.tagWhiteList) === -1 ){
          $(el).remove();
        }
      });
  
      // remove empty inline elements, then any block level ones
      this.$target.find('span:empty, a:empty, b:empty, i:empty, strong:empty, em:empty').remove();
      this.$target.find('p:empty, li:empty').remove();
      this.$target.find(this.options.headingElement + ':empty, ul:empty');
    },
  
    // Remove all attributes we dont want
    _removeAttrs: function(){
      var _this = this, tags, excludeTags = ['a', 'img'];
  
      tags = $.map(this.options.tagWhiteList, function(n){
        if ( $.inArray(n.toLowerCase(), excludeTags) === -1) {
          return n.toLowerCase();
        }
      });
  
      // remove every attribute for the following tags
      this.$target.find(tags.join(', ')).each(function(iter, el){
        var isPlaceholder = $(el).hasClass(_this.options.placeholderClass);
        if (!isPlaceholder){
          for ( var i=0; i < el.attributes.length; i++){
            var name = el.attributes[i].name;
            $(el).removeAttr(name);
          }
        }
      });
  
      // remove any unnecessary attrs from anchor
      var aAttrs = ['href', 'target'];
      this.$target.find('a').each(function(iter, el){
        for ( var i=0; i < el.attributes.length; i++ ){
          var name = el.attributes[i].name;
          if ( $.inArray(name, aAttrs) === -1 ){
            $(el).removeAttr(name);
          }
        }
      });
  
      // remove any unnecessary attrs from image
      var imgAttrs = ['src', 'data-src', 'style'];
      this.$target.find('img').each(function(iter, el){
        for ( var i=0; i < el.attributes.length; i++ ){
          var name = el.attributes[i].name;
          if ( $.inArray(name, imgAttrs) === -1 ){
            $(el).removeAttr(name);
          }
        }
      });
    }
  
  };
  
  var Format = {
  
    bold: function(){ this._execCmd('bold'); },
  
    italic: function(){ this._execCmd('italic'); },
  
    unorderedList: function(){ this._execCmd('insertUnorderedList'); },
  
    heading: function(){
      this._execCmd(
        'formatBlock',
        '<' + this.options.headingElement + '>'
      );
    },
  
    paragraph: function(){ this._execCmd('formatBlock', '<P>'); },
  
    link: function(url, cb){
      var _this = this;
  
      this._registerTags('a');
  
      this._execCmd('createLink', url, function(){
        if (typeof cb === 'function'){
          cb.call(_this, _this._newTag('a'));
        }
        _this._registerTags('a');
      });
    },
  
    unlink: function(){ this._execCmd('unlink'); },
  
    undo: function(){ this._execCmd('undo'); },
  
    redo: function(){ this._execCmd('redo'); },
  
    img: function(url, cb){
      if (typeof url === 'undefined' || url.length === 0){
        this.log('inserting an image needs a url');
        return;
      }
  
      var _this = this;
  
      // make sure the placeholder is gone
      if (this.hasPlaceholder){
        this._removePlaceholder();
      }
  
      // keep track and mark any images currently inserted
      this._registerTags('img');
  
      // insert the image with url
      this._execCmd('insertImage', url, function(){
        // remove any attributes on the image we dont like
        _this._removeAttrs();
  
        // find the freshly inserted image and pass it to the callback if
        // included
        if (typeof cb === 'function'){
          cb.call(_this, _this._newTag('img'));
        }
  
        _this._registerTags('img');
      });
    },
  
    // Loop through all existing tags and add an id to them
    _registerTags: function(tag){
      this.$target.find(tag).each(function(i, tag){
        var tagId = tag + 'id';
        if (typeof $(tag).data(tagId) === 'undefined'){
          $(tag).data(tagId, i);
        }
      });
    },
  
    // Return the newly created tag
    _newTag: function(tag){
      var tags = this.$target.find(tag);
      for(var i in tags){
        var t = tags[i];
        if (typeof $(t).data(tag + 'id') === 'undefined'){
          return t;
        }
      };
      return null;
    },
  
    // Execute the desired command on the editor
    _execCmd: function(cmd, option, cb){
      if (typeof option === 'undefined'){
        document.execCommand(cmd);
      } else {
        document.execCommand(cmd, false, option);
      }
  
      var cmdState = document.queryCommandState(cmd);
  
      this.target.focus();
  
      if ( typeof cb !== 'undefined' ){
        cb.apply(this);
      }
    }
  
  };
  var SimpleEditor = function(target, opts){
    this.log('initializing...');
  
    opts = opts || {};
  
    this.$target = $(target);
  
    if ( this.$target.length === 0 ) {
      throw 'The editor needs a valid target!';
    }
  
    this.target = this.$target[0];
    this.hasPlaceholder = false;
  
    this.options = {
      css: {
        target: opts.css.target || '',
        placeholder: opts.css.placeholder || '',
      },
      minHeight: opts.minHeight || 100,
      headingElement: (opts.headingElement || 'h2').toUpperCase(),
      placeholder: opts.placeholder || this.$target.attr('placeholder') || null,
      placeholderClass: opts.placeholderClass || 'SimpleEditor-placeholder'
    };
  
    this.options.tagWhiteList = opts.tagWhiteList || [
      'p', 'b', 'strong', 'i', 'em', 'span', 'br', 'img',
      'ul', 'li', 'a', this.options.headingElement.toLowerCase()
    ];
  
    // run some preprocessing
    this._setupTarget();
    this._placeholder();
    this._keyboardListeners();
    this.tidy();
  
    // if the editor is empty prepopulate an empty p tag to start writing into
    if (this.isEmpty()){
      // for some reason the cursor will not jump into a tag that has no height
      var lineHeight = this.$target.css('lineHeight');
  
      // so giving it a height makes this work... sigh
      this.$target.append('<p style="min-height: ' + lineHeight + '"> </p>');
  
      // set the cursor and give the editor focus
      this.setCursor(0);
      this.target.focus();
    }
  
    this.log('options', this.options);
    this.log('initialized!', target);
  };
  
  // TODO:
  //  - autosave, write to localStorage where available
  //  - track the current formatting option
  
  SimpleEditor.prototype = {
  
    _setupTarget: function(){
      var _this = this;
  
      this.$target.addClass(this.options.css.target);
      this.$target.prop('contentEditable', true);
      this.$target.css({
        outline: 'none',
        minHeight: this.options.minHeight,
      });
  
      // make sure any changes are rendered as pure html and not with inline
      // styles
      document.execCommand('styleWithCSS', false, true);
  
      // stop images from being resized
      document.execCommand('enableObjectResizing', false, false);
  
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
        html += this.options.css.placeholder + '" contenteditable="false">';
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
      this.tidy();
      return $.trim(this.$target.html());
    },
  
    setCursor: function(position, elem){
      var range;
  
      elem = elem || this.target.lastChild;
      position = typeof position !== 'undefined' ? position : ($(elem).text().length - 1);
      position = position < 0 ? 0 : position;
  
      if( document.createRange ){
        var selection = window.getSelection();
  
        range = document.createRange();
        range.setStart(elem, position);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
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

  SimpleEditor.VERSION = '0.2.0';

  return SimpleEditor;
}));