/// Helps generate actors for encounters

// Creates an Enemy for a battle
function createEnemy() {
	return choose(...Object.values(Enemies))();
}

// Creates a Merchant for shopping
function createMerchant() {
	const items = [];
	while (items.length < 3) {
		const item = createItem();
		// If an item with this name already exists
		if (items.some(x => x.name === item.name)) {
			// Skip it
			continue;
		}
		items.push(item);
	}
	return {
		name: `${choose('suspicious', 'shady', 'jolly',
			'young', 'elderly', 'friendly')} merchant`,
		pronoun: choose('he', 'she'),
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
		items: items
	};
}

/// Reference for creating different enemy types
const Enemies = {
	dragon: () => ({
		name: `${choose('red', 'blue', 'relucant', 'baby',
			'tiny', 'chonky', 'seductive')} dragon`,
		health: 8 + irange(2, 8 * State.counter),
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
				power: scale(3),
				accuracy: 90
			}),
			new Ability({
				name: 'teeth',
				description: 'bites',
				power: scale(5),
				accuracy: 60
			}),
			new Ability({
				name: 'firebreath',
				description: 'breathes fire',
				redundantName: true,
				power: scale(2),
				fire: 1,
				accuracy: 80
			})
		]
	}),
	goblin: () => ({
		name: `${choose('vicious', 'devious',
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
				power: scale(3),
				accuracy: 90
			}),
			new Stabby({
				name: 'dagger',
				power: scale(4),
				accuracy: 80
			}),
			new Ability({
				name: 'teeth',
				description: 'bites',
				power: scale(5),
				accuracy: 60
			})
		]
	}),
	orc: () => ({
		name: `${choose('vicious', 'devious', 'huge', 'tiny',
			'hearty', 'relucant')} orc`,
		health: 6 + irange(1, 3 * State.counter),
		fire: 1,
		water: 1,
		air: 0.5,
		earth: 2,
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
			new Ability({
				name: 'appendage',
				description: choose('punches', 'kicks', 'charges'),
				redundantName: true,
				power: scale(8),
				accuracy: 80
			}),
			createItem(),
			createItem()
		]
	}),
	barbarian: () => ({
		name: `${choose('vicious', 'devious', 'cruel', 'garish',
			'hearty', 'overzealous', 'relucant')} barbarian`,
		health: 6 + irange(1, 3 * State.counter),
		fire: 2,
		water: 1,
		air: 2,
		earth: 1,
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
				name: 'dagger',
				power: scale(4),
				accuracy: 80
			}),
			new Ability({
				name: 'appendage',
				description: choose('punches', 'kicks'),
				redundantName: true,
				power: scale(8),
				accuracy: 80
			}),
			new Ability({
				name: 'head',
				description: 'headbutts',
				power: scale(5),
				accuracy: 60
			})
		]
	}),
	human: () => ({
		name: `${choose('Dave', 'Matt', 'Jeff', 'George', 'Joe', 'Billy')} the ${
			cap(choose('loser', 'mouthbreather', 'kid', 'fool', 'jester',
				'joker', 'lame'))}`,
		pronoun: 'he',
		health: 6 + irange(1, 4 * State.counter),
		fire: 2,
		water: 0.5,
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
			createItem(),
			createItem()
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

// Picks an adjective for the current progress
function adj() {
	if (State.counter < 3) {
		return choose('rusty', 'wooden', 'cheap', 'flimsy');
	} else if (State.counter < 5) {
		return choose('knock-off', 'iron', 'discount', 'steel');
	} else if (State.counter < 8) {
		return choose('solid', 'nice', 'heavy', 'light', 'bedazzled');
	} else {
		return choose('fancy', 'balanced', 'swift', 'quick', 'true');
	}
}

// Scales a value based on progress
function scale(n) {
	return irange(n, n * State.counter);
}

// Reference for creating different Stabby items
const Stabbies = {
	sword: () => ({
		name: `${adj()} sword`,
		power: Math.round(irange(2, 5.5) * State.counter),
		accuracy: irange(80, 92),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	dagger: () => ({
		name: `${adj()} dagger`,
		power: Math.round(irange(1, 3) * State.counter),
		accuracy: irange(84, 96),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	spear: () => ({
		name: `${adj()} spear`,
		power: Math.round(irange(1, 2) * State.counter),
		accuracy: irange(92, 96),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	axe: () => ({
		name: `${adj()} axe`,
		power: Math.round(irange(2, 6.5) * State.counter),
		accuracy: irange(76, 88),
		price: 2 + irange(1, Math.round(2 * State.counter))
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
		accuracy: irange(92, 100),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	// Deals water damage
	water: () => ({
		name: `${choose('water', 'ice', 'tidal')
			}${choose('needle', 'wave', 'blast', 'splash')}`,
		power: irange(0, 1) * State.counter,
		water: irange(1, 5) * State.counter,
		accuracy: irange(92, 100),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	// Deals wind damage
	wind: () => ({
		name: `${choose('wind', 'air', 'gust')
			}${choose('slash', 'slice', 'thrust')}`,
		power: irange(0, 1) * State.counter,
		wind: irange(1, 5) * State.counter,
		accuracy: irange(92, 100),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	// Deals earth damage
	earth: () => ({
		name: `${choose('earth', 'dirt', 'rock', 'boulder', 'mountain')
			}${choose('ball', 'blast', 'quake')}`,
		power: irange(1, 3) * State.counter,
		earth: irange(1, 3) * State.counter,
		accuracy: irange(84, 100),
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	// Heals
	heal: () => ({
		name: `${choose('enchanted ', 'quick ', 'amulet of ')
			}${choose('healing', 'heart')}`,
		heal: irange(1, 2) * State.counter,
		accuracy: 100,
		price: 2 + irange(1, Math.round(2 * State.counter))
	}),
	// Transfers health from opponent
	transfusion: () => ({
		name: `${choose(`thief's `, 'deceptive ', 'stolen ', 'selfish ')
			}${choose('heart', 'healing')}`,
		transfusion: irange(1, 3) * State.counter,
		accuracy: irange(96, 100),
		price: 2 + irange(1, Math.round(2 * State.counter))
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