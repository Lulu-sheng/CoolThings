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

	// draws quote
	for(var i=0; i<wordsDrawn.length; i++){
		var data = wordsDrawn[i];
		if(data.id = 'chord'){
			context.strokeStyle = 'blue';
			context.fillText(data.word, data.x, data.y);
			context.strokeText(data.word, data.x, data.y);
		}else{
			context.strokeStyle = 'yellow';
			context.fillText(data.word, data.x, data.y);
			context.strokeText(data.word, data.x, data.y);
		}
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

				for(let line of responseObj.lineArray){
					let xPosition = 50;

					let wordsInLine = line.split(/\s/);

					for(let aWord of wordsInLine){

						// If there is a chord in the word
						while(aWord.indexOf('[') > -1){

							// get the index where the chord starts
							let indexOfChord = aWord.indexOf('[');
							// Use that index to get a substring containing the whole chord
							let chord = aWord.substring(indexOfChord,aWord.indexOf(']')+1);
							// Get the chord out of the word by replacing it with blank space
							aWord = aWord.replace(/\b\[.+?\]|\[.+?\]\b|\[.+?\]/, ''); // WE NEED TO CHANGE THIS TO BETTER REGEX

							// Measures how many pixels from the start of the word that the chord was
							// then subtracts the character [ from the chord so that its centered over where it 
							// was in the word
							let chordXOffset = context.measureText(aWord.substring(0,indexOfChord)).width -
								context.measureText(chord.charAt(0)).width;
							// Push this chord with the value offsets and an id chord which is used in refresh
							words.push({word:chord, x:xPosition + chordXOffset,  y:yPosition - 25, id:'chord'});
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

function insertStringAtIndex(stringAddingTo, stringToAdd, index){
	return stringAddingTo.substring(0,index) + stringToAdd 
		+ stringAddingTo.substring(index,stringAddingTo.length-1);
		
}

function handleRefreshButton () {
	let yPos = 50;
	const lineOffset = 60;
	let finalLines = [];
	var context = canvas.getContext('2d');
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

			if(j > 0){
				// Calculate the previous words length since we use this value a lot
				let prevWordWidth = context.measureText(line[j-1].word).width;

				// If this word is a chord, and its x position is less than where the last word ended
				// Then we know this chord belongs inside that word
				if(line[j].x < line[j-1].x + prevWordWidth && line[j].id == 'chord' && line[j-1].id != 'chord' ){

					// The index of where the chord should be in that word is calculated like a percent.
					// we take the x value of the chord and divide it by the x value of the end of the previous word.
					// If the start of the word is 0, and the end of the word is 100. This will tell me where along 
					// that range the chord would be. I multiply the length of that previous word by the percentage to 
					// get my index
					let indexWithinWord = Math.floor((line[j].x - line[j-1].x)/(prevWordWidth) * (line[j-1].word.length)-1);

					// Calculate how far back from the end of empLine the chord should go
					let indexRelativeToTempLine = tempLine.length - ((line[j-1].word.length - 1) - indexWithinWord);
					console.log("Chord " + line[j].word);
					console.log(indexWithinWord + "WRD");
					console.log(indexRelativeToTempLine + " TMP");
					// Function shoves the chord within the string and returns the new string.
					tempLine = insertStringAtIndex(tempLine,line[j].word, indexRelativeToTempLine);
					tempLine += " "
					continue;
				}
			}
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
