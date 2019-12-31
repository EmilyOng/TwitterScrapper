chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  function setProfile (elem) {
    var author = elem.getAttribute("data-name"); // get tweet author
    var username = elem.getAttribute("data-screen-name"); // get tweet handle
    var id = elem.getAttribute("data-tweet-id"); // get tweet id
    var text = elem.querySelectorAll(".tweet-text");
    text = Array.from(text);
    var original = "", quoted = "";
    if (elem.getAttribute("data-retweet-id") == undefined) {
      original = text[0].textContent;
    }
    else {
      try {
        original = text[0].textContent;
        quoted = text[1].textContent
      } catch (e) {

      } finally {
        original = "";
        quoted = text[0].textContent;
      }
    }

    var curr = {"original": original,
                "quoted": quoted,
                "date": 0,
                "author": author,
                "username": username,
                "id": id};
    return curr;
  }
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
        var curr = setProfile(tweet[i]);
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
            var dataStorage = JSON.parse(result[tweets_url]);
            var data = [];
            for (var i=0; i<mutationList.length; i++) {
              if (mutationList[i].type == "childList") {
                var addedNodes = mutationList[i].addedNodes;
                for (var j=0; j<addedNodes.length; j++) {
                  var tweet = addedNodes[j].children[0];
                  var curr = setProfile(tweet);
                  dataStorage.push(JSON.stringify(curr));
                  data.push(curr);
                }
              }
            }
            sendData = false;
            chrome.storage.local.set({[tweets_url]: JSON.stringify(dataStorage)}, function () {
              console.log("Updating storage");
              sendData = true;
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
        }
        const observer = new MutationObserver(callback);
        observer.observe(target, config);
      }
    });
  }
  return true;
});
