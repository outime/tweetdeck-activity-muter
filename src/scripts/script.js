$(function() {
  var mutedUserlist, attachInterval;

  attachInterval = window.setInterval(function(){
    if ($('.column-type-activity .chirp-container article').length) {
      refreshMutedUserlist();
      cleanActivityColumn();
      attachActivityMuter();
      clearInterval(attachInterval);
    }
  }, 500);

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    refreshMutedUserlist(changes.mutedUserlist.newValue);
    cleanActivityColumn();
  });

  function refreshMutedUserlist(newMutedUserlist){
    if (typeof newMutedUserlist !== 'undefined') {
      mutedUserlist = newMutedUserlist;
    } else {
      chrome.storage.sync.get('mutedUserlist', function(result) {
        mutedUserlist = result.mutedUserlist;
      });
    }
  }

  function cleanActivityColumn(){
    if (typeof mutedUserlist === 'undefined') return;
    $('.column-type-activity .chirp-container article').each(function(article) {
      var authorDiv = $(this).find('.account-link')[0];
      var author = $(authorDiv).attr('href').split('/')[3].toLowerCase();
      if (mutedUserlist.indexOf(author) > -1) {
        //console.log('Removed action from ' + author);
        $(this).remove();
      }
    });
  }

  function attachActivityMuter(){
    var target = $('.column-type-activity .chirp-container')[0];
    var activityObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        cleanActivityColumn();
      });
    });
    activityObserver.observe(target, {childList: true});
  }
});
