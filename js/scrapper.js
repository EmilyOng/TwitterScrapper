function fillTable (DOMContent, parseJSON = false){
  var dataArea = document.getElementById("dataArea");
  dataArea.style.visibility = "visible";
  var data = DOMContent;
  for (var i=0; i<DOMContent.length; i++){
    var elem = data[i];
    if (parseJSON) {
      elem = JSON.parse(elem);
    }
    var curr = {"text": elem["text"],
                "date": elem["date"],
                "author": elem["author"],
                "username": elem["username"],
                "id": elem["id"]};
    var fields = ["text", "date", "author", "username", "id"];
    var row = dataArea.insertRow(i+1);
    for (var j=0; j<fields.length; j++){
      row.insertCell(j).innerHTML = curr[fields[j]];
    }
  }
}

function getDOMInfo (DOMContent) {
  fillTable(DOMContent);
}

function preFill (url) {
  url += "_TwitterScrapper_Tweets";
  chrome.storage.sync.get([url], function (result) {
    if (result[url]) {
      var data = JSON.parse(result[url]);
      fillTable(data, true);
    }
  });
}

function mutationHandler () {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    var currentTab = tabs[0];
    chrome.tabs.sendMessage(currentTab.id, {text: "observe", url: currentTab.url});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  mutationHandler();
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    var currentTab = tabs[0];
    document.getElementById("pageDescription").textContent += currentTab.url;
    preFill(currentTab.url);
  });
});
