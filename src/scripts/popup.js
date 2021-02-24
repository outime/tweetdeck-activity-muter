document.addEventListener('DOMContentLoaded', () => {
  const userRegex = /^[\w]{1,15}$/;

  const getUserlistEl = () => document.getElementById('muted-userlist');

  const getPopulatedUserEl = (username) => `<li>${username} (<a href="#" id="${username}" class="delete">unmute</a>)</li>`;

  const getMutedUserList = (cb) => chrome.storage.sync.get('mutedUserlist', cb);

  const updateMutedUserList = (userList) => chrome.storage.sync.set(userList);

  const getCleanedUserlistEl = (userlistEl) => {
    const cleanedUserlistEl = userlistEl.cloneNode(true);
    const elLastChild = cleanedUserlistEl.lastChild;
    if (cleanedUserlistEl.lastChild) {
      cleanedUserlistEl.removeChild(elLastChild);
      return getCleanedUserlistEl(cleanedUserlistEl);
    }
    return cleanedUserlistEl;
  };

  const getPopulatedUserlistEl = (userlistEl, cb) => getMutedUserList((result) => {
    const { mutedUserlist } = result;
    if (typeof mutedUserlist === 'undefined') return cb(userlistEl);
    const populatedUserlist = userlistEl.cloneNode(true);
    mutedUserlist.forEach((username) => {
      populatedUserlist.innerHTML += getPopulatedUserEl(username);
    });
    return cb(populatedUserlist);
  });

  const cleanAndPopulateUserlist = (userlistEl) => {
    const cleanedUserlistEl = getCleanedUserlistEl(userlistEl);
    userlistEl.replaceWith(cleanedUserlistEl);
    getPopulatedUserlistEl(cleanedUserlistEl, (populatedUserlistEl) => {
      cleanedUserlistEl.replaceWith(populatedUserlistEl);
    });
  };

  const getWarningTextEl = () => document.getElementById('warning-text');

  const enableRefreshWarning = (deletedUsername) => {
    getWarningTextEl().innerHTML = `Past activity from <em>${deletedUsername}</em> and other unmuted users won't be seen <strong>until you refresh</strong>!`;
  };

  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.nodeName === 'A') {
      const username = e.target.id;
      getMutedUserList((result) => {
        const { mutedUserlist } = result;
        const userIndex = mutedUserlist.indexOf(username);
        mutedUserlist.splice(userIndex, 1);
        updateMutedUserList({ mutedUserlist });
        cleanAndPopulateUserlist(getUserlistEl());
        enableRefreshWarning(username);
      });
    }
  });

  document.querySelector('#username-input').addEventListener('keypress', (e) => {
    const code = e.keyCode || e.which;
    if (code === 13) {
      e.preventDefault();
      const username = document.getElementById('username-input').value.toLowerCase();
      getMutedUserList((result) => {
        let { mutedUserlist } = result;
        if (typeof mutedUserlist === 'undefined') mutedUserlist = [];
        if ((mutedUserlist.indexOf(username) > -1) || (userRegex.test(username) === false)) return;
        mutedUserlist.push(username);
        updateMutedUserList({ mutedUserlist });
        document.getElementById('username-input').value = '';
        cleanAndPopulateUserlist(getUserlistEl());
      });
    }
  });

  document.body.style.display = 'block';
  cleanAndPopulateUserlist(getUserlistEl());
  document.getElementById('username-input').focus();
});
