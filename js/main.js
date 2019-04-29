const $ = document.q.bind(document);

document.on('DOMContentLoaded', () => {
	// Create singletons
	State = new QuotientState();
	document.body.appendChild(State.element);
	// Testing
	[
		new Stabby({
			name: 'rusty sword',
			power: 3,
			accuracy: 92
		}),
		new Shooty({
			name: 'loooong bow',
			power: 5,
			accuracy: 60
		}),
		new Spell({
			name: 'fireball',
			power: 2,
			fire: 1,
			accuracy: 98
		})
	].map(x => State.player.addItem(x));
	State.startBattle(new Enemy({
		name: 'red dragon',
		health: 12,
		parts: [
			new BodyPart({
				name: 'chest'
			}),
			new BodyPart({
				name: 'neck',
				damage: 3,
				difficulty: 67
			}),
			new BodyPart({
				name: 'wing',
				damage: 2,
				difficulty: 50
			})
		],
		items: [
			new Stabby({
				name: 'claws',
				power: 3,
				accuracy: 90
			}),
			new Ability({
				name: 'teeth',
				description: 'bites',
				power: 5,
				accuracy: 60
			}),
			new Ability({
				name: 'firebreath',
				description: 'breathes fire',
				power: 2,
				fire: 1,
				accuracy: 80
			})
		]
	}));
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

// Rolls an n-sided die (returns a random int in the range [1, n])
function roll(n = 100) {
	return 1 + Math.floor(Math.random() * n);
}