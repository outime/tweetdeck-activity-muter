$(function() {
  var mutedUserlist, attachInterval = null;

  chrome.storage.sync.get('mutedUserlist', function(result) {
    mutedUserlist = result.mutedUserlist;
    if (typeof mutedUserlist === 'undefined') return;
    attachInterval = window.setInterval(function(){
      if ($('.column-type-activity .chirp-container article').length) {
        attachActivityMuter();
        cleanActivityColumn();
        clearInterval(attachInterval);
      }
    }, 500);
  });

  function cleanActivityColumn(){
    $(".column-type-activity .chirp-container article").each(function(article) {
      var authorDiv = $(this).find(".account-link")[0];
      var author = $(authorDiv).attr("href").split("/")[3].toLowerCase();
      if (mutedUserlist.indexOf(author) > -1) {
        //console.log('Removed action from ' + author);
        $(this).remove();
      }
    });
  }

  function attachActivityMuter(){
    var target = $(".column-type-activity .chirp-container")[0];
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        cleanActivityColumn();
      });
    });

    var config = { childList: true }
 
    observer.observe(target, config);
  }
});