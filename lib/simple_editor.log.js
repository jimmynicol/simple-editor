
// Log
// -----------------
//  - simple logger, turned on via query string

var Log = {

  _canLog: false,

  detectDebugMode: function(){
    if (window){
      var _this, search;

      // only proceed if the console object is available
      if ( !hasOwnProperty.call(window, 'console') ){
        return;
      }

      _this = this;
      search = window.location.search.replace(/^\?/, '').split('&');

      for (var i in search){
        var part = search[i];
        if (/^log=/.test(part)){
          _this._canLog = true;
        }
      }
    }
  },

  log: function(){
    if (this._canLog){
      console.log.apply(console, arguments);
    }
  }
};

// Detect if the browser session should be logging
Log.detectDebugMode();