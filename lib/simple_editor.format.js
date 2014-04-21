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
    this._registerImgs();

    // insert the image with url
    this._execCmd('insertImage', url, function(){
      // remove any attributes on the image we dont like
      _this._removeAttrs();

      // find the freshly inserted image and pass it to the callback if
      // included
      if (typeof cb === 'function'){
        cb.call(this, _this._newImg());
      }

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