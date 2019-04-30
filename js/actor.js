class Actor {
	
	constructor(json = {}) {
		// The name of this actor
		this.name = json.name || '';
		// The amount of health that this actor has
		this.health = json.health || 0;
		// A ratio applied to all damage dealt by this actor
		this.damage = json.damage || 1;
		// How this actor is affected by different elemental damage
		this.fire = json.fire != null ? json.fire : 1;
		this.water = json.water != null ? json.water : 1;
		this.air = json.air != null ? json.air : 1;
		this.earth = json.earth != null ? json.earth : 1;
		// The items that the actor can currently use
		this.items = [];
		if (json.items) {
			for (let item of json.items) {
				this.addItem(item);
			}
		}
	}

	get single() {
		return ('aeiou'.indexOf(this.name[0]) !== -1)
			? `an ${this.name}`
			: `a ${this.name}`;
	}

	addItem(item) {
		item.owner = this;
		this.items.push(item);
	}
}

class Player extends Actor {
	
	constructor(json = {}) {
		json.name = 'you';
		json.health = 49;
		super(json);
	}

	get pronoun() {
		return 'you';
	}

	get object() {
		return 'you';
	}

	get possessive() {
		return 'your';
	}

	get isPlayer() {
		return true;
	}

	get isEnemy() {
		return false;
	}

	get health() {
		return this._health;
	}
	set health(n) {
		this._health = n;
		State.playerHealthElement.attr('data-value', n);
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

	get object() {
		switch (this.pronoun) {
			case 'he': return 'him';
			case 'she': return 'her';
			default: return 'it';
		}
	}

	get possessive() {
		switch (this.pronoun) {
			case 'he': return 'his';
			case 'she': return 'her';
			default: return 'its';
		}
	}

	get shortName() {
		return this.name.split(' ').pop();
	}

	get health() {
		return this._health;
	}
	set health(n) {
		this._health = n;
		State.opponentHealthElement.attr('data-value', n);
	}

	async turn(options = {}) {
		// Randomly do a thing
		await choose(...this.items).use(State.player, null, options);
	}
}

class BodyPart {

	constructor(json = {}) {
		this.name = json.name;
		this.damage = json.damage || 1;
		this.difficulty = json.difficulty || (100 / json.damage) || 0;
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