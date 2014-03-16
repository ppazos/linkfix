/* Requires jQuery */

$(function() { // ready

  var url_error     = "#F00";
  var url_ok        = "#0F0";
  var no_href_error = "#F90";
  var url_redirect_warning = "#FF0";
  var forbidden_warning = "#FF9";
  var local_file_warning = "#FF6";
  
  var feedback_url_error = $('<div style="background-color:'+ url_error +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">The URL does not seems to work :\(</div>');
  var feedback_url_ok = $('<div style="background-color:'+ url_ok +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This works!</div>');
  var feedback_no_href_error = $('<div style="background-color:'+ no_href_error +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This anchor does not have href</div>');
  var feedback_forbidden = $('<div style="background-color:'+ forbidden_warning +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This URL might work but the result was forbidden access</div>');
  var feedback_local_file = $('<div style="background-color:'+ local_file_warning +'; padding:2px; position:absolute; font-size:0.8em; font-family:Tahoma; z-index:9999;">This points to a local file</div>');


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
      default:
        console.log('default: '+ err);
    }
    
    $_element.css({'border':'3px solid '+ err});
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
  };
  
  /* Utility add startsWith to JS string */
  if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
      return this.indexOf(str) == 0;
    };
  }
  
  // Foreach link
  $("a").each(function( index, element ) {
  
    console.log( index + ": " + element.href, element );
    
    $element = $(element);
    
    /*
     * No href
     */
    if (element.href == undefined || element.href == "")
    {
      report(element, no_href_error);
    }
    else if (element.href.startsWith('file:///')) // Local file
    {
      //console.log('local: '+ element.href);
      report(element, local_file_warning);
    }
    else // Check request/response
    {
      var yql = 'http://query.yahooapis.com/v1/public/yql?q='+ encodeURIComponent( 'select * from html where url="'+ element.href +'"' ) +'&format=json&diagnostics=true&callback=?';
      
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
      
      /*
      $.ajax({
        type: "GET",
        url: element.href,
        sucess: function(a,b) { // >>>>>>>>>>> OK!
        
          console.log('OK', a, b);
          
        },
        error: function(a,b) { // >>>>>>>>>>>>>>>>>>>>>>>>>> ERROR
        
          console.log('ERR',a,b);
          
          report(element, feedback_url_error);
        }
      })
      .fail(function(a,b,c) {
        console.log( "fail error", a, b, c );
      })
      .done(function(a,b,c) {
        console.log( "done", a, b, c );
        
        report(element, feedback_url_ok);
      });
      */
    }
  });
});

//var _callbck_jsonp_calls = function(a,b,c) { console.log(a,b,c) };