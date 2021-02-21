chrome.tabs.onUpdated.addListener((id, info, tab) => {
  if (tab.url.indexOf('https://tweetdeck.twitter.com') !== -1) {
    chrome.pageAction.show(tab.id);
    chrome.tabs.executeScript(null, { file: 'scripts/script.js' });
  }
});
