/* eslint-env browser */
/* eslint "no-console": "off"  */
/* global $ */

//btnId == "locations-page" || btnId == "home-page" || btnId == "chat-page"

var allData = [];
var shown = false;
var position = ["home-page"];

$(document).ready(function () {
    $.ajax({
        type: 'GET',
        url: 'https://api.myjson.com/bins/109f4r',
        "success": function (json) {

            allData = json;
            createHomeTeams(allData);
            createDropdownLocations(allData);
            createAllTeamsPage();
            createAllGamesPage();
            setButtons();

            firebase.auth().onAuthStateChanged(function (user) {
                if (user != null) {
                    console.log("we are logged in");
                    $("#login, #loginIcon").hide();
                    $("#posts, #logoutIcon").show();
                    $("#text-input").removeAttr("disabled");
                    $("#send-btn").removeAttr("disabled");
                    setPostsEvent();
                } else {
                    console.log("we are logged out");
                    $("#login, #loginIcon").show();
                    $("#posts, #logoutIcon").hide();
                    $("#text-input").attr("disabled", "");
                    $("#send-btn").attr("disabled", "");
                }
            });
        },
        "error": function (json) {
            console.log("data book error", json);
        }
    })
})


function setButtons() {
    $("[data-btn]").click(btnClick);

    $("#goBackButton").click(goBack);

    $("#btn-location").click(function () {
        if (shown == false) {
            $("#locations-list").removeClass("hidden");
            $("#location-pre-image, #map").addClass("hidden");
            shown = true;
        } else {
            $("#locations-list").addClass("hidden");
            $("#location-pre-image").removeClass("hidden");
            shown = false;
        }
    });

    $("#a-chat").click(function () {
        $('#chat-background').scrollTop($('#chat-background')[0].scrollHeight);

    });

    $("#login").click(login);
    $("#loginIcon").click(login);
    $("#logoutIcon").click(logout);
    $("#send-btn").click(function () {
        if ($("#text-input").val()) {

            writeNewPost();
            $("#text-input").val("");
        }
    });
    $("#text-input").keyup(function (event) {
        if (event.which == 13) {
            if ($(this).val()) {
                writeNewPost();
                $(this).val("");
            }
        }
    });
}

function btnClick() {
    var btnId = this.getAttribute("data-id");
    $(".page").addClass("hidden");
    $("#goBackButton, #" + btnId).removeClass("hidden");

    if ($(this).attr("data-main")) {
        position = [];
        $("#goBackButton").addClass("hidden");
    }
    position.push(this.getAttribute("data-id"));
    console.log(position);

    if (btnId == "locations-page") {
        $("#locations-list, #map").addClass("hidden");
        $("#location-pre-image").removeClass("hidden");
        shown = false;
    }
    if ($(this).attr("data-team")) {
        var selectedTeam = this.getAttribute("data-team");
        findMatches(selectedTeam);
    }
    if ($(this).attr("data-info")) {
        var selectedTeam = this.getAttribute("data-info");
        createTeam(selectedTeam);
    }
    if ($(this).attr("data-game")) {
        var whichGame = parseFloat(this.getAttribute("data-game"));
        var selectedGame = [];
        var game = allData.matches[whichGame];
        selectedGame.push(game);
        createMatchPage(selectedGame);
    }
}

function createHomeTeams(data) {
    var teams = data.teams;
    var i = 0;
    for (var team in teams) {
        i += 1;
        var div = document.createElement("div");
        div.setAttribute("id", "team" + i);
        div.setAttribute("class", "team-bttn");
        div.setAttribute("data-team", team);
        div.setAttribute("data-id", "next-game-page");
        div.setAttribute("data-btn", "");
        var img = document.createElement("img");
        img.setAttribute("src", teams[team].badge);
        var name = document.createElement("span");
        name.setAttribute("class", "only_landscape bold");
        name.textContent = team;

        div.append(img, name);
        $("#home-page-teams").append(div);
    }
}

function createDropdownLocations(data) {
    var teams = data.teams;
    var i = 0
    for (var team in teams) {
        i += 1;
        var fullName = teams[team].full_name;
        var item = document.createElement("a");
        item.setAttribute("id", "item" + i);
        item.setAttribute("class", "locations-list");
        item.setAttribute("data-team", team);
        var name = document.createElement("span");
        name.setAttribute("class", "team_name");
        name.append(fullName);
        item.append(name);
        $("#locations-list").append(item);

        item.addEventListener("click", teamClicked);
    }
}

function teamClicked() {
    var teams = allData.teams;
    var teamKey = this.getAttribute("data-team");
    var locationData = teams[teamKey].location;
    createMap(locationData, teamKey);
}

function createMap(locationData, teamKey) {
    $("#map").empty();
    var teamName = allData.teams[teamKey].full_name;
    var address = locationData.address;
    var stadium = locationData.stadium;
    var iframeUrl = locationData.iframe;

    var nameH = document.createElement("h3");
    nameH.append(teamName);
    var stadiumH = document.createElement("h4");
    stadiumH.append(stadium);
    var addressH = document.createElement("h5");
    addressH.append(address);
    var mapDiv = document.createElement("div");
    mapDiv.setAttribute("class", "location_map");
    var teamMap = document.createElement("iframe");
    teamMap.setAttribute("src", iframeUrl);
    mapDiv.append(teamMap);

    $("#map").append(nameH, stadiumH, addressH, mapDiv);
    $("#map").removeClass("hidden");
    $("#locations-list").addClass("hidden");
    shown = false;

}

function findMatches(selectedTeam) {
    var matches = allData.matches;
    var teamMatches = [];
    for (var i = 0; i < matches.length; i++) {
        if (matches[i].team_away == selectedTeam || matches[i].team_home == selectedTeam) {
            teamMatches.push(matches[i]);
        }
    }
    createMatchPage(teamMatches);
}

function createMatchPage(teamMatches) {
    $("#teams, #day, #time, #get_me_there").empty();
    var teamHome = teamMatches[0].team_home;
    var teamHomeFull = allData.teams[teamHome].full_name;
    var teamAway = teamMatches[0].team_away;
    var teamAwayFull = allData.teams[teamAway].full_name;
    var dayName = teamMatches[0].date.day_name;
    var dayNum = teamMatches[0].date.day_num;
    var month = teamMatches[0].date.month;
    var time = teamMatches[0].date.time;
    var stadium = allData.teams[teamHome].location.stadium;
    //    var address = allData.teams[teamHome].location.address;
    var route = allData.teams[teamHome].location.url;

    var firstTeam = document.createElement("h3");
    firstTeam.append(teamHomeFull);
    var vs = document.createElement("p");
    vs.innerHTML = "vs.";
    var secondTeam = document.createElement("h3");
    secondTeam.append(teamAwayFull);

    $("#teams").append(firstTeam, vs, secondTeam);

    var matchDay = document.createElement("h5");
    matchDay.append(dayName);
    var matchDayNum = document.createElement("p");
    matchDayNum.append(dayNum);
    var matchMonth = document.createElement("h5");
    matchMonth.append(month);

    $("#day").append(matchDay, matchDayNum, matchMonth);

    var matchTime = document.createElement("p");
    matchTime.append(time);
    var matchStadium = document.createElement("h6");
    matchStadium.append(stadium);

    var where = document.createElement("div");
    where.setAttribute("class", "where_is_the_match");

    var getMeImageL = document.createElement("img");
    getMeImageL.setAttribute("src", "styles/images/locations-512.png");
    getMeImageL.setAttribute("class", "get_me_there_image only_landscape");
    getMeImageL.setAttribute("id", "get_me_there_image");

    where.append(matchStadium, getMeImageL);
    $("#time").append(matchTime, where);

    var getMeThere = document.createElement("div");
    getMeThere.setAttribute("class", "get_me_there only_portrait")
    getMeThere.setAttribute("id", "get_me_there");
    var locationAnchor = document.createElement("a");
    locationAnchor.setAttribute("href", route);
    var getMeImage = document.createElement("img");
    getMeImage.setAttribute("src", "styles/images/locations-512.png");
    getMeImage.setAttribute("class", "get_me_there_image");
    getMeImage.setAttribute("id", "get_me_there_image");

    var routeP = document.createElement("p");
    routeP.innerHTML = "ROUTE";

    $("#get_me_there_image").click(function () {
        window.location = route;
    })

    locationAnchor.append(getMeImage);
    getMeThere.append(locationAnchor);
    getMeThere.append(routeP);
    $("#next-game-page").append(getMeThere);
}

function createAllTeamsPage() {
    var teams = allData.teams;
    for (var team in teams) {
        var badge = teams[team].badge;
        var fullName = teams[team].full_name;

        var teamLink = document.createElement("div");
        teamLink.setAttribute("data-id", "team-page");
        teamLink.setAttribute("data-info", team);
        teamLink.setAttribute("data-btn", "");
        teamLink.setAttribute("id", "team-parent");
        teamLink.setAttribute("class", "team_parent");

        var divImg = document.createElement("div");
        divImg.setAttribute("id", "div-img");
        divImg.setAttribute("class", "div_img");

        var teamBadge = document.createElement("img");
        teamBadge.setAttribute("src", badge);
        teamBadge.setAttribute("class", "badge_img");

        var divName = document.createElement("div");
        divName.setAttribute("id", "div-name");
        divName.setAttribute("class", "div_name");

        var teamName = document.createElement("h3");
        teamName.textContent = fullName;

        divImg.append(teamBadge);
        divName.append(teamName);
        teamLink.append(divImg, divName);
        $("#all-teams").append(teamLink);

    }
}

function createTeam(selectedTeam) {
    $("#team-name, #players, #location-address").empty();
    var team = allData.teams[selectedTeam];
    var badgeUrl = team.badge;
    var players = team.players;
    var url = team.location.url;
    var address = team.location.address;

    var name = document.createElement("p");
    name.textContent = team.full_name;

    var playersList = document.createElement("ul");

    for (var i = 0; i < players.length; i++) {
        var plyr = document.createElement("li");
        plyr.textContent = players[i];
        playersList.append(plyr);
    }

    $(".location_link").attr("href", url);
    $("#players").append(playersList);
    $('.logo_part').css('background-image', 'url(' + badgeUrl + ')');
    $("#team-name").append(name);
    $("#location-address").append(address);
}

function createAllGamesPage() {

    var matches = allData.matches;
    var allMatches = [];

    for (var i = 0; i < matches.length; i++) {
        var teamHome = matches[i].team_home;
        var teamAway = matches[i].team_away;
        var abbrHome = allData.teams[teamHome].abbr;
        var abbrAway = allData.teams[teamAway].abbr;
        var badgeHome = allData.teams[teamHome].badge;
        var badgeAway = allData.teams[teamAway].badge;
        var month = (matches[i].date.month).slice(0, 3);
        var dayNum = matches[i].date.day_num;
        var dayName = (matches[i].date.day_name).slice(0, 3);
        var time = matches[i].date.time;

        var parentDiv = document.createElement("div");
        parentDiv.setAttribute("class", "parent_div");
        parentDiv.setAttribute("data-game", i);
        parentDiv.setAttribute("data-id", "next-game-page");
        parentDiv.setAttribute("data-btn", "");
        var teamsDiv = document.createElement("div");
        teamsDiv.setAttribute("class", "all_games_teams");
        var teamBadgeH = document.createElement("img");
        teamBadgeH.setAttribute("class", "only_landscape team_badge team_badge_H");
        teamBadgeH.setAttribute("src", badgeHome);
        var teamBadgeA = document.createElement("img");
        teamBadgeA.setAttribute("class", "only_landscape team_badge team_badge_A");
        teamBadgeA.setAttribute("src", badgeAway);
        var whenGame = document.createElement("div");
        whenGame.setAttribute("class", "when_game");
        var dayDiv = document.createElement("div");
        var timeDiv = document.createElement("div");
        var separator = document.createElement("div");
        separator.setAttribute("class", "separator");

        timeDiv.append(time);
        dayDiv.append(dayName + " " + dayNum + " " + month);
        whenGame.append(dayDiv, timeDiv);
        teamsDiv.append(teamBadgeH, abbrHome + " - " + abbrAway, teamBadgeA);
        parentDiv.append(teamsDiv, whenGame);

        $("#all-the-games").append(parentDiv, separator);

    }

}

function goBack() {
    position.pop();
    var btnId = position[position.length - 1];
    $(".page").addClass("hidden");
    $("#" + btnId).removeClass("hidden");
    console.log(position);

    if (position.length == 1) {
        $("#goBackButton").addClass("hidden");
    } else {
        $("goBackButton").removeClass("hidden");
    }

}

function login() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
}

function logout() {
    var confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
        firebase.auth().signOut();
        //        alert("You have been logged out!");
    }
}

function writeNewPost() {

    var text = document.getElementById("text-input").value;
    var userName = firebase.auth().currentUser.displayName;

    //a port entry
    var postData = {
        name: userName,
        body: text
    };
    console.log(postData);


    // get a key for a new post
    var newPostKey = firebase.database().ref().child("posts").push().key;

    console.log(newPostKey);

    var updates = {};
    updates[newPostKey] = postData;

    firebase.database().ref().child("posts").update(updates);


}

//set events that every time there's a change on the database, it will get the post
function setPostsEvent() {

    $('#chat-background').scrollTop($('#chat-background')[0].scrollHeight);

    firebase.database().ref().child("posts").on("value", function (data) {

        var posts = data.val();

        var logs = document.getElementById("posts");
        logs.innerHTML = "";

        for (var key in posts) {
            var text = document.createElement("div");
            var element = posts[key];

            if (element.name == firebase.auth().currentUser.displayName) {
                text.setAttribute("class", "my_message message")
            } else {
                text.setAttribute("class", "message " + element.name);
            }

            var whoSaidThat = document.createElement("span");
            whoSaidThat.setAttribute("class", "bold");
            whoSaidThat.innerHTML = element.name;
            text.append(whoSaidThat, element.body);

            logs.append(text);
        }


        $('#chat-background').animate({
            scrollTop: $('#chat-background')[0].scrollHeight
        }, 500);
    });
}
