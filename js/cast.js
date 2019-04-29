/// Helps generate actors for encounters

// Creates an Enemy for a battle
function createEnemy() {
	return choose(...Object.values(Enemies))();
}

// Creates a Merchant for shopping
function createMerchant() {
	return {
		name: `${choose('suspicious', 'shady', 'jolly',
			'young', 'elderly', 'friendly')} ${
			choose('merchant', 'salesman', 'dealer', 'traveller')}`,
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
			createItem(),
			// new Shooty(choose(...Object.values(Shooties))()),
		]
	};
}

/// Reference for creating different enemy types
const Enemies = {
	dragon: () => ({
		name: `${choose('red', 'blue', 'relucant', 'baby',
			'tiny', 'chonky', 'seductive')} dragon`,
		health: 8 + irange(1, 6 * State.counter),
		fire: 0,
		water: 2,
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
		fire: 2,
		water: 0.5,
		air: 2,
		earth: 0,
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

// Creates a random item
function createItem() {
	if (Math.random() < 0.5) {
		return new Stabby(choose(...Object.values(Stabbies))());
	} else {
		return new Spell(choose(...Object.values(Spells))());
	}
}

// Reference for creating different Stabby items
const Stabbies = {
	sword: () => ({

	}),
	dagger: () => ({

	}),
	spear: () => ({

	}),
	axe: () => ({

	})
};

// // Reference for creating different Shooty items
// const Shooty = {
// 	bow: () => ({

// 	})
// };

// Reference for creating different Spells
const Spells = {
	// Deals fire damage
	fire: () => ({
		name: `${choose('fire', 'flame', 'magma', 'lava')
			}${choose('ball', 'wave', 'blast')}`,
		power: irange(0, 2) * State.counter,
		fire: irange(1, 4) * State.counter,
		accuracy: irange(90, 100)
	}),
	// Deals water damage
	water: () => ({
		name: `${choose('water', 'ice', 'tidal')
			}${choose('needle', 'wave', 'blast', 'splash')}`,
		power: irange(0, 1) * State.counter,
		water: irange(1, 5) * State.counter,
		accuracy: irange(90, 100)
	}),
	// Deals wind damage
	wind: () => ({
		name: `${choose('wind', 'air', 'gust')
			}${choose('slash', 'slice', 'thrust')}`,
		power: irange(0, 1) * State.counter,
		wind: irange(1, 5) * State.counter,
		accuracy: irange(90, 100)
	}),
	// Deals earth damage
	earth: () => ({
		name: `${choose('earth', 'dirt', 'rock', 'boulder', 'mountain')
			}${choose('ball', 'blast', 'quake')}`,
		power: irange(1, 3) * State.counter,
		earth: irange(1, 3) * State.counter,
		accuracy: irange(70, 100)
	}),
	// Heals
	heal: () => ({
		name: `${choose('enchanted ', 'quick ', 'amulet of ')
			}${choose('healing', 'heart')}`,
		heal: irange(1, 2) * State.counter,
		accuracy: irange(80, 100)
	}),
	// Transfers health from opponent
	transfusion: () => ({
		name: `${choose(`thief's `, 'deceptive ', 'stolen ', 'selfish ')
			}${choose('heart', 'healing')}`,
		transfusion: irange(1, 3) * State.counter,
		accuracy: irange(90, 100)
	}),
	// // Increases power of attacks
	// attack: () => ({
	// 	name: `${choose('fire', 'flame', 'magma', 'lava')
	// 		}${choose('ball', 'wave', 'blast')}`,
	// 	attack: 1.15,
	// 	accuracy: irange(90, 100)
	// }),
	// // Decreases the power of enemy attacks
	// defense: () => ({
	// 	name: `${choose('fire', 'flame', 'magma', 'lava')
	// 		}${choose('ball', 'wave', 'blast')}`,
	// 	defense: 0.87,
	// 	accuracy: irange(90, 100)
	// })
};