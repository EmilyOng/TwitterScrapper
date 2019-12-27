chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  if (msg.text == "report_back"){
    var text = document.getElementsByClassName("js-tweet-text"); // get tweet content
    var tweet = document.getElementsByClassName("tweet");
    var date = document.getElementsByClassName("_timestamp"); // get tweet date-time
    var data = [];
    var size = text.length;
    for (var i=0; i<size; i++){
      var author = tweet[i].getAttribute("data-name"); // get tweet author
      var username = tweet[i].getAttribute("data-screen-name"); // get tweet handle
      var id = tweet[i].getAttribute("data-user-id"); // get tweet id
      data.push({"text": text[i].textContent,
                  "date": date[i].textContent,
                  "author": author,
                  "username": username,
                  "id": id});
    }
    sendResponse(data);
  }
});
