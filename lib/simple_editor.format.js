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

  link: function(url){
    var _this = this;
    this._execCmd('createLink', url, function(){
      if (_this.options.linkTarget.length > 0){
        _this.$target.find('a').prop('target', '_blank');
      }
    });
  },

  unlink: function(){ this._execCmd('unlink'); },

  undo: function(){ this._execCmd('undo'); },

  redo: function(){ this._execCmd('redo'); },

  img: function(url, opts, cb){
    var _this = this;

    opts = opts || {};

    if (this.hasPlaceholder){
      this._removePlaceholder();
    }

    this._registerImgs();

    this._execCmd('insertImage', url, function(){
      _this._removeAttrs();
      var $img = $(_this._newImg());
      $img.attr('data-src', $img.attr('src'));
      _this._registerImgs();
    });
  },

  _registerImgs: function(){
    this.$target.find('img').each(function(i, img){
      if (typeof $(img).data('imgid') === 'undefined'){
        $(img).data('imgid', i);
      }
    });
  },

  _newImg: function(){
    var imgs = this.$target.find('img');
    for(var i in imgs){
      var img = imgs[i];
      if (typeof $(img).data('imgid') === 'undefined'){
        return img;
      }
    };
    return null;
  },

  _execCmd: function(cmd, option, cb){
    if (typeof option === 'undefined'){
      document.execCommand(cmd);
    } else {
      document.execCommand(cmd, false, option);
    }

    this.target.focus();

    if ( typeof cb !== 'undefined' ){
      cb.apply(this);
    }
  }

};