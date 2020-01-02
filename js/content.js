chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  /* FUNCTION: Await for processes to finish before continuing */
  function awaitData (sendData, tweetsData) {
    if (!sendData) {
      console.log("Waiting for data");
      setInterval(awaitData, sendData, tweetsData, 100);
    }
    else {
      clearInterval(awaitData);
      sendResponse(tweetsData);
    }
  }


  /* FUNCTION: Remove element from array based on value */
  function removeElement(arr, value) {
    // https://love2dev.com/blog/javascript-remove-from-array/
     return arr.filter(function(ele){
         return ele != value;
     });
  }


  /* Set Profile by obtaining tweetAuthor, tweetHandle, tweetId and tweet fields */
  function setProfile (elem) {
    var tweetAuthor = elem.getAttribute("data-name"); // Get tweetAuthor
    var tweetHandle = elem.getAttribute("data-screen-name"); // Get tweetHandle
    var tweetId = elem.getAttribute("data-tweet-id"); // Get tweetId
    var tweetDate = elem.children[1].children[0].children[1].children[0].getAttribute("title"); // Get tweetDate
    var text = elem.querySelectorAll(".tweet-text");
    text = Array.from(text);
    var tweetText = "", retweetedText = "";
    if (elem.getAttribute("data-retweet-id") == undefined) {
      // Tweet is original
      tweetText = text[0].textContent;
    }
    else {
      // Tweet is part of a retweet
      try {
        // User has retweeted with a text
        tweetText = text[0].textContent;
        retweetedText = text[1].textContent
      } catch (e) {

      } finally {
        // User has retweeted without any original text
        tweetText = "";
        retweetedText = text[0].textContent;
      }
    }
    // Profile
    var profile = {"tweetText": tweetText,
                "retweetedText": retweetedText,
                "tweetDate": tweetDate,
                "tweetAuthor": tweetAuthor,
                "tweetHandle": tweetHandle,
                "tweetId": tweetId};
    return profile;
  }


  /* FUNCTION: Get Data */
  function getData (storageKey) {
    var tweets = document.getElementsByClassName("tweet");
    var tweetsData = [];
    var tweetsSize = tweets.length; // Count the number of tweets
    var dataStorage = [];
    var sendData = false;
    chrome.storage.local.get([storageKey], function (result) {
      if (result[storageKey] == undefined) {
        dataStorage = [];
      }
      else {
        dataStorage = JSON.parse(result[storageKey]);
      }
      console.log("Traversing tweets");
      for (var i=0; i<tweetsSize; i++){
        var profile = setProfile(tweets[i]);
        if (!dataStorage.includes(JSON.stringify(profile))) {
          // Tweet is not yet processed
          dataStorage.push(JSON.stringify(profile));
          tweetsData.push(profile);
        }
      }
      chrome.storage.local.set({[storageKey]: JSON.stringify(dataStorage)}, function () {
        console.log("Updating storage");
        sendData = true;
      });
    });
    awaitData(sendData, tweetsData);
  }


  /* FUNCTION: Observer process & mutation handling */
  function observerProcess () {
    var storageKey = msg.storageKey + "_TwitterScrapper_Tweets";
    var targetNode = document.getElementById("stream-items-id");
    chrome.storage.local.get([storageKey], function (result) {
      if (result[storageKey] == undefined) {
        getData(storageKey);
      }
      else {
        console.log("Waiting for changes");
        // Observe if nodes are added to the list
        const mutationConfig = {childList: true};
        const mutationCallback = function (mutationList, observer) {
          if (mutationList.length > 0) {
            // Changes in the number of tweets
            console.log("Mutation detected");
            var dataStorage = JSON.parse(result[storageKey]);
            var tweetsData = [];
            for (var i=0; i<mutationList.length; i++) {
              if (mutationList[i].type == "childList") {
                // Check through the new tweets that are added
                var addedNodes = mutationList[i].addedNodes;
                for (var j=0; j<addedNodes.length; j++) {
                  var tweet = addedNodes[j].children[0];
                  var profile = setProfile(tweet);
                  dataStorage.push(JSON.stringify(profile));
                  tweetsData.push(profile);
                }
                // Check through the tweets that are removed
                var removedNodes = mutationList[i].removedNodes;
                for (var j=0; j<removedNodes.length; j++) {
                  var tweet = removedNodes[j].children[0];
                  var profile = setProfile(tweet);
                  dataStorage = removeElement(dataStorage, JSON.stringify(profile));
                  tweetsData = removeElement(tweet_data, profile);
                }
              }
            }
            var sendData = false;
            chrome.storage.local.set({[storageKey]: JSON.stringify(dataStorage)}, function () {
              console.log("Updating storage");
              sendData = true;
            });
            awaitData(sendData, tweetsData);
          }
        }
        const observer = new MutationObserver(mutationCallback);
        observer.observe(targetNode, mutationConfig);
      }
    });
  }


  /* Respond to messages */
  if (msg.text == "observe") {
    if (document.readyState !== "loading") {
      observerProcess();
    }
    else {
      document.addEventListener("DOMContentLoaded", () => {
        observerProcess();
      });
    }
  }
  return true;
});
