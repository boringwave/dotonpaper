/*jshint esversion: 6 */

// dimensions of myCanvas
var canvas = document.getElementById('myCanvas');
var cWidth  = canvas.width;
var cHeight = canvas.height;


/*---------------------------- CREATE THE GRID ------------------------------*/

//dimensions of grid 
var rows = 12;
var cols = 31;

//center coordinates of any circle
var x;
var y;

//center coordinates of first circle
var xstart = 100;
var ystart = 100;

// distance between center coordinates
var xspacing = 35;
var yspacing = 50;

// radius if any circle on the grid
var radius = 15;

// initial color of circles
var fillColor   = 'white'; 

//---- Create grid of circles
for(var row = 1; row <= rows; row++)
{
	y = ystart + (row - 1) * yspacing;

	for(var col = 1; col <= cols; col++) 
	{
		x = xstart + (col - 1) * xspacing;
		
		var newPoint 	= new Point(x,y);

		// create new circle 
		var newCircle = new Path.Circle(newPoint, radius);
		newCircle.fillColor = fillColor;
		
	  //---- Mouse events 
		newCircle.onMouseDown = function (event) {
			if(currentMood)
			{
				this.fillColor = currentMood;
			}
		}

		newCircle.onDoubleClick = function (event){
			if(currentMood)
				this.fillColor = 'white';
		}

		newCircle.onMouseEnter = function (event){
			if(currentMood && this.fillColor != 'white')
			{
				this.fillColor.alpha = 0.9;
			}

		}

		newCircle.onMouseLeave = function (event){
			if(currentMood && this.fillColor != 'white')
				this.fillColor.alpha = 1;
		}
	}
}

//--- days counter
for(var col = 0; col < 31; col++)
{
	var num = new PointText(new Point(xstart+ col*xspacing, ystart-radius-20));
	num.content = col+1;
	num.style = {
			fontFamily: 'Courier New',
			fontSize: 20,
			fillColor: 'White',
			justification: 'center'
	};
}

var monthsU = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP','OCT','NOV', 'DEC'];
var monthsL = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep','oct','nov', 'dec'];

//--- months list 
for(var col = 0; col < 12; col++)
{
	var num = new PointText(new Point(xstart-radius-40, ystart+ col*yspacing));
	num.content = monthsL[col]	;
	num.style = {
			fontFamily: 'Courier New',
			fontSize: 20,
			fillColor: 'white',
			justification: 'center'
	};
}

// drawLine(150,70,850); //top line
// drawLine(150,680,850); //bottom line

/*------------------------ CREATE AND HANDLE PAPERS -------------------------*/

// reference to main paper
var mainPaper = document.getElementById("mainpaper-btn");

mainPaper.onclick = function(){
	handlePapers(0);
}

// reference to papers(menu) btn
var paperMenu 		 = document.getElementsByClassName("dropdown-content");
 //reference to New Paper btn
var newPaperButton = document.getElementById("addPaper-btn");

var paperCount = 0; 
// onclick: create new paper and adds it to menu
newPaperButton.onclick = function() 
{
	var paperNumber = ++paperCount;
	var btnID 	= 'paper' + paperNumber +'-btn';
	var paperName 	= prompt("It's a brand-new paper, Does it have a name?");
	
	// default name
	if(paperName == "")
	{
		paperName = 'Paper '+ paperNumber;
	}	
	// create new entry
	var newPaperBtn = document.createElement("button");
	newPaperBtn.appendChild(document.createTextNode(paperName)); 
	newPaperBtn.id = btnID; 

	//link each button to its paper 
	newPaperBtn.onclick = function()
	{
		handlePapers(paperNumber);
	}
	// paperMenu[0].appendChild(newPaperBtn); // add to papers menu 
	$(document).ready(function($){
		$(".dropdown-content").append(newPaperBtn);
	});
	// now create a new paper
	createNewPaper(); 
}

//--- activate selected paper
function handlePapers(paperNo)
{	
	var currentLayer = project.activeLayer;
	if(currentLayer != 	project.layers[paperNo])
	{
		currentLayer.visible = false;
		project.layers[paperNo].activate();
		project.layers[paperNo].visible = true;
	}
	else
	{
		currentLayer.visible = true;
	}

}

/*------------------------------- MOUSE EVENTS ------------------------------*/

function onMouseDown(event) {
	if(project.activeLayer != project.layers[0]){
		var circle = new Path.Circle(new Point(event.point),20);
		circle.fillColor = 'white';
	}
}

function onMouseDrag(event) {
	if(project.activeLayer != project.layers[0]){
		var circle = new Path.Circle(new Point(event.point),20);
		circle.fillColor = 'white';
	}
}
//--- Create new layer as a new paper
function createNewPaper()
{
	var activeLayer = project.activeLayer;
	activeLayer.visible = false;
	var newLayer = new Layer();
}

/*------------------------------- LOAD MOODS --------------------------------*/

//  mood shaping
var moodX			 = 1400;
var moodY 		 = 120;
var moodYSpace = 100;
var moodR	  	 = 20;
// load moods
loadMood(moodX,moodY+moodYSpace*0,moodR,'Sleepy',				  	'#4d81ea');
loadMood(moodX,moodY+moodYSpace*1,moodR,'tired, sick, lazy','yellow' );
loadMood(moodX,moodY+moodYSpace*2,moodR,'happy, joyful',    '#FF2052');
loadMood(moodX,moodY+moodYSpace*3,moodR,'productive', 	    '#8806CE');
loadMood(moodX,moodY+moodYSpace*4,moodR,'angry, anxious',   '#66FF00');

var currentMood;
function loadMood(x, y, r, moodlist, color)
{

	var newPoint   = new Point(x,y);
	var moodCircle = new Path.Circle(newPoint, r);

	moodCircle.fillColor = color;
	moodCircle.onMouseDown = function (event){
		currentMood = this.fillColor;
	}

	var text = new PointText(new Point(x+150,y+10));
	text.content = moodlist;
	text.style = {
			fontFamily: 'Courier New',
			fontSize: 30,
			fillColor: 'White',
			justification: 'center'
	};  
}


/*------------------------------ UTILITIES ----------------------------------*/

function drawLine(x, y, length, color)
{
	if (typeof(color)==='undefined') color = 'white';

	var linePath = new Path();
	linePath.strokeColor = color;
	linePath.add(new Point(x, y));
	linePath.add(new Point(x+length, y));
} 

/*
function save(){
	var ctx = canvas.toDataURL('image/jpeg', 0.5); 
	console.log(ctx);

	if(typeof(localStorage) !== "undefined") 
	{
		localStorage.setItem('myCanvas', ctx);

	}
	else{
		console.log('undefined localStorage');
	}
}

window.onload = function() {
	var img = new Image;
	img.onload = function() {
			var ctx = document.getElementById('myCanvas').getContext('2d');
			ctx.drawImage(img, 0, 0);
			/// call next step here...
	}
	img.src = localStorage.getItem('myCanvas');
}
*/