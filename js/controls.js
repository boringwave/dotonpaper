(() => {
  const remote = require('electron').remote;
  const $ = require('jquery');

  // initialize behaviour of some HTML elements
  function init() {
    const bgColors =
        ['#232323', '#3f3d3f', '#a092b2', '#52be80', '#383e5f', '#1f1f1f'];

    let colorId = 0;

    $('#min-btn').on('click', (e) => {
      const window = remote.getCurrentWindow();
      window.minimize();
    });

    $('#close-btn').on('click', (e) => {
      const window = remote.getCurrentWindow();
      window.close();
    });

    $('#theme-toggle').on('click', (e) => {
      if (colorId > 5) colorId = 0;

      $('html').css({background: bgColors[colorId]});
      $('body').css({background: bgColors[colorId]});
      colorId++;
    });

    $('#dot').on('click', (event) => {
      $('#picker').trigger('click');
    });

    $('#picker').on('change', () => {
      $('#dot').css('backgroundColor', $('#picker').val());
    });

    // When the user clicks on (x), close the window
    $('#close').on('click', () => {$('.customMood').css('display', 'none')});

    window.onclick = (event) => {
      if (event.target == $('#customMood')[0]) {
        $('.customMood').css('display', 'none')
      }
    };
    //-- capture canvas
    $('#export-btn').on('click', (event) => {
      var background_color = $('body').css('backgroundColor');

      let dataURL = canvas2Image(background_color);

      let element = document.createElement('a');
      element.setAttribute('href', dataURL);
      element.setAttribute('download', 'paper.png');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    });
  }

  // author: github:@mikechambers
  function canvas2Image(background_color) {
    let myCanvas = $('#myCanvas')[0];
    const context = myCanvas.getContext('2d');

    let w = myCanvas.width;
    let h = myCanvas.height;

    // get the current ImageData for the canvas.
    let data = context.getImageData(0, 0, w, h);

    // store the current globalCompositeOperation
    var compositeOperation = context.globalCompositeOperation;

    // set to draw behind current content
    context.globalCompositeOperation = 'destination-over';

    // set background color
    context.fillStyle = background_color;

    // draw background / rect on entire canvas
    context.fillRect(0, 0, w, h);

    // get the image data from the canvas
    let dataURL = myCanvas.toDataURL('image/png');

    // clear the canvas
    context.clearRect(0, 0, w, h);

    // restore it with original / cached ImageData
    context.putImageData(data, 0, 0);

    // reset the globalCompositeOperation to what it was
    context.globalCompositeOperation = compositeOperation;

    return dataURL;
  }

  $(document).ready(function($) {
    init();
  });
})();