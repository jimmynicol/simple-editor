
// Tidy functions
// -----------------
//  - remove all tags and attributes we dont want
//  - remove any html comments
//  - primarily used as a post-process from pasting from Word

var Tidy = {

  tidy: function(){
    this._removeComments();
    this._removeTags();
    this._removeAttrs();
  },

  _removeComments: function(){
    var html = this.$target.html();
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = $.trim(html);
    this.$target.html(html);
  },

  _removeTags: function(){
    var _this = this;

    // move all span contents to parent nodes
    this.$target.find('span').each(function(i, el){
      var $el = $(el),
          text = $(el).text();
      $el.parent().text(text);
    });

    // loop through all elements and remove tags we don't like
    this.$target.find('*').each(function(i, el){
      var tagName = el.tagName.toLowerCase();
      if ( $.inArray(tagName, _this.options.tagWhiteList) === -1 ){
        $(el).remove();
      }
    });
  },

  _removeAttrs: function(){
    this.$target.find('p, ul, li').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++){
        var name = el.attributes[i].name;
        $(el).removeAttr(name);
      }
    });

    this.$target.find('a').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++ ){
        var name = el.attributes[i].name;
        if ( name !== 'href' || name !== 'target'){
          $(el).removeAttr(name);
        }
      }
    });
  }

};
