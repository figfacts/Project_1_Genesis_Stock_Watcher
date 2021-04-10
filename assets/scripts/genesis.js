// --------------------------------------------------------------------------------------------------------------
// Global Variables Section
// --------------------------------------------------------------------------------------------------------------
var debugNews = "false";    // debug=true will cause news api to read local file
var debugFavorites = "false";  // debug=true will cause news api to read local file
var debugStock = "false";      // debug=true will cause news api to read local file
var favoritesArray = [];       // Used to order & display favorite stock tickers
var newsIndex = 0;             // Used to cycle through the newsApiKey to try and avoid limits set on API call
var tickerIndex = 0;           // Used to cycle through the tickerApiKey to try and avoid limits set on API call
const newsApiKey = ["2fa72563c6d8381eb46abd9e77860156", "8c535f1bf34a3d699312fa51b152d476"]
const tickerApiKey = ["c243d7d9b1d14c30bb6ce1ea2a8ae8c0", "b84c9659f3944589a5147c448c52a1e3", "3553e4e7f6f145e7996a726674defbc4", "f7965dfc06b54da79a51cf9966e8bcca"]    // Mark H
const topStories = "TOP STORIES";   // Used on page load to get top news stories

const formatCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
})

// --------------------------------------------------------------------------------------------------------------
// Function: deleteFavorite
// Purpose:  Delete ticker symbol from local storage and favoritesArray
// Input:    <string> stock ticker symbol to remove
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function deleteFavorite(stockTicker) {
    // Remove from Array
    // 1. Find the stock ticker in the array
    var index = favoritesArray.indexOf(stockTicker);
    // 2. If found remove it from the array
    if (index !== -1) {
        favoritesArray.splice(index, 1);
    }
    // Sort the favorite ticker symbols so they are alphabetical
    favoritesArray.sort();
    // Store to local storage
    localStorage.removeItem("favoriteStocks");
    localStorage.setItem("favoriteStocks", JSON.stringify(favoritesArray));
    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: saveTicker
// Purpose:  Save ticker symbol to local storage and favoritesArray.  This will uppercase the symbol for consistency
//           and will ensure the symbol isn't already in the favorites since we don't want it multipe times
// Input:    <string> stock ticker symbol to save to the favorites
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function saveTicker(stockTicker) {
    // Only store the stock ticker if it hasn't been previously stored
    stockTicker = stockTicker.toUpperCase();
    if (!favoritesArray ||
        favoritesArray.length === 0 ||
        !favoritesArray.includes(stockTicker)) {
        favoritesArray.push(stockTicker);
        // Sort the favorite ticker symbols so they are alphabetical
        favoritesArray.sort();
        // Store to local storage
        localStorage.removeItem("favoriteStocks");
        localStorage.setItem("favoriteStocks", JSON.stringify(favoritesArray));
        getFavoritesInfo();
    }
    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: getNews
// Purpose:  Retrieve news stories for the stock ticker or the top news stories on initial load. Since there is a
//           limit to how many times the free api can be called do a couple of things:
//             1) Cycle through an array of API keys to increase the number of calls we can have
//             2) Allow debug to be turned on during development/testing to use local JSON files instead of calling API
// Input:    <string> stock ticker symbol or "TOP STORIES" to get the corresponding news
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function getNews(stockTicker) {
    // If not in debug mode make api call for news
    if (debugNews === "false") {
        var newsApiUrl = encodeURI(`https://gnews.io/api/v4/top-headlines?token=${newsApiKey[newsIndex]}&topic=business&country=us&q=${stockTicker}`);
        // If this is the page load "TOP STORIES" will be passed to get Top Business Stories of the day - the API URL format is a bit different
        if (stockTicker === topStories) {
            newsApiUrl = encodeURI(`https://gnews.io/api/v4/top-headlines?token=${newsApiKey[newsIndex]}&topic=business&country=us`)
        }
        // Set the index to the next element for the array of API keys
        newsIndex++;
        if (newsIndex >= newsApiKey.length) {
            newsIndex = 0;
        }
    } else {   // In debug mode - use the locally stored file for news
        var newsApiUrl = "./assets/testData/gnews.JSON"
    }

    // Retrieve the JSON object with the news stories - will either get JSON object from API call or locally stored file
    fetch(newsApiUrl, {
        method: 'GET',              // GET is the default.
        credentials: 'same-origin', // include, *same-origin, omit
        redirect: 'follow',         // manual, *follow, error
        cache: 'reload'             // Refresh the cache
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Build the News section
            buildNews(data);
        })
        // if promise was not returned, display a message that the news is not available
        .catch(error => {
            $("#container-news").empty();
            var newsEl = $("<div>");
            var headLineEl = $("<h5>");
            headLineEl.text("News is Not Currently Available");
            newsEl.append(headLineEl);
            $("#container-news").append(newsEl);
            if (debut === "true") {
                console.log(error);
            }
        });
    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: getFavoritesInfo
// Purpose:  Retrieve news stock ticker information for each symbol in the favoritesArray. Since there is a
//           limit to how many times the free api can be called do a couple of things:
//             1) Cycle through an array of API keys to increase the number of calls we can have
//             2) Allow debug to be turned on during development/testing to use local JSON files instead of calling API
// Input:    <>
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function getFavoritesInfo() {
    if (favoritesArray == null || favoritesArray.length == 0) {
        // There are not any favorites to display so just return
        return;
    }
    // If not in debug mode make api call for stock info
    if (debugFavorites === "false") {
        console.log(tickerApiKey[tickerIndex]);
        var stockApiUrl = encodeURI(`https://api.twelvedata.com/time_series?symbol=${favoritesArray.join(",")}&interval=1day&outputsize=1&apikey=${tickerApiKey[tickerIndex]}`);
        // Set the index to the next element for the array of API keys
        tickerIndex++;
        if (tickerIndex >= tickerApiKey.length) {
            tickerIndex = 0;
        }
    } else {   // If in debug mode use the locally stored file for stock info
        var stockApiUrl = "./assets/testData/twelveFavorites.JSON"
    }

    // Retrieve the JSON object with the stock information for all favorites - will either get JSON object 
    //    from API call or locally stored file
    fetch(stockApiUrl)
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Build the Favorites section
            buildFavorites(data);
        })
        // if promise was not returned, display a message that the stock information is not available
        .catch(error => {
            $("#favorites").empty();
            var favoritesEl = $("<div>");
            var headLineEl = $("<h5>");
            headLineEl.text("Stock Info is Not Currently Available");
            favoritesEl.append(headLineEl);
            $("#favorites").append(favoritesEl);
            if (debugFavorites === "true") {
                console.log(error);
            }
        });
    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: getTickerInfo
// Purpose:  Retrieve news stock ticker information for the section where the user entered the symbol. Since there is a
//           limit to how many times the free api can be called do a couple of things:
//             1) Cycle through an array of API keys to increase the number of calls we can have
//             2) Allow debug to be turned on during development/testing to use local JSON files instead of calling API
// Input:    <string> stock ticker symbol
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function getTickerInfo(tickerName) {
    // If not in debug mode make api call for stock info
    if (debugStock === "false") {
        var stockApiUrl = encodeURI(`https://api.twelvedata.com/time_series?symbol=${tickerName}&interval=1day&outputsize=100&apikey=${tickerApiKey[tickerIndex]}`);
        // Set the index to the next element for the array of API keys
        tickerIndex++;
        if (tickerIndex >= tickerApiKey.length) {
            tickerIndex = 0;
        }
    } else {   // If in debug mode use the locally stored file for new
        if (tickerName == '1234') {  // 1234 is used to return a bad stock message
            var stockApiUrl = "./assets/testData/twelveBad.JSON";
        } else {
            var stockApiUrl = "./assets/testData/twelveHP.JSON";
        }
    }

    // Retrieve the JSON object with the stock information for this symbol - will either get JSON object 
    //    from API call or locally stored file
    fetch(stockApiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.status === 'error') {
                displayModal("OOPS! The stock symbol was not found.  Please try again.")
                return;
            }
            // Empty search field
            var symbolSearchBtn = $("#tickerInput");
            symbolSearchBtn.val("");
            // Build the Ticker Section
            buildTickerInfo(data);
            // Get the news for this ticker symbol
            getNews(tickerName);
        })
        // if promise was not returned, display a message that the stock information is not available
        .catch(error => {
            var tickerDivEl = $("#tickerInfo");
            tickerDivEl.empty();
            var tickerEl = $("<div>");
            var headLineEl = $("<h5>");
            headLineEl.text("Stock Info is Not Currently Available");
            tickerEl.append(headLineEl);
            if (debugStock === "true") {
                console.log(error);
            }
        });
    // return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: buildFavorites
// Purpose:  Build the individual stock cards in the favorites section
// Input:    <JSON> data returned from api call
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function buildFavorites(data) {
    // Clear out any previous favorites html elements
    $("#favorites").empty();
    // create elements for favorites
    if (favoritesArray.length == 1) {
        // Creating ticker div
        var tickerEl = $("<div class='card shadow-lg text-white bg-primary mx-auto mb-10 p-2' style='width: 10.5rem; height: 12rem;'>");
        // Extract values to be displayed
        var tickerSymbol = data.meta.symbol;
        var tickerOpeningPrice = parseFloat(data.values[0].open);
        var tickerCurrentPrice = parseFloat(data.values[0].close);
        
        percentChange = (tickerCurrentPrice / tickerOpeningPrice) * 100 - 100;

        // Set decimal places
        tickerOpeningPrice = tickerOpeningPrice.toFixed(2);
        tickerCurrentPrice = tickerCurrentPrice.toFixed(2);
        percentChange = percentChange.toFixed(2);

        // Creating tags with the result items
        var tickerSymbolEl = $("<h4 class='card-title'>").text(tickerSymbol);
        var tickerOpeningPriceEl = $("<p class='card-text'>").text(`Opening Price:  $${tickerOpeningPrice}`);
        var tickerCurrentPriceEl = $("<p class='card-text'>").text(`Current Price:  $${tickerCurrentPrice}`);
        var tickerPercentChangeEl = $("<p >").text(`Percent Change:  ${percentChange}%`);
        if (percentChange < 0) {
            tickerPercentChangeEl.addClass("card-text-loser");
        } else {
            tickerPercentChangeEl.addClass("card-text-winner");
        }

        // Action buttons (ticker info, show news for symbol, remove symbol from favorites)
        var btnHTML = `<button class="btn btn-primary savebtn1info" type="button" data-toggle="tooltip" data-placement="top" title="Get Stock Info" data-ticker="${tickerSymbol}" data-action="info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 24 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                            </svg>
                        </button>
                        <button class="btn btn-warning savebtn1news" type="button" data-toggle="tooltip" data-placement="top" title="Get News Stories" data-ticker="${tickerSymbol}" data-action="news">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-newspaper" viewBox="0 0 24 16">
                                <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5v-11zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5H12z"/>
                                <path d="M2 3h10v2H2V3zm0 3h4v3H2V6zm0 4h4v1H2v-1zm0 2h4v1H2v-1zm5-6h2v1H7V6zm3 0h2v1h-2V6zM7 8h2v1H7V8zm3 0h2v1h-2V8zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1z"/>
                            </svg>
                        </button>
                        <button class="btn btn-danger savebtn1del" type="button" data-toggle="tooltip" data-placement="top" title="Remove from Favorites" data-ticker="${tickerSymbol}" data-action="delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-trash" viewBox="0 0 24 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>`;

        // Append elements to tickerEl and then add to the favorites section
        tickerEl.append(tickerSymbolEl, tickerOpeningPriceEl, tickerCurrentPriceEl, tickerPercentChangeEl, btnHTML);
        $("#favorites").append(tickerEl);
    }
    else {
        Object.values(data).forEach(ticker => {
            // Creating ticker div
            var tickerEl = $("<div class='card shadow-lg text-white bg-primary mx-auto mb-10 p-2' style='width: 10.5rem; height: 12rem;'>");
            // Extract values to be displayed
            var tickerSymbol = ticker.meta.symbol;
            var tickerOpeningPrice = parseFloat(ticker.values[0].open);
            var tickerCurrentPrice = parseFloat(ticker.values[0].close);
           
            percentChange = (tickerCurrentPrice / tickerOpeningPrice) * 100 - 100;
    
            // Set decimal places
            tickerOpeningPrice = tickerOpeningPrice.toFixed(2);
            tickerCurrentPrice = tickerCurrentPrice.toFixed(2);
            percentChange = percentChange.toFixed(2);
    
            // Creating tags with the result items
            var tickerSymbolEl = $("<h4 class='card-title'>").text(tickerSymbol);
            var tickerOpeningPriceEl = $("<p class='card-text'>").text(`Opening Price:  $${tickerOpeningPrice}`);
            var tickerCurrentPriceEl = $("<p class='card-text'>").text(`Current Price:  $${tickerCurrentPrice}`);
            var tickerPercentChangeEl = $("<p >").text(`Percent Change:  ${percentChange}%`);
            if (percentChange < 0) {
                tickerPercentChangeEl.addClass("card-text-loser");
            } else {
                tickerPercentChangeEl.addClass("card-text-winner");
            }
    
            // Action buttons (ticker info, show news for symbol, remove symbol from favorites)
            var btnHTML = `<button class="btn btn-primary savebtn1info" type="button" data-toggle="tooltip" data-placement="top" title="Get Stock Info" data-ticker="${tickerSymbol}" data-action="info">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 24 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                </svg>
                            </button>
                            <button class="btn btn-warning savebtn1news" type="button" data-toggle="tooltip" data-placement="top" title="Get News Stories" data-ticker="${tickerSymbol}" data-action="news">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-newspaper" viewBox="0 0 24 16">
                                    <path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5v-11zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5H12z"/>
                                    <path d="M2 3h10v2H2V3zm0 3h4v3H2V6zm0 4h4v1H2v-1zm0 2h4v1H2v-1zm5-6h2v1H7V6zm3 0h2v1h-2V6zM7 8h2v1H7V8zm3 0h2v1h-2V8zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1z"/>
                                </svg>
                            </button>
                            <button class="btn btn-danger savebtn1del" type="button" data-toggle="tooltip" data-placement="top" title="Remove from Favorites" data-ticker="${tickerSymbol}" data-action="delete">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-trash" viewBox="0 0 24 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            </button>`;
    
            // Append elements to tickerEl and then add to the favorites section
            tickerEl.append(tickerSymbolEl, tickerOpeningPriceEl, tickerCurrentPriceEl, tickerPercentChangeEl, btnHTML);
            $("#favorites").append(tickerEl);
        })
    }
return;
};


// --------------------------------------------------------------------------------------------------------------
// Function: buildTickerInfo
// Purpose:  Build the ticker information for the symbol the user selected
// Input:    <JSON> data returned from api call
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function buildTickerInfo(data) {
    // Clear out ticker info for searched ticker symbol
    var tickerDivEl = $("#tickerInfo");
    tickerDivEl.empty();

    // Build the 10, 30, 100 day highs and low values
    var ticker100DayHigh, ticker100DayLow, ticker30DayHigh, ticker30DayLow, ticker10DayHigh, ticker10DayLow;
    for (i = 0; i < 100; i++) {
        if (i < 10) {
            if (ticker100DayHigh === undefined || data.values[i].high > ticker100DayHigh) ticker100DayHigh = data.values[i].high;
            if (ticker100DayLow === undefined || data.values[i].low < ticker100DayLow) ticker100DayLow = data.values[i].low;
            if (ticker30DayHigh === undefined || data.values[i].high > ticker30DayHigh) ticker30DayHigh = data.values[i].high;
            if (ticker30DayLow === undefined || data.values[i].low < ticker30DayLow) ticker30DayLow = data.values[i].low;
            if (ticker10DayHigh === undefined || data.values[i].high > ticker10DayHigh) ticker10DayHigh = data.values[i].high;
            if (ticker10DayLow === undefined || data.values[i].low < ticker10DayLow) ticker10DayLow = data.values[i].low;
        }
        else if (i < 30) {
            if (ticker100DayHigh === undefined || data.values[i].high > ticker100DayHigh) ticker100DayHigh = data.values[i].high;
            if (ticker100DayLow === undefined || data.values[i].low < ticker100DayLow) ticker100DayLow = data.values[i].low;
            if (ticker30DayHigh === undefined || data.values[i].high > ticker30DayHigh) ticker30DayHigh = data.values[i].high;
            if (ticker30DayLow === undefined || data.values[i].low < ticker30DayLow) ticker30DayLow = data.values[i].low;
        }
        else {
            if (ticker100DayHigh === undefined || data.values[i].high > ticker100DayHigh) ticker100DayHigh = data.values[i].high;
            if (ticker100DayLow === undefined || data.values[i].low < ticker100DayLow) ticker100DayLow = data.values[i].low;
        }
    }

    var symbolOpen = parseFloat(data.values[0].open);
    var symbolClose = parseFloat(data.values[0].close);
 
    var percentChange = symbolClose / symbolOpen * 100 - 100;
    percentChange = percentChange.toFixed(2);
 
    symbolOpen = symbolOpen.toFixed(2);
    symbolOpen = formatCurrency.format(symbolOpen);
 
    var symbolHigh = parseFloat(data.values[0].high);
    symbolHigh = symbolHigh.toFixed(2);
    symbolHigh = formatCurrency.format(symbolHigh);
 
    var symbolLow = parseFloat(data.values[0].low);
    symbolLow = symbolLow.toFixed(2);
    symbolLow = formatCurrency.format(symbolLow);

    symbolClose = symbolClose.toFixed(2);
    symbolClose = formatCurrency.format(symbolClose);
 
    var symbolVolume = parseInt(data.values[0].volume, 10);
    symbolVolume = symbolVolume.toLocaleString('en-US');
 
    // Create Elements for ticker information
    var symbolHeadingEl = $('<span>').text(data.meta.symbol);
    var symbolExchangeEl = $('<p>').text(`Exchange: ${data.meta.exchange}`);
    var symbolOpenEl = $('<p>').text(`Open: ${symbolOpen}`);
    var symbolHighEl = $('<p>').text(`High: ${symbolHigh}`);
    var symbolLowEl = $('<p>').text(`Low: ${symbolLow}`);
    var symbolCloseEl = $('<p>').text(`Close: ${symbolClose}`);
    var percentChangeEl = $('<p>').text(`Change: ${percentChange}%`);
    // Color code the Percent Change to indicate whether we have a winner or a loser
    if (percentChange < 0) {
        percentChangeEl.addClass("loser");
    } else {
        percentChangeEl.addClass("winner");
    }
    var symbolVolumeEl = $('<p>').text(`Volume: ${symbolVolume}`);
 
    // Add to favorites button
    var saveToFavBtnEl = `<button class="btn btn-warning" type="button" data-toggle="tooltip" data-placement="top" title="Add to Favorites" id="btnAddFavorite" data-ticker="${data.meta.symbol}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                            </svg>
                        </button>`;
 
    // Create HTML div to append new elements to render on page....
    tickerDivEl.append(symbolHeadingEl, saveToFavBtnEl, symbolExchangeEl, symbolOpenEl, symbolHighEl, symbolLowEl, symbolCloseEl, percentChangeEl, symbolVolumeEl);

    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: buildNews
// Purpose:  Build the news section. Limit to the top three stories.
// Input:    <JSON> data returned from api call
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function buildNews(data) {
    // Clear out any previous news html elements
    $("#container-news").empty();
    // Make sure we have at max three articles
    var articleCount = data.totalArticles;
    if (articleCount > 3) {
        articleCount = 3;
    }
 
    for (var i = 0; i < articleCount; i++) {
        // create elements for news
        var newsEl = $("<div>");
        var headLineEl = $("<h5>");
        var sourceEl = $("<b>");
        var descriptionEl = $("<i>");
        var newsLinkEl = $("<a>");
        headLineEl.text(data.articles[i].title);
        newsLinkEl.attr("href", data.articles[i].url);
        newsLinkEl.attr("target", "_blank");
        newsLinkEl.append(headLineEl);
        sourceEl.text(`Source: ${data.articles[i].source.name}`);
        descriptionEl.text(`    ${data.articles[i].content}`);

        // Append elements to newsEl and then add to the container-news section
        newsEl.append(newsEl, newsLinkEl, sourceEl, descriptionEl);
        $("#container-news").append(newsEl);
    }
    return;
}

// --------------------------------------------------------------------------------------------------------------
// Function: displayModal
// Purpose:  Display a pop up modal window with a message refencing thins such a a bad ticker symbol entered.
// Input:    <string> message to be displayed
// Returns:  <>
// --------------------------------------------------------------------------------------------------------------
function displayModal(message) {
    var modal = $("#modalWindow");
    var modalMessage = $("#modalMessage");
    modalMessage.text(message);
    modal.modal('show');
    return;
}

// --------------------------------------------------------------------------------------------------------------
// LISTENER
// Purpose:  Listen for the favorite button to be clicked and add to favorites.
// --------------------------------------------------------------------------------------------------------------
$("#tickerInfo").on("click", ".btn", function (event) {
    event.preventDefault();
    let stockTicker = event.target.closest("button").dataset.ticker;
    saveTicker(stockTicker);
});

// --------------------------------------------------------------------------------------------------------------
// LISTENER
// Purpose:  Listen for the close button in the modal to be clicked and close the modal.  The modal will also
//             close if the user clicks any where outside of the modal.
// --------------------------------------------------------------------------------------------------------------
$("#closeModal").on("click", function (event) {
    event.preventDefault();
    modal.style.display = "none";
});

// --------------------------------------------------------------------------------------------------------------
// LISTENER
// Purpose:  Listen for the search button to be clicked and display stock info for the symbol entered.
// --------------------------------------------------------------------------------------------------------------
$("#searchTicker").on("click", function (event) {
    // Preventing the button from trying to submit the form if a form is on the html page
    event.preventDefault();
    // Get the ticker entereed
    var tickerInput = $("#tickerInput").val().trim();
 
    //Verify a ticker symbol was entered
    if (tickerInput === "" || tickerInput == "undefined") {
        // Put a message of invalid input in the input box and display modal with message
        tickerInput.value = `Enter a valid symbol.`;
        displayModal("Enter a valid symbol.");
    } else {
        // Get the ticker info
        getTickerInfo(tickerInput);
    }
});

// --------------------------------------------------------------------------------------------------------------
// LISTENER
// Purpose:  Listen for one of the buttons on a favorites card to be clicked.
// --------------------------------------------------------------------------------------------------------------
$("#favorites").on('click', '.btn', function (event) {
    event.preventDefault();
    // Need to check and see if they clicked on Info, News, or Delete buttons
    let action = event.target.closest("button").dataset.action;
    let stockTicker = event.target.closest("button").dataset.ticker;
    if (action == "delete") {        // Delete selected - remove from favorites and redisplay new favorites  
        deleteFavorite(stockTicker);
        getFavoritesInfo();
    } else if (action == "news") {   // Display News selected - display top news stories for this symbol
        getNews(stockTicker);
    } else if (action == "info") {   // Display More stock info selected - display stock info in left-side stock section
        getTickerInfo(stockTicker);
    }
});


// --------------------------------------------------------------------------------------------------------------
// MAINLINE
// Purpose:  This code is executed when the page is loaded.
// --------------------------------------------------------------------------------------------------------------

// See if we are in debug mode - default: debug=false 
// Are we in debug mode for the news section?
debugNews = localStorage.getItem("debugNews");
if (debugNews !== "true") {
    debugNews = "false";
}
// Are we in debug mode for the favorites section?
debugFavorites = localStorage.getItem("debugFavorites");
if (debugFavorites !== "true") {
    debugFavorites = "false";
}
// Are we in debug mode for the ticker information section?
debugStock = localStorage.getItem("debugStock");
if (debugStock !== "true") {
    debugStock = "false";
}

// Load favorites array from local storage so we have the favorites the user is storing.
if (localStorage.getItem("favoriteStocks")) {
    favoritesArray = JSON.parse(localStorage.getItem("favoriteStocks"));
}

// Get the Favorites on load and build Favorites section
getFavoritesInfo();
// Get the top news stories on load and build news section
getNews(topStories);
 

