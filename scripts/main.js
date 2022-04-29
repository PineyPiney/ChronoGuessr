define(['require', 'my-module'], function(require, myModule){
    return {
        myModule
    }
})

function select(query){
    return document.querySelector(query);
}

function selectAll(query){
    return document.querySelectorAll(query);
}

function getGettyImage(){
    return new Answer();
}

function getLifeImage(){
    return new Answer();
}

function getNewPicture(e){
    console.log(e);
    answer = getLifeImage();
    answerButton.disabled = answer == null;
}

function giveAnswer(e){
    console.log(e);



    answer = null;
    answerButton.disabled = answer == null;
}

var answer;
var year = 2000;

let nextButton = select(`button.next-button`);
let answerButton = select(`button.answer-button`);

let imageDiv = select(`div.image`)
let imageTag = select(`image`)

nextButton.addEventListener(`click`, getNewPicture);
answerButton.addEventListener(`click`, giveAnswer);

answerButton.disabled = true;
