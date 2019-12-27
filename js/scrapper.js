function getDOMInfo (DOMContent) {
  var dataArea = document.getElementById("dataArea");
  dataArea.style.visibility = "visible";
  for (var i=0; i<DOMContent.length; i++){
    var text = DOMContent[i]["text"];
    var date = DOMContent[i]["date"];
    var author = DOMContent[i]["author"];
    var username = DOMContent[i]["username"];
    var id = DOMContent[i]["id"];
    var row = dataArea.insertRow(i+1);
    row.insertCell(0).innerHTML = text;
    row.insertCell(1).innerHTML = date;
    row.insertCell(2).innerHTML = author;
    row.insertCell(3).innerHTML = username;
    row.insertCell(4).innerHTML = id;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  var getData = document.querySelector("#getData");
  getData.addEventListener("click", () => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      var currentTab = tabs[0];
      chrome.tabs.sendMessage(currentTab.id, {text: "report_back"}, getDOMInfo);
    });
  })
});
