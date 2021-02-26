document.addEventListener('DOMContentLoaded', () => {
  let mutedUserlist = null;

  const getMutedUserList = (cb) => chrome.storage.sync.get('mutedUserlist', cb);

  const getAppContainer = () => document.getElementById('container');

  const getEntriesContainer = (appColumn) => appColumn.getElementsByClassName('js-chirp-container chirp-container')[0];

  const getAppColumns = (appContainer) => {
    if (appContainer === null) return false; // app not ready

    const appColumns = appContainer.getElementsByClassName('js-app-columns app-columns')[0].children;
    return Array.from(appColumns);
  };

  const getActivityColumn = (appColumns) => {
    const getColumnHeading = (appColumn) => appColumn.getElementsByClassName('column-heading')[0].innerText;
    const isActivityColumn = (appColumn) => getColumnHeading(appColumn) === 'Activity';

    if (appColumns === false) return false;

    const filteredActivityColumns = appColumns.filter(isActivityColumn);
    return filteredActivityColumns[0]; // there should only be one
  };

  const getColumnContent = (appColumn) => appColumn.getElementsByClassName('js-column-content')[0];

  const getColumnEntries = (appColumn) => {
    if (appColumn === false) return false;

    const entries = getEntriesContainer(appColumn).children;
    return Array.from(entries);
  };

  const areColumnEntriesLoaded = (columnEntries) => {
    const isColumnEntryLoaded = (entry) => entry.getAttribute('data-testid') !== 'columnLoadingPlaceholder';
    const loadedStatuses = columnEntries.map(isColumnEntryLoaded);
    const allLoadedChecker = (arr) => arr.every((v) => v === true);
    return allLoadedChecker(loadedStatuses);
  };

  const refreshMutedUserlist = (newMutedUserlist, cb, cbArg) => {
    mutedUserlist = newMutedUserlist;
    if (typeof cb === 'function') cb(cbArg);
  };

  const filterActivityColumn = (activityColumn) => {
    const getHandleUri = (activityEntry) => activityEntry.getElementsByClassName('account-link')[0].getAttribute('href');
    const getHandleFromHandleUri = (handleUri) => handleUri.split('/').pop().toLowerCase();
    if (!Array.isArray(mutedUserlist)) return;
    const activityEntries = getColumnEntries(activityColumn);
    activityEntries.forEach((entry) => {
      if (entry.nodeName !== 'ARTICLE' || entry.getAttribute('data-testid') === 'columnLoadingPlaceholder') return;
      const handleUri = getHandleUri(entry);
      const handle = getHandleFromHandleUri(handleUri);
      if (mutedUserlist.includes(handle)) entry.remove();
    });
  };

  const attachActivityMuter = () => {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const activityColumn = getActivityColumn(appColumns);
    const target = getColumnContent(activityColumn);
    const activityObserver = new MutationObserver(((mutations) => {
      const observerAppContainer = getAppContainer();
      const observerAppColumns = getAppColumns(observerAppContainer);
      const observerActivityColumn = getActivityColumn(observerAppColumns);
      mutations.forEach(() => filterActivityColumn(observerActivityColumn));
    }));
    activityObserver.observe(target, { childList: true, subtree: true });
  };

  const attachInterval = window.setInterval(() => {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const activityColumn = getActivityColumn(appColumns);
    const activityEntries = getColumnEntries(activityColumn);
    if (activityEntries !== false && areColumnEntriesLoaded(activityEntries)) {
      getMutedUserList((result) => {
        refreshMutedUserlist(result.mutedUserlist, filterActivityColumn, activityColumn);
        attachActivityMuter();
        clearInterval(attachInterval);
      });
    }
  }, 500);

  chrome.storage.onChanged.addListener((changes) => {
    const appContainer = getAppContainer();
    const appColumns = getAppColumns(appContainer);
    const activityColumn = getActivityColumn(appColumns);
    refreshMutedUserlist(changes.mutedUserlist.newValue, filterActivityColumn, activityColumn);
  });
});
