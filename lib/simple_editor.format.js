var Format = {

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
    if (this.options.linkTarget.length > 0){
      this.$target.find('a').prop('target', '_blank');
    }
    this.target.focus();
  },

  unlink: function(){
    document.execCommand('unlink');
    this.target.focus();
  },

  undo: function(){
    document.execCommand('undo');
    this.target.focus();
  },

  redo: function(){
    document.execCommand('redo');
    this.target.focus();
  },

  img: function(link){
    document.execCommand('insertImage', false, link);
  }

};