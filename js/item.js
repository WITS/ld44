class Item {

	constructor(json) {
		this.name = json.name;
		this.description = json.description || json.name;
		this.power = json.power || 0;
		this.fire = json.fire || 0;
		this.ice = json.ice || 0;
		this.poison = json.poison || 0;
		this.electric = json.eletric || 0;
		this.accuracy = json.accuracy || 0;
	}

	use(other = null, part = null) {
		if (roll() <= this.accuracy) {
			// TODO: apply ability
			return true;
		} else {
			return false;
		}
	}
}

class Stabby extends Item {

	get category() {
		return 'stab';
	}
}

class Shooty extends Item {

	get category() {
		return 'shoot';
	}
}

class Spell extends Item {

	get category() {
		return 'cast';
	}
}

class Ability extends Item {

	get category() {
		return 'use';
	}
}