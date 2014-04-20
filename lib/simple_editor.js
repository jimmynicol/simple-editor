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