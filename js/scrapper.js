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

function preFill () {
  chrome.storage.sync.get(["TwitterScrapper"], function (result) {
    if (result.TwitterScrapper) {
      var data = JSON.parse(result.TwitterScrapper);
      fillTable(data, true);
    }
    else {
      return false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  preFill();
  var getData = document.querySelector("#getData");
  getData.addEventListener("click", () => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      var currentTab = tabs[0];
      var preFillable = preFill();
      if (!preFillable) {
        chrome.tabs.sendMessage(currentTab.id, {text: "report_back"}, getDOMInfo);
      }
    });
  })
});
