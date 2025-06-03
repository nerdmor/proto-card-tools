/* Collection of functions that make life easier */

function matchElementAndParent(element, filters){
    if(!Array.isArray(filters)) filters = [filters];
    const parentElement = element.parentElement;
    for(const fi of filters){
        if(element.matches(fi)) return element;
        if(parentElement.matches(fi)) return parentElement;
    }
    return false;
}

function getCardKeyFromParent(element){
    if(element.hasAttribute('card_key')){
        return element.getAttribute('card_key');
    }
    var parentElement = element;
    while(!parentElement.hasAttribute('card_key') && parentElement.tagName != 'BODY'){
        parentElement = parentElement.parentElement;
    }
    if(parentElement.hasAttribute('card_key')){
        return parentElement.getAttribute('card_key');
    }
    return null;
}