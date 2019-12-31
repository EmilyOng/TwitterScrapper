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
    var curr = {"original": elem["original"],
                "quoted": elem["quoted"],
                "date": elem["date"],
                "author": elem["author"],
                "username": elem["username"],
                "id": elem["id"]};
    var fields = ["original", "quoted", "date", "author", "username", "id"];
    var row = dataArea.insertRow(numberOfRows);
    numberOfRows += 1;
    for (var j=0; j<fields.length; j++){
      row.insertCell(j).innerHTML = curr[fields[j]];
    }
  }
}


function getDOMInfo (DOMContent) {
  if (DOMContent) {
    fillTable(DOMContent);
    location.reload();
  }
}


function preFill (url) {
  url += "_TwitterScrapper_Tweets";
  chrome.storage.local.get([url], function (result) {
    if (result[url] != undefined) {
      var data = JSON.parse(result[url]);
      fillTable(data, true);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function (tabs) {
    var currentTab = tabs[0];
    var observing = false;
    document.getElementById("pageDescription").textContent += currentTab.url;
    preFill(currentTab.url);
    chrome.tabs.sendMessage(currentTab.id, {text: "observe", url: currentTab.url}, getDOMInfo);
  });
});
