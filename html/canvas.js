// Lulu Sheng
// 101072946
// Assignment 1
// COMP2406
// Louis Nel
// 2018-02-01

var canvas = document.getElementById('canvas1');

var wordsDrawn = [];
var file = [];

function getWordAtLocation(aCanvasX, aCanvasY){
    var context = canvas.getContext('2d');

    for(var i=0; i<wordsDrawn.length; i++){
        var wordLength = context.measureText(wordsDrawn[i].word).width;

        // Collision detection between mouse press and word
        if((aCanvasX - wordsDrawn[i].x < wordLength) && 
            (aCanvasX - wordsDrawn[i].x > 0) &&
            (wordsDrawn[i].y - aCanvasY < 20) && 
            (wordsDrawn[i].y - aCanvasY > 0)) {
            return wordsDrawn[i];
        }
    }
    return null;
}

var drawCanvas = function() {
    var context = canvas.getContext('2d');

    context.fillStyle = 'white';
    context.fillRect(0,0,canvas.width,canvas.height); //erase canvas

    context.font = '20pt Arial';
    context.fillStyle = 'cornflowerblue';
    context.strokeStyle = 'blue';

    // draws quote
    for(var i=0; i<wordsDrawn.length; i++){ 
        var data = wordsDrawn[i];
        context.fillText(data.word, data.x, data.y);
        context.strokeText(data.word, data.x, data.y);
    }
}

function handleMouseDown(e){

    //get mouse location
    var rect = canvas.getBoundingClientRect();

    //use jQuery event object pageX and pageY
    var canvasX = e.pageX - rect.left; 
    var canvasY = e.pageY - rect.top;

    wordBeingMoved = getWordAtLocation(canvasX, canvasY);

    if(wordBeingMoved != null ){
        deltaX = wordBeingMoved.x - canvasX; 
        deltaY = wordBeingMoved.y - canvasY;
        $("#canvas1").mousemove(handleMouseMove);
        $("#canvas1").mouseup(handleMouseUp);

    }

    // Stop propagation of the event and stop any default 
    //  browser action
    e.stopPropagation();
    e.preventDefault();

    // update the canvas
    drawCanvas();
}

function handleMouseMove(e){

    console.log("mouse move");

    //get mouse location 
    var rect = canvas.getBoundingClientRect();
    var canvasX = e.pageX - rect.left;
    var canvasY = e.pageY - rect.top;

    // update the wordBeingMoved position
    wordBeingMoved.x = canvasX + deltaX;
    wordBeingMoved.y = canvasY + deltaY;

    e.stopPropagation();

    drawCanvas();
}

function handleMouseUp(e){
    console.log("mouse up");

    e.stopPropagation();

    //remove mouse move and mouse up handlers but 
    //leave mouse down handler
    $("#canvas1").off("mousemove", handleMouseMove); 
    $("#canvas1").off("mouseup", handleMouseUp); 

    drawCanvas(); 
}


function handleSubmitButton() {
    var context = canvas.getContext('2d');

    // Get text from user input field
    var userText = $('#userTextField').val();

    if(userText && userText != '') {

        var userRequestObj = {text: userText}; 
        var userRequestJSON = JSON.stringify(userRequestObj);
        $('#userTextField').val(''); //clear the user text field

        $.post("userText", userRequestJSON, function(data, status) {
            console.log("data: " + data);
            console.log("typeof: " + typeof data);
            var responseObj = JSON.parse(data);

            if (responseObj.lineArray) {

                // Create objects representing words and their locations
                var yPosition=50;
                var spacingBetweenWords = 20;
                var words = [];
				console.log(responseObj.lineArray);
				for(let line of responseObj.lineArray){
					let xPosition = 50;
							
					let wordsInLine = line.split(/\s/);
					
					for(let aWord of wordsInLine){
						while(aWord.indexOf('[') > -1){
						//for(let counter = 0; aWord.indexOf('[') > -1; counter++){
							// chord found
						
							let indexOfChord = aWord.indexOf('[');
							let chord = aWord.substring(indexOfChord,aWord.indexOf(']')+1);
							aWord = aWord.replace(/\b\[.+?\]|\[.+?\]\b|\[.+?\]/, ''); // WE NEED TO CHANGE THIS TO BETTER REGEX
							let chordXOffset = context.measureText(aWord.substring(0,indexOfChord)).width -
								context.measureText(chord.charAt(0)).width;
							words.push({word:chord, x:xPosition + chordXOffset,  y:yPosition - 25});
						}
						
						if(aWord.length > 0){
							words.push({word:aWord, x:xPosition,  y:yPosition});
						}
						xPosition += context.measureText(aWord).width + spacingBetweenWords;
					}
      				yPosition += 60;
				}
				

                // R3.3 The lyrics and chords shown on canvas are in chord-pro format
                wordsDrawn = words;
                drawCanvas();

                // R3.4 The chord pro text downloaded from the server is shown
                // as paragraph lines below the canvas
                let textDiv = document.getElementById("text-area");
                let textParagraph = "";
                for (var i = 0; i < responseObj.lineArray.length; i++) {
                    textParagraph = textParagraph + `<p> ${responseObj.lineArray[i]} </p>`;
                }
                textDiv.innerHTML = textParagraph;

            } else {
                // R3.5 If the requested song does not exist, then the canvas appears blank
                // and no there is no paragraph content below the canvas
                wordsDrawn = [];
                drawCanvas();
                document.getElementById("text-area").innerHTML = ``;
            }
        });
    }
}

function handleRefreshButton () {
    let yPos = 50;
    const lineOffset = 60;
    let finalLines = [];

    while (yPos <= $("#canvas1").height()) {
        var line = [];

        for (var i = 0; i < wordsDrawn.length; i++) {
            if (wordsDrawn[i].y > yPos - 50 && wordsDrawn[i].y < yPos + 10) {
                line.push(wordsDrawn[i]);
            }
        }

        line.sort(function (a, b) {
            return a.x - b.x;
        });

        let tempLine = "";
        for (var j = 0; j < line.length; j++) {
            tempLine += line[j].word + " ";
        }

        console.log(tempLine);

        finalLines.push(tempLine);
        yPos += lineOffset;
    }

    let textDiv = document.getElementById("text-area");
    let textParagraph = "";
    for (var i = 0; i < finalLines.length; i++) {
        textParagraph = textParagraph + `<p> ${finalLines[i]} </p>`;
    }
    textDiv.innerHTML = textParagraph;

    file = finalLines;
}

function handleSaveAsButton() {
    handleRefreshButton();

    var result = "";
    var userText = $('#userTextField').val();

    for (var i = 0; i < file.length; i++) {
        result += file[i] + "\n";
    }

    console.log(result);
        
    var userRequestObj = {fileTitle: userText, fileText: result}; 
    var userRequestJSON = JSON.stringify(userRequestObj);
    $('#userTextField').val(''); //clear the user text field

    // CALLBACK FUNCTION WHAT
    $.post("newFile", userRequestJSON, function(data, status) {
        console.log("success");
    });

}

var ENTER = 13;

function handleKeyUp(e){
    if(e.which == ENTER){		  
        handleSubmitButton(); //treat ENTER key like you would a submit
        $('#userTextField').val(''); //clear the user text field
    }

    e.stopPropagation();
    e.preventDefault();
}

$(document).ready(function() {
    $(document).keyup(handleKeyUp);
    $("#canvas1").mousedown(handleMouseDown);

    drawCanvas();
});
