
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

  _reTidy: function(){
    var _this = this;

    this._retidyTimer = setInterval(function(){
      if (_this.$target.find('p[style]').length > 0){
        _this.tidy();
        clearInterval(_this._retidyTimer);
      }
    }, 100);
  },

  // Remove all HTML comments
  _removeComments: function(){
    var html = this.$target.html();
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = $.trim(html);
    this.$target.html(html);
  },

  // Loop through all elements and remove tags we don't like
  _removeTags: function(){
    var _this = this;

    this.$target.find('*').each(function(i, el){
      var tagName = el.tagName.toLowerCase();
      if ( $.inArray(tagName, _this.options.tagWhiteList) === -1 ){
        $(el).remove();
      }
    });
  },

  // Remove all attributes we dont want
  _removeAttrs: function(){
    var tags = $.map(this.options.tagWhiteList, function(n){
      if ( n !== 'a' || n !== 'img' ){
        return n.toLowerCase();
      }
    });

    // remove every attribute for the following tags
    this.$target.find(tags.join(', ')).each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++){
        var name = el.attributes[i].name;
        $(el).removeAttr(name);
      }
    });

    // allow href and target for anchor tag
    this.$target.find('a').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++ ){
        var name = el.attributes[i].name;
        if ( name !== 'href' || name !== 'target'){
          $(el).removeAttr(name);
        }
      }
    });

    // allow href and target for anchor tag
    this.$target.find('img').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++ ){
        var name = el.attributes[i].name;
        if ( name !== 'src'){
          $(el).removeAttr(name);
        }
      }
    });
  }

};
