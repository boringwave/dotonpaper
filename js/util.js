var isOpen = false;

$(document).ready(function($){
  $('#nav-btn').click(function(){
    if(!isOpen){
      openSide();
      isOpen = true;
    }
    else
    {
      closeSide();
      isOpen = false;
    }
  });

  // $('#side-nav').mouseleave(function(){
  //   setTimeout(function(){
  //     closeSide();
  //     isOpen = false; 
  //   },500);
  // }); 
});

function openSide(){
  $('#side-nav').css({'width':'300px','border-style':'solid'});
  $('#content').css({'margin-left':'300px', 'opacity':'0.4'})
  $('#nav-btn').css({'opacity':'8 .0'});
}

function closeSide(){
  $('#side-nav').css({'width':'0', 'border-style':'none'});
  $('#content').css({'margin-left':'0','opacity':'1'})
}