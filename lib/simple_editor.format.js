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
  }

};