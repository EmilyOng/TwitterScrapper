chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse){
  /* FUNCTION: Await for processes to finish before continuing */


  /* FUNCTION: Remove element from array based on value */
  function removeElement(arr, value) {
    // https://love2dev.com/blog/javascript-remove-from-array/
     return arr.filter(function(ele){
         return ele != value;
     });
  }


  /* FUNCTION: Observer process & mutation handling */
  function viewHandler2 () {
    var storageKey = msg.storageKey + "_TwitterScrapper_Tweets";

    /* Set Profile by obtaining tweetAuthor, tweetHandle, tweetId and tweet fields */
    function setProfile (elem) {
      var tweetAuthor = elem.getAttribute("data-name"); // Get tweetAuthor
      var tweetHandle = elem.getAttribute("data-screen-name"); // Get tweetHandle
      var tweetId = elem.getAttribute("data-tweet-id"); // Get tweetId
      var tweetDate = elem.children[1].children[0].children[1].children[0].getAttribute("title"); // Get tweetDate
      var text = elem.querySelectorAll(".tweet-text");
      var retweetedAuthor = "", retweetedHandle = "";
      text = Array.from(text);
      var tweetText = "", retweetedText = "";
      if (elem.getAttribute("data-retweet-id") == undefined) {
        // Tweet is original
        tweetText = text[0].textContent;
      }
      else {
        retweetedAuthor = tweetAuthor;
        retweetedHandle = tweetHandle;
        tweetHandle = elem.getElementsByClassName("js-retweet-text")[0].children[0].getAttribute("href");
        tweetHandle = "@" + tweetHandle.slice(1);
        tweetAuthor = elem.getElementsByClassName("js-retweet-text")[0].children[0].children[0].textContent;
        // Tweet is part of a retweet
        try {
          // User has retweeted with a text
          tweetText = text[0].textContent;
          retweetedText = text[1].textContent
        } catch (e) {
          if (e) {
            // User has retweeted without any original text
            tweetText = "";
            retweetedText = text[0].textContent;
          }
        }
      }
      // Profile
      var profile = {"tweetText": tweetText,
                  "retweetedText": retweetedText,
                  "tweetDate": tweetDate,
                  "tweetAuthor": tweetAuthor + " " + retweetedAuthor,
                  "tweetHandle": tweetHandle + " " + retweetedHandle,
                  "tweetId": tweetId};
      return profile;
    }
    var targetNode = document.getElementById("stream-items-id");
    var tweetsData = [];
    var dataStorage = [];
    var sendData = false;
    chrome.storage.local.get([storageKey], function (result) {
      if (result[storageKey] == undefined) {
        var tweets = document.getElementsByClassName("tweet");
        var tweetsSize = tweets.length; // Count the number of tweets
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
                  tweetsData = removeElement(tweetsData, profile);
                }
              }
            }
            chrome.storage.local.set({[storageKey]: JSON.stringify(dataStorage)}, function () {
              console.log("Updating storage");
              sendData = true;
            });
          }
        }
        const observer = new MutationObserver(mutationCallback);
        observer.observe(targetNode, mutationConfig);
      }
    });
    var awaitData = setInterval(function() {
      if (sendData) {
        sendResponse(tweetsData);
        clearInterval(awaitData);
      }
    }, 100);
  }


  function viewHandler1 () {
    var storageKey = msg.storageKey + "_TwitterScrapper_Tweets";

    /* Set Profile by obtaining tweetAuthor, tweetHandle, tweetId and tweet fields */
    function setProfile (elem) {
      try {
        var tweet = elem.querySelectorAll('[data-testid="tweet"]')[0].children[1];
      } catch (e) {
        return;
      }
      var tweetId = elem.querySelectorAll('[data-testid="tweet"]')[0].querySelectorAll("a")[2].getAttribute("href");
      // Format: /{handle}/status/{id}
      tweetId = tweetId.split("/")[3];
      var checkRetweetWithoutText = tweet.parentElement.parentElement.children[0].querySelectorAll("a")[0];

      var subTweet, retweetedAuthor = "", retweetedHandle = "", retweetedDate = "", retweetedText = "";
      var tweetAuthor = "", tweetHandle = "", tweetDate = "", tweetText = "";
      var tempAuthor = "", tempHandle = "", tempDate = "", tempText = "";

      var tempAuthor = tweet.children[0].children[0].children[0].querySelectorAll("span")[0].textContent;
      var tempHandle = tweet.children[0].children[0].querySelectorAll("a")[0].getAttribute("href");
      tempHandle = "@" + tempHandle.slice(1);
      var tempDate = tweet.children[0].children[0].children[2].getAttribute("title");
      var tempText = tweet.children[1].textContent;

      if (checkRetweetWithoutText) {
        tweetHandle =checkRetweetWithoutText.getAttribute("href");
        tweetHandle = "@" + tweetHandle.slice(1);
        tweetAuthor = tweet.parentElement.parentElement.children[0].querySelectorAll("span")[1].textContent;
        retweetedHandle = tempHandle;
        retweetedAuthor = tempAuthor;
        retweetedDate = tempDate;
        retweetedText = tempText;
      }
      else {
        tweetAuthor = tempAuthor;
        tweetHandle = tempHandle;
        tweetDate = tempDate;
        tweetText = tempText;
      }

      try {
        subTweet = elem.querySelectorAll('[data-testid="tweet"]')[0].children[1].querySelectorAll('[role="blockquote"]')
        retweetedAuthor = subTweet[0].children[0].children[0].children[0].querySelectorAll("span")[0].textContent;
        retweetedHandle = subTweet[0].querySelectorAll("span")[2].textContent;
        retweetedDate = subTweet[0].children[0].children[0].children[1].textContent;
        retweetedText = subTweet[0].children[0].children[1].textContent;
      } catch (e) {

      }
      // Profile
      var profile = {"tweetText": tweetText,
                    "retweetedText": retweetedText,
                    "tweetDate": tweetDate + " " + retweetedDate,
                    "tweetAuthor": tweetAuthor + " " + retweetedAuthor,
                    "tweetHandle": tweetHandle + " " + retweetedHandle,
                    "tweetId": tweetId};
      return profile;
    }

    var dataStorage = [];
    var tweetsData = [];
    var sendData = false;
    var tweets = document.querySelectorAll('section, [role="region"]')[0].children[1].children[0].children[0];
    var tweetsSize = tweets.childElementCount;
    chrome.storage.local.get([storageKey], function (result) {
      if (result[storageKey] == undefined) {
        console.log("Traversing tweets");
        for (var i=0; i<tweetsSize; i++){
          var profile = setProfile(tweets.children[i]);
          if (profile && !dataStorage.includes(JSON.stringify(profile))) {
            // Tweet is not yet processed
            dataStorage.push(JSON.stringify(profile));
            tweetsData.push(profile);
          }
        }
        chrome.storage.local.set({[storageKey]: JSON.stringify(dataStorage)}, function () {
          console.log("Updating storage");
          sendData = true;
        });
        var awaitData = setInterval(function() {
          if (sendData) {
            sendResponse(tweetsData);
            clearInterval(awaitData);
          }
        }, 100);
      }

      else {
        var targetNode = document.querySelectorAll("section, [role='region']")[0].children[1].children[0].children[0];
        console.log("Waiting for changes");
        // Observe if nodes are added to the list
        const mutationConfig = {childList: true};
        const mutationCallback = function (mutationList, observer) {
          if (mutationList.length > 0) {
            // Changes in the number of tweets
            var dataStorage = JSON.parse(result[storageKey]);
            var tweetsData = [];
            for (var i=0; i<mutationList.length; i++) {
              if (mutationList[i].type == "childList") {
                // Check through the new tweets that are added
                var addedNodes = mutationList[i].addedNodes;
                for (var j=0; j<addedNodes.length; j++) {
                  if (addedNodes[j]) {
                    var tweet = addedNodes[j].children[0];
                    var profile = setProfile(tweet);
                    if (profile && !dataStorage.includes(JSON.stringify(profile))) {
                      console.log("Mutation detected");
                      dataStorage.push(JSON.stringify(profile));
                      tweetsData.push(profile);
                    }
                  }

                }
                // Check through the tweets that are removed
                var removedNodes = mutationList[i].removedNodes;
                for (var j=0; j<removedNodes.length; j++) {
                  var tweet = removedNodes[j].children[0];
                  var profile = setProfile(tweet);
                  if (profile && !dataStorage.includes(JSON.stringify(profile))) {
                    dataStorage = removeElement(dataStorage, JSON.stringify(profile));
                    tweetsData = removeElement(tweetsData, profile);
                  }
                }
              }
            }
            var sendData = false;
            chrome.storage.local.set({[storageKey]: JSON.stringify(dataStorage)}, function () {
              console.log("Updating storage");
              sendData = true;
            });
            var awaitData = setInterval(function() {
              if (sendData) {
                sendResponse(tweetsData);
                clearInterval(awaitData);
              }
            }, 100);
          }
        }
        const observer = new MutationObserver(mutationCallback);
        observer.observe(targetNode, mutationConfig);
      }
    });
  }

  /* Respond to messages */
  if (msg.text == "observe") {
    var checkView = document.getElementsByClassName("AppContent").length == 0;
    var awaitPage = setInterval(function() {
      var error = 0;
      try {
        if (checkView) {
          viewHandler1();
        }
        else {
          viewHandler2();
        }
      } catch (e) {
        error = e;
      }
      if (!error) {
        clearInterval(awaitPage);
      }
    }, 100);
  }
  return true;

});
