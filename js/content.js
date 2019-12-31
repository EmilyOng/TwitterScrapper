chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  /* Get Data */
  function getData (url) {
    var tweet = document.getElementsByClassName("tweet");
    var date = document.getElementsByClassName("_timestamp"); // get tweet date-time
    var data = [];
    var size = tweet.length;
    var dataStorage = [];
    var sendData = false;
    chrome.storage.local.get([url], function (result) {
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
        var id = tweet[i].getAttribute("data-tweet-id"); // get tweet id
        var text = tweet[i].querySelectorAll(".tweet-text");
        text = Array.from(text);
        var original = text[0].textContent, quoted = "";
        try {
          quoted = text[1].textContent;
        } catch (e) {

        } finally {
        }
        var curr = {"original": original,
                    "quoted": quoted,
                    "date": date[i].textContent,
                    "author": author,
                    "username": username,
                    "id": id};
        if (!dataStorage.includes(JSON.stringify(curr))) {
          dataStorage.push(JSON.stringify(curr));
          data.push(curr);
        }
      }
      chrome.storage.local.set({[url]: JSON.stringify(dataStorage)}, function () {
        console.log("Updating storage");
        sendData = true;
      });
    });
    function awaitData () {
      if (!sendData) {
        console.log("Waiting for data");
        setInterval(awaitData, 100);
      }
      else {
        clearInterval(awaitData);
        sendResponse(data);
      }
    }
    awaitData();
  }

  /* Respond to messages */
  var tweets_url = msg.url + "_TwitterScrapper_Tweets";
  if (msg.text == "observe") {
    var target = document.getElementById("stream-items-id");
    chrome.storage.local.get([tweets_url], function (result) {
      if (result[tweets_url] == undefined) {
        getData(tweets_url);
      }
      else {
        console.log("Waiting for changes");
        const config = {childList: true};
        const callback = function (mutationList, observer) {
          if (mutationList.length > 0) {
            // Changes in the number of tweets
            console.log("Mutation detected");
            getData(tweets_url);
          }
        }
        const observer = new MutationObserver(callback);
        observer.observe(target, config);
      }
    });
  }
  return true;
});
