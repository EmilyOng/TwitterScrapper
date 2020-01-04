/* FUNCTION: Fill table */
function fillTable (DOMContent, parseJSON = false){
  var dataArea = document.getElementById("dataArea");
  dataArea.style.visibility = "visible";
  var data = DOMContent;
  var numberOfRows = dataArea.rows.length;
  for (var i=0; i<DOMContent.length; i++){
    var elem = data[i];
    if (parseJSON) {
      elem = JSON.parse(elem);
    }
    var profile = {"tweetText": elem["tweetText"],
                "retweetedText": elem["retweetedText"],
                "tweetDate": elem["tweetDate"],
                "tweetAuthor": elem["tweetAuthor"],
                "tweetHandle": elem["tweetHandle"],
                "tweetId": elem["tweetId"]};
    var fields = ["tweetText", "retweetedText", "tweetDate",
                  "tweetAuthor", "tweetHandle", "tweetId"];

    var row = dataArea.insertRow(numberOfRows);
    numberOfRows += 1;
    for (var j=0; j<fields.length; j++){
      row.insertCell(j).innerHTML = profile[fields[j]];
    }
  }
}


/* FUNCTION: Receive data from message and call function to update table */
function getDOMInfo (DOMContent) {
  if (DOMContent) {
    fillTable(DOMContent);
    // Refresh the table to update changes
    location.reload();
  }
}


/* FUNCTION: Prefill table */
function preFill (storageKey) {
  storageKey += "_TwitterScrapper_Tweets";
  chrome.storage.local.get([storageKey], function (result) {
    if (result[storageKey] != undefined) {
      var data = JSON.parse(result[storageKey]);
      fillTable(data, true);
    }
  });
}


/* Wait for DOM to finish loading */
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    var currentTab = tabs[0];
    document.getElementById("pageDescription").textContent = "Twitter Data from: " + currentTab.url;
    preFill(currentTab.url);
    chrome.tabs.sendMessage(currentTab.id, {text: "observe", storageKey: currentTab.url}, getDOMInfo);  
  });
});
