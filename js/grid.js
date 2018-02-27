// "use strict";
/*jshint esversion: 6 */

/*-------------------------------- DATE -------------------------------------*/

// Today's date
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();
var fullDate = [dd, mm, yyyy];

// not-exist days indices 
var days   = [59,60,61,123,185,278,340];
var notday = new Set(days);

/*-------------------------------- GLOBALS ----------------------------------*/

// store object to store/restore papers 
var store = new Store();

// center coordinates of first circle
var xstart = 100;
var ystart = 120;

// selected mood 
var currentMood;

// group all moods circles 
var moodGroup = new Group();
moodGroup.name = 'mood-group';

// track the current active paper
var activeCircleName; 

// drawing path
var path;

// tool.minDistance = 0.5;
tool.maxDistance = 10;

// how many papers 
var paperCount = 0; 

// selected paint color
var paintColor = 'white';

// maintain removed objects
var removedArray = [];

/*----------------------- CREATE/RESTORE/INITIALIZATION ---------------------*/

//--- 1. initialize grid(main layer)
if(!check_path('mainlayer'))
{
	drawGrid(); 
	loadMoods();
	project.layers[0].name = 'mainlayer';
}
else{
	//-- restore previous data 
	project.clear();
	importPaper('mainlayer');
}

//--- 2. check for old (general) papers
if(check_path('buttonConfig'))
{
	var count = store.getJSON('buttonConfig')['count']; // papers count
	var titlesList = store.getJSON('buttonConfig')['titles'];
	if(count > 0)
	{
		// create a button for each paper
		for(var i = 0; i < count; i++)
		{
			var paperName = 'paper_' +(i+1);
			if(check_path(paperName)) 
			{
				importPaper(paperName);    // export its paper
				activatePaper('mainlayer'); // keep the main paper visible

				// create new entry
				var newPaperBtn = document.createElement("button");
				newPaperBtn.appendChild(document.createTextNode(titlesList[i])); 
				newPaperBtn.id = paperName;
				// append to the menu
				$(".dropdown-content").append(newPaperBtn);
				paperCount++;
			}
		}
		// bind actions to buttons 
		$(document).ready(function(){
			// link each button to its paper 
			$(".dropdown-content button").click(function(){
				
				if(project.activeLayer.name != 'mainlayer')
				{
					exportPaper(project.activeLayer.name);
				}
				activatePaper(this.id);
				if(this.id != 'mainlayer')
				{
					$("#back-btn").css('visibility', 'visible')
				}
				else
				{
					$("#back-btn").css('visibility', 'hidden');
				}

			});
		});
	}
}

//--- 3. setup handler for new added papers

var mainPaperBtn = document.getElementById("mainlayer");

mainPaperBtn.onclick = function(){
	exportPaper(project.activeLayer.name);
	activatePaper('mainlayer');
}

newPaperHandler();

//--- 4. control layers

$(document).ready(function($)
{
	 $('#back-btn').click( function()
	 {
		 if(project.activeLayer != project.layers[0])
		 {
			 exportPaper(project.activeLayer.name);
			 
			 // back to main paper ]]
			 activatePaper('mainlayer');

			 // hide back btn
			 $(document).ready(function($){
				 $("#back-btn").css('visibility', 'hidden')
			 });
		 }
	 });
	 var lastlen;
	 // clear paper 
	 $('#clear-btn').click( function()
	 {
		 if(project.activeLayer.name != 'mainlayer')
		 {
			var len = project.activeLayer.children.length;
			removedArray.push(project.activeLayer.removeChildren(3,len)); // exclude 
			lastlen = project.activeLayer.children.length;

		 }
	 });

	 // remove last path 
	 $('#undo-btn').click( function()
	 {
		 if(project.activeLayer.name != 'mainlayer')
		 {
			var len = project.activeLayer.children.length;
			if(len > 3)
			{
				removedArray.push(project.activeLayer.removeChildren(len-1,len));
				lastlen = project.activeLayer.children.length;

			}
		 }
	 });

		// remove last path 
		$('#redo-btn').click( function()
		{
			if(project.activeLayer.name != 'mainlayer')
			{
				var len = project.activeLayer.children.length;

				if(len == lastlen) 
				{
					project.activeLayer.addChildren(removedArray.pop());
					lastlen = project.activeLayer.children.length;
				}
				else{
					removedArray = [];
				}
				
			}
		});
});


/*------------------------------- METHODS -----------------------------------*/

/*---------------------------- CREATE THE GRID ------------------------------*/

//--- draw main grid
function drawGrid()
{
	// group all grid's circles
	var gridGroup = new Group();
	gridGroup.name = 'grid'; 

	//dimensions of grid 
	var rows = 12; 
	var cols = 31;

	// center coordinates of any circle
	var x;
	var y;

	// radius if any circle on the grid
	var radius = 13;

	// initial color of circles
	var fillColor   = 'white'; 

	// distance between center coordinates
	var xspacing = 35;
	var yspacing = 55;

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
			newCircle.name = 'c'+row+col;
			bindGC(newCircle); // handle mouse events 

			// add it to the grid group
			gridGroup.addChild(newCircle);
		}
	}

	// notday.forEach(function(value){
	// 	gridGroup.children[value].visible  = false;
	// })

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
}

//--- handle mouse events on the grid
function bindGC(newCircle) //bind grid circle
{
	// var cirInd = newCircle.index+1;
	// var day = cirInd%31

	newCircle.onMouseDown = function (event) {
		if(currentMood)
		{
			this.fillColor = currentMood;
			currentMood = '';
			exportPaper('mainlayer');
		}
	}

	newCircle.onDoubleClick = function (event){
		activeCircleName = this.name;
		
		if(!check_path(activeCircleName))
		{
			createNewPaper(activeCircleName);
		}
		else
		{
			// already loaded 
			if(!project.layers[activeCircleName])
			{
				project.activeLayer.visible = false;
				importPaper(activeCircleName);
			}
		}
		activatePaper(activeCircleName);	

		$(document).ready(function($){
			$("#back-btn").css('visibility', 'visible')
		});

	}

	newCircle.onMouseEnter = function (event){		
		this.fillColor.alpha = 0.8;
	}

	newCircle.onMouseLeave = function (event){
		this.fillColor.alpha = 1;
		$(".statustext").css('visibility', 'hidden')
	}
	
}

/*---------------------- COLORS AND CONTROL BOX -----------------------------*/

function createColorBox(xSt,ySt,ySpace,r, colorList) 
{
	// group all grid's circles
	var colorsGroup = new Group();
	colorsGroup.name = 'colors-group'; 

	// for custom colors 
	var cornerSize = new Size(10, 10);
	var rect = new Shape.Rectangle(new Point(15,550), new Size(30,30),cornerSize	);
	rect.fillColor = paintColor;
	colorsGroup.addChild(rect);

	rect.onMouseDown = function()
	{
	$('#picker').trigger('click');
	};

	$('#picker').change(function(){
		paintColor = $('#picker').val();
		rect.fillColor = paintColor;
	});
	
	// fixed colors 
	for(var i= 0; i < 8; i++)
	{
		var newColor = new Path.Circle(new Point(xSt,ySt+ySpace*i), r);
		newColor.fillColor = colorList[i];
		colorsGroup.addChild(newColor);

		newColor.onMouseDown = function(){
			paintColor = this.fillColor;
			rect.fillColor = paintColor;
		}
	}

	return colorsGroup;
}

/*------------------------ CREATE AND HANDLE PAPERS -------------------------*/

function newPaperHandler() 
{
	// reference to papers(menu) btn
	var paperMenu = document.getElementsByClassName("dropdown-content");
	 //reference to New Paper btn
	var addPaperButton = document.getElementById("addPaper-btn");
	
	// onclick: create new paper and adds it to menu
	addPaperButton.onclick =  function() {
		exportPaper(project.activeLayer.name);

		$('.inputBox').css('visibility','visible');
		$('.userInput').attr("placeholder", "Type paper name (enter)");
		$('.userInput').focus();
	}

		// To read user input of paper name
	$(".userInput").keypress(function (e) {	
		var paperName;
	
		if (e.keyCode == 13) 
		{	
			var paperNumber = paperCount;
			paperNumber++;
			var buttonName  = $('.userInput').val();
			if(buttonName == '')
			{
				buttonName = 'Paper ' + paperNumber;
			}
			paperName = 'paper_'+ paperNumber; //paper/layer name(identifier)
	
			// create new entry
			var newPaperBtn = document.createElement("button");
			newPaperBtn.appendChild(document.createTextNode(buttonName)); 
			newPaperBtn.id = paperName; 
			
			//link each button to its paper 
			newPaperBtn.onclick = function()
			{
				exportPaper(project.activeLayer.name);
				activatePaper(paperName);	
				$("#back-btn").css('visibility', 'visible')
			};
	
			$(".dropdown-content").append(newPaperBtn);
			
			createNewPaper(paperName);
			exportPaper(project.activeLayer.name);


			var buttonsDate;

			if(check_path('buttonConfig'))
			{
				var configObj = store.getJSON('buttonConfig');
				if(configObj['titles'])
				{
					// silly way to add new element to json object (titles)
					var currentTitles = [configObj['titles']];
					currentTitles = currentTitles.join(",");
					currentTitles = currentTitles.split(",");
					currentTitles.push(buttonName);

					buttonsDate = {
						count: paperNumber,
						titles: currentTitles
					};
				}
			}
			else{
				buttonsDate = {
					count: paperNumber,
					titles: [buttonName]
				};
			}
			store.save('buttonConfig',buttonsDate)

			$('.userInput').val('');
			$('.inputBox').css('visibility','hidden'); 
	
			$("#back-btn").css('visibility', 'visible');
			$('#clear-btn').css('visibility','visible');
			$('#undo-btn').css('visibility','visible');
			$('#redo-btn').css('visibility','visible');	
		}
	});
}


//--- Create new paper as a new layer
function createNewPaper(layName)
{
	var activeLayer = project.activeLayer;
	activeLayer.visible = false;
	var newLayer = new Layer();
	newLayer.name = layName;

	paperCount++;
	var colors = ['white', 'blue', 'grey', 'tomato', 'yellow', 'green',  '#8806CE', ];	
	createColorBox(30, 200 , 50, 15, colors);

	drawLine(15,535,30); //bottom line
	drawLine(15,165,30); //top line
}

//--- activate selected paper
function activatePaper(paperName)
{	
	var currentLayer = project.activeLayer;
	if(currentLayer != project.layers[paperName])
	{
		currentLayer.visible = false;
		project.layers[paperName].activate();
		project.layers[paperName].visible = true;
	}
	else
	{
		currentLayer.visible = true;
	}

	if(paperName != 'mainlayer')
	{
		$('#clear-btn').css('visibility','visible');
		$('#undo-btn').css('visibility','visible');
		$('#redo-btn').css('visibility','visible');

	}
	else
	{
		$('#clear-btn').css('visibility','hidden');
		$('#undo-btn').css('visibility','hidden');
		$('#redo-btn').css('visibility','hidden');

	}
}

/*------------------------------- LOAD MOODS --------------------------------*/

function loadMoods(){
	//  mood shaping
	var moodX			 = 1400;
	var moodY 		 = 180;
	var moodYSpace = 100;
	var moodR	  	 = 18;

	// load moods
	createMood(moodX,moodY+moodYSpace*0,moodR,'Sleepy',				  	'#4d81ea');
	createMood(moodX,moodY+moodYSpace*1,moodR,'tired,lazy','yellow' );
	createMood(moodX,moodY+moodYSpace*2,moodR,'happy,joyful',    '#FF2052');
	createMood(moodX,moodY+moodYSpace*3,moodR,'productive', 	    '#8806CE');
	createMood(moodX,moodY+moodYSpace*4,moodR,'angry,anxious',   '#66FF00');
}

function createMood(x, y, r, moodlist, color)
{

	var newPoint   = new Point(x,y);
	var moodCircle = new Path.Circle(newPoint, r);
	moodCircle.fillColor = color;
	moodGroup.addChild(moodCircle);

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


/*------------------------------- MOUSE EVENTS ------------------------------*/

function onMouseDown(event) 
{
	if(event.point.x > 80)
	{
		if(project.activeLayer != project.layers[0])
		{	
			path  = new Path()

			if(paintColor)
			{
				path.strokeColor = paintColor;
			}
			else{
				path.strokeColor = 'white';
			}
			path.strokeWidth = 8;
			// path.fullySelected = true;
		}
	}
}

function onMouseDrag(event) 
{
	if(event.point.x > 80)
	{
		if(project.activeLayer != project.layers[0])
		{
			path.add(event.point);
		}
	}	
}

function onMouseUp(event) 
{
	if(project.activeLayer != project.layers[0] && path)
	{	
		// path.selected = false;
		// path.smooth();
		// path.remove(path.length-1);
	}
}

/*-------------------------- STORE AND RESTORE ------------------------------*/

//-- Export paper 
function exportPaper(paperName)
{
	store.exportedJSON = project.layers[paperName].exportJSON()
	store.save(paperName);
}

var importedGrid   = new Group();
var importedMood   = new Group(); 
var importedcolors = new Group(); 

//-- Import paper
function importPaper(paperName)
{

	var importedJSON = store.getJSON(paperName);
	if(importedJSON)
	{
		project.importJSON(importedJSON);

		if(paperName == 'mainlayer')
		{
			// extract groups  
			importedGrid = project.activeLayer.children['grid'];
			importedMood = project.activeLayer.children['mood-group'];

			// bind mouse events to grid
			if(importedGrid)
			{
				importedGrid.children.forEach(function(item){
					bindGC(item); //**** TIME ISSUE? ***//
				});
			}

			// bind mouse events to moods
			if(importedMood)
			{
				importedMood.children.forEach(function(item){
					
					item.onMouseDown = function (event)
					{
						currentMood 	= this.fillColor;
						
					};
				});
			}
		}
		else{
			importedcolors = project.activeLayer.children['colors-group'];

			// bind mouse events to color box
			if(importedcolors)
			{
				importedcolors.children.forEach(function(item){
					
					item.onMouseDown = function (event)
					{
						paintColor 	= this.fillColor;	
					};
				});
			}
		}
	  view.update();
	}
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