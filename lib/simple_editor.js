var SimpleEditor = function(target, opts){
  opts = opts || {};

  this.$target = $(target);
  this.target = this.$target[0];
  this.options = {
    cssClass: opts.cssClass || 'f-content-section',
    headingElement: opts.headingElement || 'H2',
    minHeight: opts.minHeight || 100,
  };
  this.options.tagWhiteList = opts.tagWhiteList || [
    'p', 'b', 'strong', 'i', 'em',
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
//  - keyboard actions (bold, italic, undo, redo)

SimpleEditor.prototype = {

  _setupTarget: function(){
    this.$target.addClass(this.options.cssClass);
    this.$target.prop('contentEditable', true);
    this.$target.css({
      outline: 'none',
      minHeight: this.options.minHeight
    });

    // insert a paragraph tag if the editor is empty
    if (this.$target.html().length === 0){
      this.paragraph();
    }
  },

  _keyboardListeners: function(){
    var _this = this;

    this.$target.on('paste', null, function(){
      setTimeout(function(){
        _this.tidy();
      }, 100);
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

  content: function(){
    return $.trim(this.$target.html());
  }

};


$.extend(
  SimpleEditor.prototype,
  Log,
  Tidy
);