class Actor {
	
	constructor(json = {}) {
		// The name of this actor
		this.name = json.name || '';
		// The items that the actor can currently use
		this.items = [];
	}
}

class Player extends Actor {
	
	constructor(json = {}) {
		json.name = 'you';
		super(json);
	}

	get isPlayer() {
		return true;
	}

	get isEnemy() {
		return false;
	}
}

class Enemy extends Actor {

	constructor(json = {}) {
		super(json);
		this.parts = json.parts || [];
		this.pronoun = json.pronoun || 'it';
	}
	
	get isPlayer() {
		return false;
	}

	get isEnemy() {
		return true;
	}

	get possessive() {
		switch (this.pronoun) {
			case 'him': return 'his';
			case 'her': return 'her';
			default: return 'its';
		}
	}	
}

class BodyPart {

	constructor(json = {}) {
		this.name = json.name;
		this.damage = json.damage || 1;
		this.difficulty = json.difficulty || 0;
	}

	// Rolls a die and returns the appropriate multiplier
	hit() {
		if (roll() >= this.difficulty) {
			return this.damage;
		} else {
			return 0;
		}
	}
}