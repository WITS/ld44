const $ = document.q.bind(document);

document.on('DOMContentLoaded', () => {
	// Create singletons
	State = new QuotientState();
	State.player = new Player();
	document.body.appendChild(State.nav);
	document.body.appendChild(State.element);
	State.playerNameElement.attr('data-value', 'You');
	State.counter = 1;
	// Testing
	[
		new Stabby({
			name: 'rusty sword',
			power: 3,
			accuracy: 92
		}),
		new Spell(choose(...Object.values(Spells))()),
		new Spell(choose(...Object.values(Spells))())
		// new Shooty({
		// 	name: 'longbow',
		// 	power: 5,
		// 	accuracy: 60
		// }),
		// new Spell({
		// 	name: 'fireball',
		// 	power: 2,
		// 	fire: 1,
		// 	accuracy: 98
		// })
	].map(x => State.player.addItem(x));
	State.counter = 0;
	State.nextEncounter();
});

// Sleeps for n milliseconds
function sleep(n = 0) {
	return new Promise(r => setTimeout(() => r(), n));
}

// Capitalizes the first character of a string
function cap(str) {
	return str[0].toUpperCase() + str.substr(1);
}

// Attempts to convert a string from plural to singular
function singular(str) {
	// // Special cases
	// switch (str) {
	// 	case 'fires': return 'fire';
	// 	default: break;
	// }
	return str
		.replace(/ies\b/g, 'y')
		.replace(/(?:([h])e)?s\b/g, '$1');
}

// Randomly chooses one of the parameters
function choose(...args) {
	return args[Math.floor(Math.random() * args.length)];
}

// Returns a number between min and max, inclusive
function range(min, max) {
	return min + (Math.random() + (Number.EPSILON || 0)) * max;
}

// Return an integer between min and max, inclusive
function irange(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

// Rolls an n-sided die (returns a random int in the range [1, n])
function roll(n = 100) {
	return 1 + Math.floor(Math.random() * n);
}