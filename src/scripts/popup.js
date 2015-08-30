$(function() {

  var userRegexp = /^[\w]{1,15}$/, 
      deleteLink = '(<a href="#" class="delete">delete</a>)';

  $('body').fadeIn('slow');

  function populateUserlist(){
    chrome.storage.sync.get('mutedUserlist', function(result) {
      var mutedUserlist = result.mutedUserlist;
      if (typeof mutedUserlist === 'undefined') return;
      $('#muted-userlist').empty();
      mutedUserlist.forEach(function(username) {
        $('#muted-userlist').append(
          $('<li id="' + username + '">').html(username + ' ' + deleteLink)
        );
      });
    });
  }

  populateUserlist();

  $('#username-input').focus();

  $(document).on('click', 'a', function(){
    var username = this.parentElement.id;
    chrome.storage.sync.get('mutedUserlist', function(result) {
      var mutedUserlist = result.mutedUserlist;
      var userIndex = mutedUserlist.indexOf(username);
      mutedUserlist.splice(userIndex, 1);
      chrome.storage.sync.set({mutedUserlist: mutedUserlist});
      populateUserlist();
      $('#warning-text').text('Past activities from ' + username + ' won\'t be seen until you refresh!');
    });
  });

  $('#add-form').on('submit', function(e){
    e.preventDefault();
    var username = $(this).serializeArray()[0].value.toLowerCase();
    chrome.storage.sync.get('mutedUserlist', function(result) {
      var mutedUserlist = result.mutedUserlist;
      if (typeof mutedUserlist === 'undefined') mutedUserlist = [];
      if ((mutedUserlist.indexOf(username) > -1) || (userRegexp.test(username) === false)) return;
      mutedUserlist.push(username);
      chrome.storage.sync.set({mutedUserlist: mutedUserlist});
      $('#username-input').val('');
      populateUserlist();
    });
  });
});