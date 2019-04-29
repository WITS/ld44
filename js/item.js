class Item {

	constructor(json) {
		this.owner = json.owner || null;
		this.name = json.name;
		this._description = json.description || json.name;
		this.redundantName = json.redundantName || false;
		this.power = json.power || 0;
		this.fire = json.fire || 0;
		this.ice = json.ice || 0;
		this.poison = json.poison || 0;
		this.electric = json.eletric || 0;
		this.accuracy = json.accuracy || 0;
	}

	async use(other = null, part = null) {
		const owner = other === State.player
			? State.opponent
			: State.player;
		const at = this.category === 'cast'
			? 'on'
			: 'at';
		// Calculate the part string
		const partStr = part === null
			? other.pronoun
			: `${other.possessive} ${part.name}`;
		const partRatio = part === null
			? 1
			: part.hit();
		// Calculate the with (item) string
		const withStr = this.category === 'cast' || this.redundantName
			? ''
			: ` ${choose('with', 'using')} ${owner.possessive} ${this.name}`;
		// Calculate the elemental string
		const elementalStr = ''; // TODO
		const r = roll();
		if (r <= this.accuracy && partRatio !== 0) {
			// Calculate special modifiers based on effectiveness
			const rollRatio = 0.5 + 1.5 * r / this.accuracy;
			// Apply ability
			const damage = Math.round(this.power * partRatio * rollRatio);
			await State.pushMessage(`${cap(owner.pronoun)} ${this.description} ${at} ${
				partStr
			}${withStr}, dealing ${damage} damage${elementalStr}`);
			// Deal damage
			other.health -= damage;
			return true;
		} else {
			// You done failed
			await State.pushMessage(`${cap(owner.pronoun)} ${this.description} ${at} ${
				partStr}, but ${owner.pronoun} miss${
				owner === State.player ? '' : 'es'}`);
			return false;
		}
	}
}

class Stabby extends Item {

	get description() {
		const res = choose('stabs', 'slashes', 'swipes');
		if (this.owner === State.player) {
			return singular(res);
		} else {
			return res;
		}
	}

	get category() {
		return 'stab';
	}
}

class Shooty extends Item {

	get description() {
		const res = choose('shoots', 'fires at');
		if (this.owner === State.player) {
			return singular(res);
		} else {
			return res;
		}
	}

	get category() {
		return 'shoot';
	}
}

class Spell extends Item {

	get description() {
		const res = choose('casts', 'uses');
		if (this.owner === State.player) {
			return `${singular(res)} ${this.name}`;
		} else {
			return `${res} ${this.name}`;
		}
	}

	get category() {
		return 'cast';
	}
}

class Ability extends Item {

	get description() {
		return this._description;
	}

	get category() {
		return 'use';
	}
}