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

SimpleEditor.prototype = {

  _setupTarget: function(){
    // create a wrapper for the element
    this.$target.wrap('<div class="js-simple-editor-wrapper"></div>');
    $('.js-simple-editor-wrapper').css({
      position: 'relative',
      backgroundColor: this.$target.css('backgroundColor'),
      minHeight: this.options.minHeight
    });

    this.$target.addClass(this.options.css.target);
    this.$target.prop('contentEditable', true);
    this.$target.css({
      position: 'absolute',
      top: 0,
      left: 0,
      outline: 'none',
      width: '100%',
      minHeight: this.options.minHeight,
      backgroundColor: 'transparent'
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
      // get the active text selection
      var anchorNode = window.getSelection ? window.getSelection().anchorNode : document.activeElement;

      // set the text to be a paragraph if it is just a text node
      if (anchorNode && anchorNode.parentNode === _this.target){
        // _this.paragraph();
      }

      // if the editor is empty add the placeholder back
      _this._placeholder();
    });
  },

  _placeholder: function(){
    if (!this.options.placeholder || !this.isEmpty()){
      return;
    }

    if (this.options.placeholder && !this.hasPlaceholder){
      var html = '<div contenteditable="false" ';
      html += 'class="' + this.options.placeholderClass + ' ';
      html += this.options.css.placeholder + '" ';
      html += 'style="position:absolute;top:0;left:0;width:105%" ';
      html += '">';
      html += this.options.placeholder;
      html += '</div>';
      this.$target.parent().prepend(html);
      this.hasPlaceholder = true;
    }
  },

  _removePlaceholder: function(){
    this.$target.parent().find('.' + this.options.placeholderClass).remove();
    this.hasPlaceholder = false;
  },

  isEmpty: function(){
    var text = this.$target.text();
    return $.trim(text).length === 0;
  },

  contents: function(){
    return $.trim(this.$target.html());
  }

};


$.extend(
  SimpleEditor.prototype,
  Log,
  Tidy,
  Format
);