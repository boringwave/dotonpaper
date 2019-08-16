'use strict';

const Store = require('./js/store')
const Paper = require('paper')
const $ = require('jquery')
const Remote = require('electron').remote;

// not-exist days indices
let NotDay = new Set([59, 60, 61, 123, 185, 278, 340]);
// store object to store/restore papers
let store = new Store();
/*
                           WINDOW SIZE (WS)
         _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
        |                                                     |
        |                                                     |
    W   |                  CONTENT SIZE (CS)                  |
    I   |         _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _         |
    N   |        |   |                     |         |        |
    D   |        |   |                     |         |        |
    O   |        |   |                     |         |        |
    W   |        |   |                     |         |        |
        |        |10%|      60% of CS      |   30%   |        |
    H   |        |   |                     |         |        |
    E   |        |   |                     |         |        |
    I   |        |   |                     |         |        |
    G   |        |   |                     |         |        |
    H   |        |   |                     |         |        |
    T   |        |_ _|_ _ _ _ _ _ _ _ _ _ _|_ _ _ _ _|        |
        |                                                     |
        |                                                     |
        |_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _|
*/

// window size
let [WindowWidth, WindowHeight] = Remote.getCurrentWindow().getSize()
// grid area
let GridWidth = 1050;
let GridHeight = 350;
// center coordinates of top-left circle (ie. grid origin)
let XStart;
let YStart;
// selected mood
let CurrentMood;
// drawing path
let DrawPath;
// selected paint color
let paintColor;
// reference to the custom color selector
let ColorSelector;

// modes
let TextMode = false;
let PaintMode = true;

//-- setup Paper scope and initialize
Paper.install(window);
$(document).ready(function($) {
  let content_element = document.getElementById('content')
  myCanvas.width = content_element.offsetWidth
  myCanvas.height = content_element.offsetHeight

  XStart = (myCanvas.width - GridWidth) / 2;
  YStart = (myCanvas.height - GridHeight) / 2;

  Paper.setup('myCanvas');
  // const project = Paper.project;
  const tool = new Tool();

  $('#text-mode').on('click', (e) => {
    TextMode = !TextMode;
    PaintMode = false
    $('#myCanvas').css('cursor', 'text');
  });
  $('#paint-mode').on('click', (e) => {
    TextMode = false;
    PaintMode = !PaintMode
  });


  init();
  handleEvents();
});

//-- initialize/restore layers [g: store-]
function init() {
  let last_len;

  // maintain removed objects
  let deleted_paths = [];

  if (!store.check_path('mainlayer')) {
    //-- initiaize
    project.clear();
    project.activeLayer.name = 'mainlayer';

    drawMonthLabels(XStart, YStart, 30);
    drawDaysLabels(XStart + 50, YStart - 5, 25);
    drawGrid(XStart + 50, YStart, 10, 25, 30);
    loadMoods(XStart + 850, YStart + 50, 50, 10);
  } else {
    //-- restore previous data
    project.clear();
    importPaper('mainlayer');
  }

  $('#back-btn').click(function() {
    if (project.activeLayer != project.layers['mainlayer']) {
      exportPaper(project.activeLayer.name);
      activatePaper('mainlayer');
    }
  });

  // clear Paper
  $('#clear-btn').click(function() {
    if (project.activeLayer.name != 'mainlayer') {
      deleted_paths = [];
      let len = project.activeLayer.children.length;
      deleted_paths.push(project.activeLayer.removeChildren(3, len));
      last_len = project.activeLayer.children.length;
    }
  });

  // remove last DrawPath
  $('#undo-btn').click(function() {
    if (project.activeLayer.name != 'mainlayer') {
      let len = project.activeLayer.children.length;
      if (len > 1) {
        deleted_paths.push(project.activeLayer.removeChildren(len - 1, len));
        last_len = project.activeLayer.children.length;
      }
    }
  });

  // re-add last DrawPath
  $('#redo-btn').click(function() {
    if (project.activeLayer.name != 'mainlayer') {
      let len = project.activeLayer.children.length;
      if (len == last_len)  // no paths added after last removal
      {
        project.activeLayer.addChildren(deleted_paths.pop());
        last_len = project.activeLayer.children.length;
      } else
        deleted_paths = [];
    }
  });
}

//-- add months/days labels
function drawMonthLabels(x_start, y_start, y_spacing) {
  let mon_group = new Group();
  mon_group.name = 'mon-group';

  const MONTHS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov',
    'dec'
  ];

  //--- create text field for each month
  for (let col = 0; col < 12; col++) {
    let y = y_start + col * y_spacing + 4;

    let mon = new PointText(new Point(x_start, y));
    mon.content = MONTHS[col];
    mon.style = {
      fontFamily: 'Courier New',
      fontSize: 18,
      fillColor: 'white',
      justification: 'center'
    };
    mon_group.addChild(mon);
  }
}
function drawDaysLabels(x_start, y_start, x_spacing) {
  let days_group = new Group();
  days_group.name = 'days-group';

  //--- days counter
  for (let col = 0; col < 31; col++) {
    let x = x_start + col * x_spacing;

    let day = new PointText(new Point(x, y_start - 25));
    day.content = col + 1;
    day.style = {
      fontFamily: 'Courier New',
      fontSize: 17,
      fillColor: 'White',
      justification: 'center'
    };
    days_group.addChild(day);
  }
}

//--- draw main grid
function drawGrid(x_start, y_start, radius, x_spacing, y_spacing) {
  // group all grid circles
  let grid_group = new Group();
  grid_group.name = 'grid';

  // dimensions of the grid
  let rows = 12;
  let cols = 31;
  // initial color of circles
  let fill_color = 'white';

  // create grid of circles
  for (let row = 1; row <= rows; row++) {
    let y = y_start + (row - 1) * y_spacing;

    for (let col = 1; col <= cols; col++) {
      let x = x_start + (col - 1) * x_spacing;

      let point = new Point(x, y);

      // create new circle
      let new_circle = new Path.Circle(point, radius);
      // let new_circle = new Path.Rectangle(x,y,radius*2,radius*2);

      new_circle.fillColor = fill_color;
      new_circle.name = [row, col];  // [mon, day]

      grid_group.addChild(new_circle);  // add it to the grid group

      // exclude non days (ex. 28 feb, 29 feb, ect)
      bindEvent(new_circle);  // handle mouse events
    }
  }
}

//-- bind events to the grid [g: CurrentMood-paintcolor-ColorSelector]
function bindEvent(new_circle) {
  if (!NotDay.has(
          new_circle.index) /*&& new_circle.index+1 <= currentDayIndex*/) {
    let mon_group = project.layers['mainlayer'].children['mon-group'];
    let days_group = project.layers['mainlayer'].children['days-group'];

    new_circle.onMouseDown =
        function(event) {
      if (CurrentMood) {
        this.fillColor = CurrentMood;
        CurrentMood = '';

        mon_group.children[this.name[0] - 1].fillColor = 'white';
        days_group.children[this.name[1] - 1].fillColor = 'white';

        exportPaper('mainlayer');
      }
    }

        // open connected Paper layer
        new_circle.onDoubleClick =
            function(event) {
      let paper_name = this.name;

      // check if Paper is already created
      if (!store.check_path(paper_name))
        createNewPaper(paper_name);
      else {
        if (!project.layers[paper_name])  // if not already loaded
        {
          project.activeLayer.visible = false;
          importPaper(paper_name);
        }
      }

      activatePaper(paper_name);

      if (this.fillColor != 'white') {
        paintColor = this.fillColor;
        ColorSelector.fillColor = paintColor;
      }
    }

            new_circle.onMouseEnter =
                function(event) {
      this.fillColor.alpha = 0.8;

      mon_group.children[this.name[0] - 1].fillColor = 'red';
      days_group.children[this.name[1] - 1].fillColor = 'red';
    }

                new_circle.onMouseLeave = function(event) {
      this.fillColor.alpha = 1;

      mon_group.children[this.name[0] - 1].fillColor = 'white';
      days_group.children[this.name[1] - 1].fillColor = 'white';
    }
  }
}

//-- create a new layer/Paper
function createNewPaper(layer_name) {
  let x_start = 30;
  let y_start = 130;
  let y_spacing = 40;
  let radius = 12;

  project.activeLayer.visible = false;

  let new_layer = new Layer();
  new_layer.name = layer_name;

  createColorBox(x_start, y_start, y_spacing, radius);

  const MONTHS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov',
    'dec'
  ];

  let today = new Date();
  let year = today.getFullYear();
  let mon = layer_name[0];
  let day = layer_name[1];

  let date_text = new PointText(new Point(myCanvas.width - 150, 20));
  date_text.content = day + ' ' + MONTHS[mon - 1].toUpperCase() + ', ' + year;
  date_text.style = {
    fontFamily: 'Courier New',
    fontSize: 15,
    fillColor: 'White',
    justification: 'left'
  };

  // match the color with the mood color
  date_text.fillColor = project.layers['mainlayer']
                            .children['grid']
                            .children[layer_name]
                            .fillColor.toCSS(1);

  let from = new Point(myCanvas.width - 175, 30);
  let to = new Point(myCanvas.width - 25, 30);
  let line = new Path.Line(from, to);
  line.strokeColor = 'white';
  line.strokeWidth = 0.3;
}

//-- create box of predfined colors [:g ColorSelector-paintcolor-DrawPath-]
function createColorBox(x_st, y_st, y_space, r) {
  let color_list = [
    'white',
    '#0000ff',
    'grey',
    'tomato',
    'yellow',
    '#32cd32',
    '#8a2be2',
  ];

  // group all grid's circles
  let colorBox_group = new Group();
  colorBox_group.name = 'colors-group';

  // for custom colors
  let corner_size = new Size(5, 5);

  ColorSelector = new Shape.Rectangle(
      new Point(x_st - r, y_st + 5.5 * (r + y_space)), new Size(2 * r, 2 * r),
      corner_size);
  ColorSelector.name = 'ColorSelector';

  if (paintColor)
    ColorSelector.fillColor = paintColor;
  else {
    paintColor = 'white';
    ColorSelector.fillColor = paintColor;
  }

  colorBox_group.addChild(ColorSelector);

  ColorSelector.onMouseDown = function() {
    $('#picker').trigger('click');
    DrawPath = new Path();  // TOFIX
  };

  $('#picker').change(function() {
    paintColor = $('#picker').val();
    ColorSelector.fillColor = paintColor;
  });

  // fixed colors
  for (let i = 0; i < 8; i++) {
    let point = new Point(x_st, y_st + y_space * i);
    let new_color = new Path.Circle(point, r);

    new_color.fillColor = color_list[i];

    colorBox_group.addChild(new_color);

    new_color.onMouseDown = function() {
      paintColor = this.fillColor;
      ColorSelector.fillColor = paintColor;
    }
  }
}

//-- activate selected Paper
function activatePaper(paper_name) {
  let current_layer = project.activeLayer;

  if (current_layer != project.layers[paper_name]) {
    current_layer.visible = false;
    project.layers[paper_name].activate();
    project.layers[paper_name].visible = true;
  } else
    current_layer.visible = true;

  if (paper_name != 'mainlayer') {
    $('#clear-btn').css('visibility', 'visible');
    $('#undo-btn').css('visibility', 'visible');
    $('#redo-btn').css('visibility', 'visible');
    $('#back-btn').css('visibility', 'visible');
    $('#tools').css('visibility', 'visible');
    $('#myCanvas').css('cursor', 'crosshair');
  } else {
    $('#clear-btn').css('visibility', 'hidden');
    $('#undo-btn').css('visibility', 'hidden');
    $('#redo-btn').css('visibility', 'hidden');
    $('#back-btn').css('visibility', 'hidden');
    $('#tools').css('visibility', 'hidden');
    $('#myCanvas').css('cursor', 'default');
  }
}

//-- load all modes [g: YStart]
function loadMoods(x_start, y_start, y_spacing, radius) {
  let mood_group = new Group();
  let moodName_group = new Group();

  mood_group.name = 'mood-group';
  moodName_group.name = 'mood-names';

  let mood_groups = {colors: mood_group, names: moodName_group};

  let mood_names =
      [
        'overwhelmed', 'sleepy,lazy', 'happy,joyful', 'productive',
        'angry,anxious', 'sad'
      ]

      let mood_colors =
          [
            '#ffc40c',
            '#324ab2',
            '#FF2052',
            '#7e00b5',
            '#66FF00',
            '#b19cd9',
          ]

      for (let i = 0; i < mood_names.length; ++i) {
    createMood(
        x_start, y_start + y_spacing * i, radius, mood_names[i], mood_colors[i],
        mood_groups);
  }
}

//-- set moods
function createMood(x, y, r, mood_name, color, mood_groups) {
  let colors_group = mood_groups.colors;
  let names_group = mood_groups.names;

  let point = new Point(x, y);
  let mood_circle = new Path.Circle(point, r);

  mood_circle.fillColor = color;

  colors_group.addChild(mood_circle);

  let new_text = new PointText(new Point(x + 15, y + 5));
  new_text.content = mood_name;
  new_text.style = {
    fontFamily: 'Courier New',
    fontSize: 20,
    fillColor: 'White',
    justification: 'left'
  };

  names_group.addChild(new_text);

  bindMoodEvents(mood_circle, new_text);

  new_text.onDoubleClick = (event) => {
    $('.customMood').css('display', 'block')

    let current_color =
        colors_group.children[new_text.index].fillColor.toCSS(1);

    $('#picker').val(current_color)
    $('#inputMood').attr('placeholder', new_text.content).focus()
    $('#dot').css('backgroundColor', $('#picker').val());

    $('#save-btn')[0].onclick = (event) =>{
			let user_mood = $('#inputMood').val();

			if (user_mood != null && user_mood != '')
				new_text.content = user_mood;

			if(current_color != $('#picker').val())
			colors_group.children[new_text.index].fillColor = $('#picker').val();

			$('.customMood').css('display','none')
			$('#inputMood').val('')
		};
  }
}

//-- bind events to mood circles/text [g: CurrentMood]
function bindMoodEvents(mood_circle, mood_text) {
  if (mood_circle) {
    mood_circle.onMouseDown = function(event) {
      CurrentMood = this.fillColor;
    }
  }

  if (mood_text) {
    mood_text.onMouseDown = function(event) {
      CurrentMood = project.layers['mainlayer']
                        .children['mood-group']
                        .children[this.index]
                        .fillColor.toCSS(1);
    }
  }
}

//-- handle key and mouse events
function handleEvents() {
  let stroke_width = 2;
  let text_note = '';
  let text_area;

  let keys = new Set([
    'num-lock',
    'shift',
    'alt',
    'insert',
    'meta',
    'left',
    'caps-lock',
    'page-up',
    'down',
    'escape',
    'tab',
    'home',
    'page-down',
    'control',
    'end',
    'delete',
    'up',
    'right',
  ]);

  tool.onKeyDown = function(event) {
    if (project.activeLayer != project.layers['mainlayer']) {
      if (text_area) {
        if (event.key == 'enter') {
        } else if (event.key == 'space')
          text_note += ' ';
        else if (event.key == 'backspace')
          text_note = text_note.slice(0, text_note.length - 1);
        else if (keys.has(event.key))
          text_note += '';
        else
          text_note += event.key;

        text_area.content = text_note;
      } else {
        switch (event.key) {
          case 'e':
            if (stroke_width < 40) stroke_width += 2;
            break;

          case 'q':
            if (stroke_width >= 2) stroke_width = stroke_width - 2;
            break;

          case 'd':
            DrawPath.translate(15, 0);
            break;

          case 'a':
            DrawPath.translate(-15, 0);
            break;

          case 'w':
            DrawPath.translate(0, -15);
            break;

          case 's':
            DrawPath.translate(0, +15);
            break;

          case 'up':
            DrawPath.scale(1.1);
            break;

          case 'down':
            DrawPath.scale(0.9);
            break;
        }
      }
    }
  };

  tool.onMouseDown = (event) => {
    if (project.activeLayer != project.layers['mainlayer'] &&
        event.point.x > 50) {
      if (TextMode) {
        if (!(text_area && text_area.contains(event.point))) {
          text_note = '';
          text_area = new PointText({
            point: event.point,
            content: '',
            justification: 'left',
            fontSize: 20,
            strokeColor: paintColor,
            fontFamily: 'Courier New'
          });
        }
      } else {
        text_area = '';
        DrawPath = new Path()
        DrawPath.strokeJoin = 'round'
        DrawPath.strokeColor = paintColor;
        DrawPath.strokeWidth = stroke_width;
      }
    }
  };

  tool.onMouseDrag = (event) => {
    if (event.point.x > 65 && event.point.y > 35 && PaintMode &&
        project.activeLayer != project.layers['mainlayer'])
      DrawPath.add(event.point);
  };

  tool.onMouseUp = (event) => {
    if (project.activeLayer != project.layers['mainlayer'] && DrawPath) {
      exportPaper(project.activeLayer.name);
    }
  };
}

//-- Import Paper [g: paintColor]
function importPaper(paper_name) {
  let importedGrid = new Group();
  let importedMood = new Group();
  let importedcolors = new Group();
  let importedMoodNames = new Group();

  let importedJSON = store.getJSON(paper_name);

  if (importedJSON) {
    project.importJSON(importedJSON);

    if (paper_name == 'mainlayer') {
      // extract groups
      importedGrid = project.activeLayer.children['grid'];
      importedMood = project.activeLayer.children['mood-group'];
      importedMoodNames = project.activeLayer.children['mood-names'];

      // bind mouse events to grid
      if (importedGrid) {
        importedGrid.children.forEach(function(item) {
          bindEvent(item);
        });
      }

      // bind mouse events to moods [circles]
      if (importedMood) {
        importedMood.children.forEach(function(item) {
          bindMoodEvents(item);
        });
      }

      if (importedMoodNames) {
        importedMoodNames.children.forEach(function(item) {
          bindMoodEvents(0, item);
        });
      }
    } else {
      importedcolors = project.activeLayer.children['colors-group'];

      // bind mouse events to color box
      if (importedcolors) {
        importedcolors.children.forEach(function(item) {
          item.onMouseDown = function(event) {
            paintColor = this.fillColor;
          };
        });

        ColorSelector = importedcolors.children[0];

        ColorSelector.onMouseDown = function(event) {
          $('#picker').trigger('click');
        };

        $('#picker').change(function() {
          paintColor = $('#picker').val();
          importedcolors.children[0].fillColor = paintColor;
        });
      }
    }

    view.update();
  } else {
    console.log('Failed to load Paper %s', paper_name);  // TODO: -reset?-
  }
}

//-- Export Paper [g: store]
function exportPaper(paper_name) {
  store.exportedJSON = project.layers[paper_name].exportJSON()
  store.save(paper_name);
}
