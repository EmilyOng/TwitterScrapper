chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  if (msg.text == "report_back"){
    var url = msg.url;
    var text = document.getElementsByClassName("js-tweet-text"); // get tweet content
    var tweet = document.getElementsByClassName("tweet");
    var date = document.getElementsByClassName("_timestamp"); // get tweet date-time
    var data = [];
    var size = text.length;
    var dataStorage = [];
    var sendData = false;
    chrome.storage.sync.get([url], function (result) {
      if (result[url] == undefined) {
        dataStorage = [];
      }
      else {
        dataStorage = JSON.parse(result[url]);
      }
      console.log("Traversing tweets");
      for (var i=0; i<size; i++){
        var author = tweet[i].getAttribute("data-name"); // get tweet author
        var username = tweet[i].getAttribute("data-screen-name"); // get tweet handle
        var id = tweet[i].getAttribute("data-user-id"); // get tweet id
        var curr = {"text": text[i].textContent,
                    "date": date[i].textContent,
                    "author": author,
                    "username": username,
                    "id": id};
        if (!dataStorage.includes(JSON.stringify(curr))) {
          dataStorage.push(JSON.stringify(curr));
          data.push(curr);
        }
      }
      chrome.storage.sync.set({[url]: JSON.stringify(dataStorage)}, function () {
        console.log("Updating storage");
        sendData = true;
      });
    });
    function awaitData () {
      if (!sendData) {
        console.log("Waiting for data");
        window.setTimeout(awaitData, 100);
      }
      else {
        sendResponse(data);
      }
    }
    awaitData();
  }
  return true;
});
