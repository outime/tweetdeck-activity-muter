document.addEventListener('DOMContentLoaded', () => {
  const userRegex = /^[\w]{1,15}$/;

  const getUserlistEl = () => document.getElementById('muted-userlist');

  const getPopulatedUserEl = (username) => `<li>${username} (<a href="#" id="${username}" class="delete">unmute</a>)</li>`;

  const sanitizeHtml = (string) => string.replace(/[^\w. ]/gi, (c) => '&#' + c.charCodeAt(0) + ';');

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

  const getUsernameInputEl = () => document.getElementById('username-input');

  const showRefreshWarning = (deletedUsername) => {
    getWarningTextEl().innerHTML = `Past activity from <em>${deletedUsername}</em> and other unmuted users won't be seen <strong>until you refresh</strong>!`;
  };

  const showInvalidUsernameWarning = (username) => {
    getWarningTextEl().innerHTML = `Username <em>${sanitizeHtml(username)}</em> is invalid or already exists.`;
  };

  const cleanUsernameInput = () => {
    getUsernameInputEl().value = '';
  };

  const cleanWarning = () => {
    getWarningTextEl().innerHTML = '';
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
        showRefreshWarning(username);
      });
    }
  });

  getUsernameInputEl().addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const username = e.target.value.toLowerCase();
    getMutedUserList((result) => {
      let { mutedUserlist } = result;
      if (typeof mutedUserlist === 'undefined') mutedUserlist = [];
      if ((mutedUserlist.indexOf(username) > -1) || (userRegex.test(username) === false)) {
        showInvalidUsernameWarning(username);
        return;
      }
      mutedUserlist.push(username);
      updateMutedUserList({ mutedUserlist });
      cleanUsernameInput();
      cleanWarning();
      cleanAndPopulateUserlist(getUserlistEl());
    });
  });

  document.body.style.display = 'block';
  cleanAndPopulateUserlist(getUserlistEl());
  getUsernameInputEl().focus();
});
