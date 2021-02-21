document.addEventListener('DOMContentLoaded', () => {
  let mutedUserlist = null;
  let attachInterval = null;

  function getAppContainer() {
    return document.getElementById('container');
  }

  function getAppColumns(appContainer) {
    if (appContainer === null) return false; // app not ready

    const appColumns = appContainer.getElementsByClassName('js-app-columns app-columns')[0].children;
    return Array.from(appColumns);
  }

  function getActivityColumn(appColumns) {
    const isActivityColumn = (col) => {
      const columnHeading = col.getElementsByClassName('column-heading')[0].innerText;
      return columnHeading === 'Activity';
    };

    if (appColumns === false) return false;

    const filteredActivityColumns = appColumns.filter((col) => isActivityColumn(col));
    return filteredActivityColumns[0]; // there should only be one
  }

  function getColumnEntries(appColumn) {
    if (appColumn === false) return false;
    const entriesContainer = appColumn.getElementsByClassName('js-chirp-container chirp-container')[0];
    const entries = entriesContainer.children;
    return Array.from(entries);
  }

  const isColumnEntryLoaded = (entry) => entry.getAttribute('data-testid') !== 'columnLoadingPlaceholder';

  function areColumnEntriesLoaded(columnEntries) {
    const loadedStatuses = columnEntries.map(isColumnEntryLoaded);
    const allLoadedChecker = (arr) => arr.every((v) => v === true);
    return allLoadedChecker(loadedStatuses);
  }

  function refreshMutedUserlist(newMutedUserlist, cb, cbArg) {
    if (newMutedUserlist !== null) {
      mutedUserlist = newMutedUserlist;
      if (typeof cb === 'function') cb(cbArg);
    } else {
      chrome.storage.sync.get('mutedUserlist', (result) => {
        mutedUserlist = result.mutedUserlist;
        if (typeof cb === 'function') cb(cbArg);
      });
    }
  }

  function filterActivityColumn(activityColumn) {
    if (!Array.isArray(mutedUserlist)) return;
    const activityEntries = getColumnEntries(activityColumn);
    activityEntries.forEach((entry) => {
      if (entry.getAttribute('data-testid') === 'columnLoadingPlaceholder') return;
      const handleUri = entry.getElementsByClassName('account-link')[0].getAttribute('href');
      const handle = handleUri.split('/').pop().toLowerCase();
      if (mutedUserlist.includes(handle)) {
        entry.remove();
      }
    });
  }

  function attachActivityMuter() {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const target = getActivityColumn(appColumns);
    const activityObserver = new MutationObserver(((mutations) => {
      mutations.forEach(() => filterActivityColumn());
    }));
    activityObserver.observe(target, { childList: true });
  }

  attachInterval = window.setInterval(() => {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const activityColumn = getActivityColumn(appColumns);
    const activityEntries = getColumnEntries(activityColumn);
    if (activityEntries !== false && areColumnEntriesLoaded(activityEntries)) {
      refreshMutedUserlist(null, filterActivityColumn, activityColumn);
      attachActivityMuter();
      clearInterval(attachInterval);
    }
  }, 500);

  chrome.storage.onChanged.addListener((changes) => {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const activityColumn = getActivityColumn(appColumns);
    refreshMutedUserlist(changes.mutedUserlist.newValue, filterActivityColumn, activityColumn);
  });
});
