console.log('main.js loaded')

// sets the css variable --card_width based on window width
function resizeCards(){
    const currWidth = window.innerWidth;
    const cssRoot = document.querySelector(':root');
    var cardWidth = "0";

    if(currWidth < 400){
        cardWidth = "100%";
    }else if(currWidth >= 1200){
        cardWidth = "15%";
    }else{
        cardWidth = Math.floor(100/Math.floor(currWidth/200)) - 1;
        cardWidth = cardWidth.toString() + '%';
    }
    cssRoot.style.setProperty('--card_width', cardWidth);
}

// binding to event
window.addEventListener("resize", (e) => { resizeCards() })

// running first instance on load
resizeCards();
