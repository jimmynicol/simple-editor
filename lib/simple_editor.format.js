
// Public formatting methods
// -----------------

var Format = {

  bold: function(){ this._execCmd('bold'); },

  italic: function(){ this._execCmd('italic'); },

  unorderedList: function(){ this._execCmd('insertUnorderedList'); },

  orderedList: function(){ this._execCmd('insertOrderedList'); },

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
    }
    return null;
  },

  // Execute the desired command on the editor
  _execCmd: function(cmd, option, cb){
    if (typeof option === 'undefined'){
      document.execCommand(cmd, false, null);
    } else {
      document.execCommand(cmd, false, option);
    }

    // var cmdState = document.queryCommandState(cmd);

    this.target.focus();

    if ( typeof cb !== 'undefined' ){
      cb.apply(this);
    }
  }

};