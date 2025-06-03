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


// future elements bindings
document.querySelector('body').addEventListener('click', (event) => {
    // clicking on card to change status
    if(matchElementAndParent(event.target, [
        '.mtgcard-icon-p',
        '.mtgcard-icon-wrapper',
        '.mtgcard-body'
    ])){
        const cardKey = getCardKeyFromParent(event.target);
        console.log(cardKey);
        window.listManager.advanceCardIcon(cardKey);
        window.listManager.printOneCard(cardKey);
    }
});
