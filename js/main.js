const $ = document.q.bind(document);

document.on('DOMContentLoaded', () => {
	// Create singletons
	State = new QuotientState();
	document.body.appendChild(State.element);
	// Testing
	State.player.items = [
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
	];
	State.startBattle(new Enemy({
		name: 'red dragon',
		parts: [
			new BodyPart({
				name: 'chest'
			}),
			new BodyPart({
				name: 'neck',
				damage: 3,
				difficulty: 90
			}),
			new BodyPart({
				name: 'wing',
				damage: 2,
				difficulty: 80
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

// Rolls an n-sided die (returns a random int in the range [1, n])
function roll(n = 100) {
	return 1 + Math.floor(Math.random() * n);
}