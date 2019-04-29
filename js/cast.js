/// Helps generate actors for encounters

// Creates an Enemy for a battle
function createEnemy() {
	const keys = Object.keys(Enemies);
	return Enemies[choose(...keys)]();
}

// Creates a Merchant for shopping
function createMerchant() {
	// TODO
}

/// Reference for creating different enemy types
const Enemies = {
	dragon: () => ({
		name: `${choose('red', 'blue', 'relucant', 'baby',
			'tiny', 'chonky', 'seductive')} dragon`,
		health: 8 + irange(1, 6 * State.counter),
		parts: [
			new BodyPart({
				name: choose('chest', 'body', 'flank')
			}),
			new BodyPart({
				name: choose('neck', 'face', 'head'),
				damage: 3,
				difficulty: 67
			}),
			new BodyPart({
				name: choose('wing', 'arm', 'leg'),
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
				redundantName: true,
				power: 2,
				fire: 1,
				accuracy: 80
			})
		]
	}),
	goblin: () => ({
		name: `${choose('vicious', 'devious', 'plus-sized',
			'hearty', 'overzealous', 'ambidextrous')} goblin`,
		health: 6 + irange(1, 2) * State.counter,
		parts: [
			new BodyPart({
				name: choose('chest', 'body', 'torso')
			}),
			new BodyPart({
				name: choose('neck', 'face', 'head'),
				damage: 3,
				difficulty: 67
			}),
			new BodyPart({
				name: choose('arm', 'leg'),
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
			new Stabby({
				name: 'dagger',
				power: 4,
				accuracy: 80
			}),
			new Ability({
				name: 'teeth',
				description: 'bites',
				power: 5,
				accuracy: 60
			})
		]
	})
};