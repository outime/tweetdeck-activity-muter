document.addEventListener('DOMContentLoaded', () => {
  const deletedUsernames = [];
  const userRegexp = /^[\w]{1,15}$/;

  document.body.style.display = 'block';

  function populateUserlist() {
    const getUserlistEl = () => document.getElementById('muted-userlist');
    chrome.storage.sync.get('mutedUserlist', (result) => {
      const { mutedUserlist } = result;
      if (typeof mutedUserlist === 'undefined') return;
      while (getUserlistEl().lastChild) getUserlistEl().removeChild(getUserlistEl().lastChild);
      mutedUserlist.forEach((username) => {
        getUserlistEl().innerHTML += `<li>${username} (<a href="#" id="${username}" class="delete">delete</a>)</li>`;
      });
    });
  }

  populateUserlist();

  document.getElementById('username-input').focus();

  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.nodeName === 'A') {
      const username = e.target.id;
      chrome.storage.sync.get('mutedUserlist', (result) => {
        const { mutedUserlist } = result;
        const userIndex = mutedUserlist.indexOf(username);
        mutedUserlist.splice(userIndex, 1);
        chrome.storage.sync.set({ mutedUserlist });
        populateUserlist();
        deletedUsernames.push(username);
        document.getElementById('warning-text').innerHTML = `Past activities from ${deletedUsernames.join(', ')} won't be seen <strong>until you refresh</strong>!`;
      });
    }
  });

  document.querySelector('#username-input').addEventListener('keypress', (e) => {
    const code = e.keyCode || e.which;
    if (code === 13) {
      e.preventDefault();
      const username = document.getElementById('username-input').value.toLowerCase();
      chrome.storage.sync.get('mutedUserlist', (result) => {
        let { mutedUserlist } = result;
        if (typeof mutedUserlist === 'undefined') mutedUserlist = [];
        if ((mutedUserlist.indexOf(username) > -1) || (userRegexp.test(username) === false)) return;
        mutedUserlist.push(username);
        chrome.storage.sync.set({ mutedUserlist });
        document.getElementById('username-input').value = '';
        populateUserlist();
      });
    }
  });
});
