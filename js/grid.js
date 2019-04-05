// "use strict";
/*jshint esversion: 6 */

/*-------------------------------- DATE -------------------------------------*/

// Today's date
var today = new Date();
var currentDay   = today.getDate();
var currentMonth = today.getMonth() + 1;    // January is 0!
var currentYear  = today.getFullYear();

var currentDayIndex = (currentMonth-1) * 31 + currentDay;

var fullDate = currentDay + '-' + currentMonth + '-' + currentYear
// var fullDate = [currentDay, currentMonth, currentYear];

// not-exist days indices x`x`
// var days   = [2*29,2*30,2*31,4*31,6*31,9*31,11*31];
var xdays  = [59,60,61,123,185,278,340]
var notday = new Set(xdays);

/*-------------------------------- GLOBALS ----------------------------------*/

// store object to store/restore papers 
var store = new Store();

// center coordinates of first circle
var xstart = 100;
var ystart = 130;

// selected mood 
var currentMood;

// stats log
var currentMoodId;
var mooodStats = [0, 0, 0, 0, 0];

// group all moods circles 
var moodGroup = new Group();
moodGroup.name = 'mood-group';

// group all moods names  
var moodNameGroup 	= new Group();
moodNameGroup.name  = 'moodNames-group';

// track the current active paper
var activeCircleName; 

// drawing path
var path;

// tool.minDistance = 10;
// tool.maxDistance = 20;

// how many papers 
var paperCount = 0; 

// selected paint color
var paintColor;

// maintain removed objects
var removedArray = [];

var paths = [];

var rect;

var daysGroup = new Group();
var monsGroup = new Group();

daysGroup.name = 'daysGroup';
monsGroup.name = 'monsGroup';

/*----------------------- CREATE/RESTORE/INITIALIZATION ---------------------*/

//--- 1. initialize/restore grid(main layer)
if(!check_path('mainlayer'))
{
	//-- initiaize
	drawGrid(); 
	loadMoods();
	project.layers[0].name = 'mainlayer';
}
else{
	//-- restore previous data 
	project.clear();
	importPaper('mainlayer');
}

//--- 4. control layers

$(document).ready(function($)
{
	 $('#back-btn').click(function()
	 {
			if(project.activeLayer != project.layers['mainlayer'])
			{
				exportPaper(project.activeLayer.name); 
				activatePaper('mainlayer');
			}
	 });

	 var lastlen;
	 // clear paper 
	 $('#clear-btn').click( function()
	 {
		 if(project.activeLayer.name != 'mainlayer')
		 {	
			var len = paths.length;
			paths.forEach(function(item){
				project.activeLayer.removeChildren(1,item.id)
			});
			removedArray.push(paths); // exclude 1st child (color box)
			lastlen = paths.length;
		 }
	 });

	 // remove last path 
	 $('#undo-btn').click( function()
	 {
		 if(project.activeLayer.name != 'mainlayer')
		 {
			var len = project.activeLayer.children.length;
			if(len > 1)
			{
				removedArray.push(project.activeLayer.removeChildren(len-1,len));
				lastlen = project.activeLayer.children.length;

			}
		 }
	 });

	// re-add last path 
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
			else {
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
	// group all grid circles
	var gridGroup = new Group();
	gridGroup.name = 'grid'; 

	//dimensions of the grid 
	var rows = 12; 
	var cols = 31;

	// center coordinates of any circle
	var x;
	var y;

	// radius if any circle on the grid
	var radius = 10;

	// initial color of circles
	var fillColor = 'white'; 

	// distance between center coordinates
	var xspacing = 25;
	var yspacing = 30;


	//---- Create grid of circles
	for(var row = 1; row <= rows; row++)
	{
		y = ystart + (row - 1) * yspacing;

		for(var col = 1; col <= cols; col++) 
		{
			x = xstart + (col - 1) * xspacing;
			
			var newPoint = new Point(x,y);
			// create new circle 
			var newCircle = new Path.Circle(newPoint, radius);
			// var newCircle = new Path.Rectangle(x,y,radius*2,radius*2);	

			newCircle.fillColor = fillColor;
			// newCircle.name 		= 'c'+row+col;
			newCircle.name 		= [row,col]; // [mon, day]
			
			gridGroup.addChild(newCircle); // add it to the grid group

			// exclude non days (ex. 28 feb, 29 feb, ect)
			bindEvent(newCircle); // handle mouse events 
		}
	}

	//--- days counter
	for(var col = 0; col < 31; col++)
	{
		var day = new PointText(new Point(xstart+ col*xspacing, ystart-radius-20));
		day.content = col+1;
		day.style = {
				fontFamily: 'Courier New',
				fontSize: 17,
				fillColor: 'White',
				justification: 'center'
		};
		daysGroup.addChild(day);
	}

	var monthsL = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep','oct','nov', 'dec'];

	//--- months list 
	for(var col = 0; col < 12; col++)
	{
		var mon = new PointText(new Point(xstart-radius-40, ystart+ col*yspacing));
		mon.content = monthsL[col];
		mon.style = {
				fontFamily: 'Courier New',
				fontSize: 18,
				fillColor: 'white',
				justification: 'center'
		};
		monsGroup.addChild(mon);
	}

}

//--- Create new paper as a new layer
function createNewPaper(layName)
{
	var activeLayer = project.activeLayer;
	activeLayer.visible = false;

	var newLayer = new Layer();
	newLayer.name = layName;
	paperCount++;

	var colors = ['white', 'blue', 'grey', 'tomato', 'yellow', '#9cde55',  '#8806CE', ];	
	createColorBox(30, 100 , 40, 12, colors);
}

//--- handle mouse events on the grid
function bindEvent(newCircle) //bind grid circle
{
	if(!notday.has(newCircle.index) && newCircle.index+1 <= currentDayIndex  )
	{
		newCircle.onMouseDown = function (event) 
		{
			if(currentMood) 
			{	
				mooodStats[currentMoodId] = mooodStats[currentMoodId] + 1;
				this.fillColor = currentMood;
				currentMood = '';
				exportPaper('mainlayer');
			}
		}

		newCircle.onDoubleClick = function (event)
		{
			activeCircleName = this.name;

			if(!check_path(activeCircleName))
			{
				createNewPaper(activeCircleName);
			}
			else
			{
				if(!project.layers[activeCircleName]) // if not already loaded 
				{
					project.activeLayer.visible = false;
					importPaper(activeCircleName);
				}
			}
			activatePaper(activeCircleName);	

			if(this.fillColor != 'white')
			{
				paintColor = this.fillColor;
				rect.fillColor = paintColor;
			}
		}

		newCircle.onMouseEnter = function (event)
		{		
			this.fillColor.alpha = 0.8;
			
			monsGroup.children[this.name[0]-1].fillColor = 'red';
			daysGroup.children[this.name[1]-1].fillColor = 'red';
			// monsGroup.children[this.name[0]-1].fontSize  =  18;
			// daysGroup.children[this.name[1]-1].fontSize  =  18;
		}

		newCircle.onMouseLeave = function (event)
		{
			this.fillColor.alpha = 1;
	
			monsGroup.children[this.name[0]-1].fillColor = 'white';
			daysGroup.children[this.name[1]-1].fillColor = 'white';
			exportPaper('mainlayer');

			// monsGroup.children[this.name[0]-1].fontSize  =  20;
			// daysGroup.children[this.name[1]-1].fontSize  =  17;
		}
	}
	
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
		$("#back-btn").css('visibility', 'visible')
		$("#myCanvas").css('cursor', 'crosshair')

	}
	else
	{
		$('#clear-btn').css('visibility','hidden');
		$('#undo-btn').css('visibility','hidden');
		$('#redo-btn').css('visibility','hidden');
		$("#back-btn").css('visibility', 'hidden');
		$("#myCanvas").css('cursor', 'default')

	}
}

/*------------------------------- LOAD MOODS --------------------------------*/

var userInputMood = '';

function loadMoods(){
	//  mood shaping
	var moodX	   = 890;
	var moodY 	   = 180;
	var moodYSpace = 50;
	var moodR	   = 10;

	// load moods
	createMood(moodX,moodY+moodYSpace*0,moodR,'sleepy',	      '#4d81ea');
	createMood(moodX,moodY+moodYSpace*1,moodR,'tired,lazy',   'yellow' );
	createMood(moodX,moodY+moodYSpace*2,moodR,'happy,joyful', '#FF2052');
	createMood(moodX,moodY+moodYSpace*3,moodR,'productive',   '#8806CE');
	createMood(moodX,moodY+moodYSpace*4,moodR,'angry,anxious','#66FF00');
}

function createMood(x, y, r, moodlist, color)
{
	var newPoint   = new Point(x,y);
	var moodCircle = new Path.Circle(newPoint, r);
	
	moodCircle.fillColor = color;
	moodGroup.addChild(moodCircle);

	moodCircle.onMouseDown = function (event){
		currentMood = this.fillColor;		
		currentMoodId = this.index;
	}


	var newtext = new PointText(new Point(x+15,y+5));

	newtext.content = moodlist;
	newtext.style = {
			fontFamily: 'Courier New',
			fontSize: 20,
			fillColor: 'White',
			justification: 'left'
	};
	moodNameGroup.addChild(newtext);

	newtext.onDoubleClick = function (event)
	{	
		$('.customMood').css('display','block')

		var currentMoodColor = moodGroup.children[newtext.index].fillColor.toCSS(1);
		$('#picker').val(currentMoodColor)
		$('#inputMood').attr("placeholder", newtext.content).focus()
		$('#dot').css('backgroundColor',$('#picker').val());

		// reference to save-btn 
		var saveBtn = document.getElementById('save-btn'); 
		saveBtn.onclick = function(event)
		{
			userInputMood = $('#inputMood').val();
			if (userInputMood != null && userInputMood != '')
			{
				$('.customMood').css('display','none')
				$('#inputMood').val('')
				newtext.content = userInputMood;
				moodGroup.children[newtext.index].fillColor = $('#picker').val();
			}
			if(currentMoodColor != $('#picker').val() )
			{
				moodGroup.children[newtext.index].fillColor = $('#picker').val();
				$('.customMood').css('display','none')
			}
			
		};

		$('#dot').click ( function(event)
		{
			$('#picker').trigger('click');
		});
			
		$('#picker').change(function(){
			$('#dot').css('backgroundColor', $('#picker').val());
		});
	}

}

// When the user clicks on (x), close the window
$(".close" ).click(function() {
	userInputMood = $('#inputMood').val();
	if (userInputMood != null && userInputMood != '')
	{
		if (confirm("you sure?")) 
			{
				$('.customMood').css('display','none')
			} 
	}
	else
	$('.customMood').css('display','none')

  });

// When the user clicks anywhere outside
var cutomMoodWindow = document.getElementById('customMood');
var picker = document.getElementById('picker'); 

window.onclick = function(event) {
    if (event.target == cutomMoodWindow) {
		$('.customMood').css('display','none')
	}
}

/*---------------------- COLORS AND CONTROL BOX -----------------------------*/

function createColorBox(xSt,ySt,ySpace,r, colorList) 
{
	// group all grid's circles
	var colorsGroup = new Group();
	colorsGroup.name = 'colors-group'; 

	// for custom colors 
	var cornerSize = new Size(5,5);

	rect = new Shape.Rectangle(new Point(xSt-r,370), new Size(2*r,2*r),cornerSize);
	rect.name = 'rect';
	
	if(paintColor)
	{
		rect.fillColor = paintColor;
	}	
	else
	{
		paintColor     = 'white';
		rect.fillColor = paintColor;
	}

	colorsGroup.addChild(rect);

	rect.onMouseDown = function()
	{
		$('#picker').trigger('click');
		path = '';

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

		newColor.onMouseDown = function()
		{
			paintColor 	   = this.fillColor;
			rect.fillColor = paintColor;
		}
	}
	return colorsGroup;
}

/*------------------------------- MOUSE EVENTS ------------------------------*/
var w = 2;
var textarea;
var textnote = '';
var textpoint;
var textarea;

var keys = new Set(['shift', 'control', 'alt', 'meta', 'caps-lock', 'left', 'up', 'right', 
					'down', 'escape', 'delete', 'tab','num-lock', 'page-up', 'page-down', 'end', 'home','insert'])

function onMouseDown(event) 
{
	if(project.activeLayer != project.layers['mainlayer'] && event.point.x > 50) 
	{	
		if(Key.isDown('shift')) 
		{
			if(!(textarea && textarea.contains(event.point)))
			{
				textnote = '';
				textarea = new PointText({
							point: event.point,
							content: 'text',
							justification: 'center',
							fontSize: 20,
							strokeColor: paintColor,
							fontFamily: 'Courier New'
						});

				textarea.onMouseDrag = function(event)
				{
					if(Key.isDown('shift'))
					{
						textarea.position += event.delta;
					}
				}
			}

		}
		else
		{
			textarea = '';
			path  = new Path()
			path.strokeJoin = 'round'
			path.strokeColor = paintColor;
			path.strokeWidth = w;
		}

	}
}

tool.onKeyDown = function(event)
{
	if(project.activeLayer != project.layers['mainlayer'])
	{
		if(textarea)
		{
			if(event.key == 'enter')
				textarea  = ''; 
			else if (event.key == 'space')
				textnote += ' ';
			else if (event.key == 'backspace')
				textnote = textnote.slice(0,textnote.length-1);
			else if(keys.has(event.key))
				textnote += '';
			else
				textnote += event.key;
			
			textarea.content = textnote;
		}
		else
		{
			if (event.key == 'e' ) 
			{
				if(w < 50)
					w = w + 2;
				return false; 				// Prevent the key event from bubbling
			}
			if (event.key == 'q' ) 
			{
				if(w >= 4)
					w = w-2;
				return false;
			}
			if (event.key == 'd' ) 
			{
				path.translate(15,0);
				return false;
			}
			if (event.key == 'a' ) 
			{
				path.translate(-15,0);
				return false;
			}
			if (event.key == 'w' ) 
			{
				path.translate(0,-15);
				return false;
			}
			if (event.key == 's' ) 
			{
				path.translate(0,+15);
				return false;
			}
			if (event.key == 'up' ) 
			{	
				path.scale(1.1);
				return false;
			}
			if (event.key == 'down' ) 
			{
				path.scale(0.9);
				return false;
			}
		}
	}
}

function onMouseDrag(event) 
{
	if(event.point.x > 70 && !Key.isDown('shift') && project.activeLayer != project.layers['mainlayer'])
		path.add(event.point);			
}

function onMouseUp(event) 
{
	if(project.activeLayer != project.layers['mainlayer'] && path)
	{	
		paths.push(path);
		exportPaper(project.activeLayer.name);	
	}
}

/*-------------------------- Export AND Import methods ------------------------------*/

//-- Import paper
function importPaper(paperName)
{
	var importedGrid   = new Group();
	var importedMood   = new Group(); 
	var importedcolors = new Group(); 

	var importedJSON   = store.getJSON(paperName);
	
	if(importedJSON)
	{
		project.importJSON(importedJSON);

		monsGroup = project.activeLayer.children['monsGroup'];
		daysGroup = project.activeLayer.children['daysGroup'];

		if(paperName == 'mainlayer')
		{
			// extract groups  
			importedGrid = project.activeLayer.children['grid'];
			importedMood = project.activeLayer.children['mood-group'];

			// bind mouse events to grid
			if(importedGrid)
			{
				importedGrid.children.forEach(function(item){
					bindEvent(item); //**** TIME ISSUE? ***//
				});
			}

			// bind mouse events to moods [circles]
			if(importedMood)
			{
				importedMood.children.forEach(function(item){
					
					item.onMouseDown = function (event)
					{
						currentMood  = this.fillColor;
					};
				});
			}
		}
		else
		{
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

				importedcolors.children[0].onMouseDown = function(event)
				{
					$('#picker').trigger('click');
					path = '';
				};

				$('#picker').change(function(){
					paintColor = $('#picker').val();
					importedcolors.children[0].fillColor = paintColor;
				});
				
			}
		}
	  view.update();
	}
}

//-- Export paper 
function exportPaper(paperName)
{
	store.exportedJSON = project.layers[paperName].exportJSON()
	store.save(paperName);
}
