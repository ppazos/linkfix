/* Requires jQuery */

$(function() { // ready

  // FIXME: put errors and feedback in an array
  var url_error     = "#F00";
  var url_ok        = "#0F0";
  var no_href_error = "#F90";
  var autoref_warning = "#FA0";
  var url_redirect_warning = "#FF0";
  var forbidden_warning = "#FF9";
  var local_file_warning = "#FF6";
  
  /*
  var feedback_url_error = $('<div style="background-color:'+ url_error +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">The URL does not seems to work :\(</div>');
  var feedback_url_ok = $('<div style="background-color:'+ url_ok +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This works!</div>');
  var feedback_no_href_error = $('<div style="background-color:'+ no_href_error +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This anchor does not have href</div>');
  var feedback_forbidden = $('<div style="background-color:'+ forbidden_warning +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This URL might work but the result was forbidden access</div>');
  var feedback_local_file = $('<div style="background-color:'+ local_file_warning +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This points to a local file</div>');
  */
  
  var feedback_url_error = "The URL does not seems to work";
  var feedback_url_ok = "This works";
  var feedback_no_href_error = "This anchor does not have href";
  var feedback_lautoref_warning = "This is an autorreferece";
  var feedback_forbidden = "This URL might work but the result was forbidden access";
  var feedback_local_file = "This points to a local file";


  /* Utility to report results */
  var report = function(element, err) {
  
    var $_element = $(element); // Local para que no sea sobreescrito
    var fbk;
    switch (err) {
      case url_error:
        fbk = feedback_url_error;
      break;
      case url_ok:
        fbk = feedback_url_ok;
      break;
      case no_href_error:
        fbk = feedback_no_href_error;
      break;
      case local_file_warning:
        fbk = feedback_local_file;
      break;
      case forbidden_warning:
        fbk = feedback_forbidden;
      break;
      case autoref_warning:
        fbk = feedback_lautoref_warning;
      break;
      default:
        console.log('default: ', err);
    }
    
    if (fbk == undefined) return;
    
    $_element.css({'border':'3px solid '+ err});
    $_element.attr('title', fbk);
    
    /*
    var pos = $_element.offset();
    
    // where it appears depends on the quadrant where element is on
    if (pos.top < 30) // aparece abajo
    { 
      $('body').append( fbk.clone().css({'left':(pos.left)+'px', 'top':(pos.top + 42)+'px'}) );
    }
    else
    {
      $('body').append( fbk.clone().css({'left':(pos.left)+'px', 'top':(pos.top - 22)+'px'}) );
    }
    */
  };
  
  /* Utility add startsWith to JS string */
  if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
      return this.indexOf(str) == 0;
    };
  }
  if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str){
      return this.indexOf(str, this.length - str.length) !== -1;
    };
  }
  
  
  var doLocalRequest = function(uri, element) {

      $.ajax({
        type: "GET",
        url: uri
      })
      .fail(function(response, statusText) {
        console.log( "fail error");
        report(element, url_error);
      })
      .done(function(responseText, response, statusText) {
        console.log( "done");
        report(element, url_ok);
      });
  };

  var doRemoteRequest = function(uri, element) {
     
      var yql = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent( 'select * from html where url="'+ uri +'"' ) +'&format=json&diagnostics=true&callback=?';
      
      $.getJSON(yql, function(data, resultText, response) {
      
        //console.log(data, resultText, response);
        //console.log(data.query, '-------------');
        
        // Ver errores de acceso de YQL, marcar como warning, no quiere decir que el link no ande, es probable que si ande, sino deberia tirar 404 o 500
        if (data.query)
        {
          // data.query.diagnostics.url can be an array
          if (data.query.diagnostics.url['http-status-code'] == '403') // (Forbidden)
          {
            console.log('forbidden');
            report(element, forbidden_warning);
          }
          else if (data.query.results == null) // No result
          {
            report(element, url_error);
          }
          else
          {
            report(element, url_ok);
          }
        }
        else if (data.error)
        {
          // data.error.description tiene el mensaje
          report(element, url_error);
        }
      });
  };
  
  // Foreach link
  $("a").each(function( index, element ) {
  
    //console.log( index + ": " + element.href, element );
    
    $element = $(element);
    
    /*
     * No href
     */
    if (element.href == undefined || element.href == "")
    {
      console.log('no href', element.href);
      report(element, no_href_error);
    }
    else if (element.href.startsWith('file:///')) // Local file
    {
      //console.log('local: '+ element.href);
      report(element, local_file_warning);
    }
    else if (element.href.endsWith('#')) // Autoref
    {
      console.log('#', element.href);
      report(element, autoref_warning);
    }
    else // Check request/response
    {
      // Check if URI is local to do simple AJAX calls instead of YQL queries
      var uri = parseUri (element.href);
      
      console.log(element.href, uri);
      if (uri.host == "localhost") // is localhost?
      {
        //console.log("localhost");
        doLocalRequest(element.href, element);
      }
      else if (validIPaddress(uri.host)) // is IP?
      {
        if (isPrivateIP(uri.host)) // is private IP?
        {
          //console.log("local IP", ip);
          doLocalRequest(element.href, element);
        }
        else // is public IP
        {
          doRemoteRequest(element.href, element);
        }
      }
      else
      {
        doRemoteRequest(element.href, element);
      }
    }
  });
  
  



  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  function parseUri (str) {
  
     var options = {
         strictMode: true,
         key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
         q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
         },
         parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
         }
     };
  
     var	o   = options,
         m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
         uri = {},
         i   = 14;

      while (i--) uri[o.key[i]] = m[i] || "";

      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
         if ($1) uri[o.q.name][$1] = $2;
      });

      return uri;
  };

  function validIPaddress(ip_or_host)   
  {  
     if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip_or_host))  
     {  
       return true;
     }   
     return false;
  }

  function isPrivateIP(ip)
  {
    if (/(^127\.0\.0\.1)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)$/.test(ip))  
    {  
      return true;
    }   
    return false;
  }
  
}); // lib
