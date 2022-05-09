"use strict";

import axios from "axios";
import ch from "cheerio";
import images from "./images.js"
import gImages from "./gettyImages.js"
import DateLine from "./DateLine.js";

class Answer{
    constructor(url, name, date) {
        this.url = url;
        this.name = name;
        this.date = date;
    }
}

function select(query) {
    return document.querySelector(query);
}

function selectAll(query) {
    return document.querySelectorAll(query);
}

/*
const getDocument = async(url) => { 
    try {
        console.log("Getting Data");
        const { data } = await axios.get(url);
        console.log("Got Data");
        console.log(data);
        return ch.load(data);
    }
    catch (e){
        console.error(`Could not load URL ${url}`)
        throw(e)
    }
};

function getGettyImage() {
    return new Answer();
}

const getLifeImage = async() => {
    try{
        console.log(`Getting image from ${year}`)
        const doc = await getDocument(`https://www.google.co.uk/search?q=${year}+source:life&tbm=isch`)
        let imgs = doc("img.yWs4tf")
        let imgArray = Array.from(imgs)

        let image = imgArray[Math.floor(Math.random() * imgArray.length)];
        let src = image.getAttribute("src");
        let yS = year.toString()
        return new Answer(src, "image", yS);
    }
    catch (e){

    }
}
*/

async function getFileImage(imgDict){
    var years = Object.keys(imgDict);
    var year = years[Math.floor(Math.random() * years.length)];

    var imgs = imgDict[year];
    var img = imgs[Math.floor(Math.random() * imgs.length)];

    var name = img["name"]
    var date = img["date"]
    var src = img["src"]

    return new Answer(src, name, date);
}

async function getNewPicture(e) {
    currentImage = await getFileImage(gImages);
    imageTag.setAttribute("src", currentImage.url);
}

function giveAnswer(e) {
    addScore();
    getNewPicture();
}

function addScore(){
    let correct = Date.parse(currentImage.date);
    let error = Math.max(1, Math.abs(guess - correct) / 1e10)
    var newPoints = Math.max(0, Math.floor(1000/Math.sqrt(error)));
    points += newPoints;
    scoreText.textContent = `The correct date was ${currentImage.date}, you scored ${newPoints} points.\n You now have ${points} points`;

    answerBox.value = "";
    calendar.value = "";
}

var currentImage;
var guess;
var points = 0;
getNewPicture();

customElements.define("date-line", DateLine)

var imageTag = select("img");

var dateLine = select("date-line");
var button = select("button");

var scoreText = select("#score");
dateLine.addEventListener("change", (event) => guess = event.target.value);
button.addEventListener("click", giveAnswer);

