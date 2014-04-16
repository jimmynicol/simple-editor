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
      focus: opts.focusClass || 'f-bg-xlight-o-light',
      placeholder: opts.placeholderClass || 'f-fc-medium f-font-italic f-fs-large',
    },
    headingElement: (opts.headingElement || 'h2').toUpperCase(),
    minHeight: opts.minHeight || 100,
    linkTarget: opts.linkTarget || '_blank',
    placeholder: opts.placeholder || this.$target.attr('placeholder') || null
  };

  this.options.tagWhiteList = opts.tagWhiteList || [
    'p', 'b', 'strong', 'i', 'em', 'span', 'br',
    'ul', 'li', 'a', this.options.headingElement
  ];

  this._placeholder();
  this._setupTarget();
  this._keyboardListeners();

  this.log('Simple Editor initialized!', target);
};

// TODO:
//  - link plugin
//  - image insert plugin
//  - autosave, write to localStorage where available

SimpleEditor.prototype = {

  _setupTarget: function(){
    var _this = this;

    this.$target.addClass(this.options.css.target);
    this.$target.prop('contentEditable', true);
    this.$target.css({
      outline: 'none',
      minHeight: this.options.minHeight
    });
    this.$target.on('focus', function(e){
      $(e.target).toggleClass(_this.options.css.focus);
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

    // handle keyboard shortcuts
    this.$target.on('keydown', function(e){
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
      var anchorNode = window.getSelection ? window.getSelection().anchorNode : document.activeElement;

      // set the text to be a paragraph if it is just a text node
      if (anchorNode && anchorNode.parentNode === _this.target){
        _this.paragraph();
      }

      // if the editor is empty add the placeholder back
      _this._placeholder();
    });
  },

  _placeholder: function(){
    if (!this.options.placeholder || !this.isEmpty()){
      return;
    }

    if (this.options.placeholder){
      var html = '<div contenteditable="false" ';
      html += 'class="SimpleEditor-placeholder ';
      html += this.options.css.placeholder + '">';
      html += this.options.placeholder;
      html += '</div>';
      this.$target.empty().append(html);
      this.hasPlaceholder = true;
      this.target.focus();
    }
  },

  _removePlaceholder: function(){
    this.$target.find('.SimpleEditor-placeholder').remove();
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