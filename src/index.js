"use strict";

import _ from "lodash";
import axios from "axios";
import ch from "cheerio";
import images from "./images.js"

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

async function getFileImage(){
    var imgs = Object.keys(images)
    var src = imgs[Math.floor(Math.random() * imgs.length)]
    var date = images[src]
    return new Answer(src, "Image", date);
}

async function getNewPicture(e) {
    answer = await getFileImage();
    imageTag.setAttribute("src", answer.url);
}

function giveAnswer(e) {
    addScore(e.target);
    getNewPicture();
}

function addScore(element){
    var newPoints = Math.max(0, Math.floor(10000/Math.abs(answer.date - parseInt(element.value))));
    points += newPoints
    scoreText.textContent = `You scored ${newPoints} points, the correct year was ${answer.date}.\n You now have ${points} points`;
    element.value = "";
}


var answer;
var points = 0;
getNewPicture();

var answerBox = select("input[type=text]")
var scoreText = select("#score")
var imageTag = select("img");

console.log("score is :")
console.log(scoreText);

answerBox.addEventListener("change", giveAnswer)

