
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
    this.log('tidy complete');
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

    this.log('remove tags');

    // remove tags that are not in the whitelist
    this.$target.find('*').each(function(i, el){
      var tagName = el.tagName.toLowerCase();
      if ( $.inArray(tagName, _this.options.tagWhiteList) === -1 ){
        $(el).remove();
      }
    });

    // remove empty inline elements, then any block level ones
    this.$target.find('span:empty, a:empty, b:empty, i:empty, strong:empty, em:empty').remove();
    this.$target.find('p:empty, li:empty').remove();
    this.$target.find(this.options.headingElement + ':empty, ul:empty');
  },

  // Remove all attributes we dont want
  _removeAttrs: function(){
    var _this = this, tags, excludeTags = ['a', 'img'];

    tags = $.map(this.options.tagWhiteList, function(n){
      if ( $.inArray(n.toLowerCase(), excludeTags) === -1) {
        return n.toLowerCase();
      }
    });

    this.log('removeAttrs', tags);

    // remove every attribute for the following tags
    this.$target.find(tags.join(', ')).each(function(iter, el){
      var isPlaceholder = $(el).hasClass(_this.options.placeholderClass);
      if (!isPlaceholder){
        for ( var i=0; i < el.attributes.length; i++){
          var name = el.attributes[i].name;
          $(el).removeAttr(name);
        }
      }
    });

    // remove any unnecessary attrs from anchor
    var aAttrs = ['href', 'target'];
    this.$target.find('a').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++ ){
        var name = el.attributes[i].name;
        if ( $.inArray(name, aAttrs) === -1 ){
          $(el).removeAttr(name);
        }
      }
    });

    // remove any unnecessary attrs from image
    var imgAttrs = ['src', 'data-imgid', 'data-src'];
    this.$target.find('img').each(function(iter, el){
      for ( var i=0; i < el.attributes.length; i++ ){
        var name = el.attributes[i].name;
        if ( $.inArray(name, imgAttrs) === -1 ){
          $(el).removeAttr(name);
        }
      }
    });
  }

};
