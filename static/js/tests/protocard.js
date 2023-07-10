const scryent = new Scryfall()

let cardnames = [
	'swords to plowshares',
	'opt',
	'Sheoldred, the Apocalypse',
	'Nissa, Resurgent Animist',
	'Boseiju, Who Endures',
	'Elesh Norn, Mother of Machines',
	'Sheoldred'
];
var cards = [];

for (var i = 0; i < cardnames.length; i++) {
	newcard = new FinderCard(i);
	newcard.buildFromParams({
		index: i,
		typedName: cardnames[i],
		quantity: 99
	});
	newcard.buildFromScryFall(scryent);
	cards.push(newcard);
}

window.myTimeout = setTimeout(function(){
	var html = [];
	for (var i = 0; i < cards.length; i++) {
		html.push(cards[i].draw());
	}
	html = html.join('\n\n');
	document.querySelector('#module-wrapper').innerHTML = html;
}, 10000);
// function myStopFunction() {
//   clearTimeout(window.myTimeout);
// }

// const card2 = new FinderCard(1);
// card2.buildFromParams({
// 	index: 1,
// 	name: 'Jace, Wielder of Mysteries'
// });
// card2.buildFromScryFall(scryent);

// var html = [card1.draw(), card2.draw()].join('');
// var html = card1.draw();
// console.log(html);
// document.querySelector('#module-wrapper').innerHTML = html;