"use strict";

import _ from "lodash"
import axios from "axios"
import ch from "cheerio"

class Answer{
    constructor(url, name, date) {
        this.url = url;
        this.name = name;
        this.date = date;
    }
}

const getDocument = async(url) => { 
    try {
        console.log("Getting Data")
        const { data } = await axios.get(url, {
            method: 'GET',
            mode: 'no-cors',
            headers: {
              'Access-Control-Allow-Origin': 'https://www.google.co.uk',
              'Content-Type': 'application/json',
            },
            withCredentials: true,
            credentials: 'same-origin',
          });
        console.log("Got Data");
        console.log(data);
        return ch.load(data);
    }
    catch (e){
        console.error(`Could not load URL ${url}`)
        throw(e)
    }
};

const getImage = async(year) => { 
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
};

function select(query) {
    return document.querySelector(query);
}

function selectAll(query) {
    return document.querySelectorAll(query);
}

function getGettyImage() {
    return new Answer();
}

function getLifeImage() {
    return getImage(Math.floor(Math.random() * 200) + 1800)
}

function getNewPicture(e) {
    console.log(e);
    answer = getLifeImage();
    disable(answerButton, answer == null);
    imageTag.setAttribute("src", answer.url);
}

function giveAnswer(e) {
    console.log(e);
    answer = null;
    disable(answerButton, answer == null);
}

function disable(element, state) {
    element;
}

console.log("Getting Document");
getDocument("https://www.google.co.uk/search?q=1920+source:life&tbm=isch")
//getImage(1920)

/*
var answer;
var nextButton = select("button.next-button");
var answerButton = select("button.answer-button");
var imageDiv = select("div.image");
var imageTag = select("img");

nextButton.addEventListener("click", getNewPicture);
answerButton.addEventListener("click", giveAnswer);

answer = getImage(1920);
imageTag.setAttribute("src", answer.url)

disable(answerButton, true);
*/
