
// Core editor object
// -----------------

var SimpleEditor = function(target, opts){
  this.log('initializing...', opts);

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
    placeholderClass: opts.placeholderClass || 'SimpleEditor-placeholder',
    attributeWhiteList: {
      img: ['src'],
      a: ['href', 'target']
    }
  };

  if (opts.attributeWhiteList){
    $.extend(this.options.attributeWhiteList, opts.attributeWhiteList);
  }

  this.options.tagWhiteList = opts.tagWhiteList || [
    'p', 'b', 'strong', 'i', 'em', 'span', 'br', 'img',
    'ul', 'li', 'a', this.options.headingElement.toLowerCase()
  ];

  // attach any event handler
  if (opts.onInit){
    this.options.onInit = opts.onInit;
  }

  // run some preprocessing
  this._setupTarget();
  this._placeholder();
  this._keyboardListeners();
  this.tidy();
  this._handleEmptyEditor();

  if (this.options.onInit){
    this.options.onInit.call(this);
  }
  this.trigger('editor:init');

  this.log('options', this.options);
  this.log('initialized!');
};

// TODO:
//  - autosave, write to localStorage where available
//  - track the current formatting option

SimpleEditor.prototype = {

  // Event delegation, wrapper around the jQuery object
  on:  function(){ this.$target.on.apply(this.$target, arguments); },
  one: function(){ this.$target.one.apply(this.$target, arguments); },
  off: function(){ this.$target.off.apply(this.$target, arguments); },
  trigger: function(){
    this.$target.trigger.apply(this.$target, arguments);
  },

  _setupTarget: function(){
    var _this = this;

    this.$target.addClass(this.options.css.target);
    this.$target.prop('contentEditable', true);
    this.$target.css({
      outline: 'none',
      minHeight: this.options.minHeight,
    });

    try {
      // make sure any changes are rendered as pure html and not with inline
      // styles
      document.execCommand('styleWithCSS', false, false);

      // stop images from being resized
      document.execCommand('enableObjectResizing', false, false);
    } catch(e){
      this.log('error running execCommands', e);
    }

    this.$target.on('focus', function(){
      if (_this.hasPlaceholder){
        _this.setCursor(0);
      }
    });
  },

  // If the editor is empty prepopulate an empty p tag to start writing into
  _handleEmptyEditor: function(){
    if (this.isEmpty()){
      // for some reason the cursor will not jump into a tag that has no height
      var lineHeight = this.$target.css('lineHeight');

      // so giving it a height makes this work... sigh
      this.$target.append('<p style="min-height: ' + lineHeight + '"> </p>');

      // set the cursor and give the editor focus
      this.setCursor(0);
      this.target.focus();
    }
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

  contents: function(preProcess){
    this.tidy();
    var html = this.$target.html();
    if (typeof preProcess === 'function'){
      html = preProcess.call(this, html);
    }
    return $.trim(html);
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
  },

  selection: {
    save: function() {
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          return sel.getRangeAt(0);
        }
      // IE
      } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange();
      }
      return null;
    },

    restore: function(range) {
      if (range) {
        if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        // IE
        } else if (document.selection && range.select) {
          range.select();
        }
      }
    }
  }

};


$.extend(
  SimpleEditor.prototype,
  Log,
  Tidy,
  Format
);