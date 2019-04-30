class Item {

	constructor(json) {
		this.owner = json.owner || null;
		this.name = json.name;
		this._description = json.description || json.name;
		this.redundantName = json.redundantName || false;
		this.price = json.price || 0;
		this.power = json.power || 0;
		this.fire = json.fire || 0;
		this.water = json.water || 0;
		this.air = json.air || 0;
		this.earth = json.earth || 0;
		this.heal = json.heal || 0;
		this.transfusion = json.transfusion || 0;
		this.attack = json.attack || 0;
		this.defense = json.defense || 0;
		this.accuracy = json.accuracy || 0;
	}

	async use(other = null, part = null, options = {}) {
		const owner = other === State.player
			? State.opponent
			: State.player;
		const at = this.category === 'cast'
			? 'on'
			: 'at';
		// Calculate the part string
		const partStr = part === null
			? other.object
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
			const rollRatio = 0.75 + 1.25 * r / this.accuracy;
			// Calculate the elemental damage
			const elemental =
				(this.fire * other.fire) +
				(this.water * other.water) +
				(this.air * other.air) +
				(this.earth * other.earth);
			const actionStr = `${cap(owner.pronoun)} ${this.description}` +
				(this.heal ? '' : ` ${at} ${partStr}${withStr}`);
			// Apply ability
			if (this.heal) {
				// Heal
				const val = Math.round(this.heal * rollRatio);
				owner.health += val;
				await State.pushMessage(`${actionStr}, healing ${val} heart${
					val === 1 ? '' : 's'}`, options.message);
			} else if (this.transfusion) {
				// Transfusion
				const val = Math.min(Math.round(this.transfusion * rollRatio), other.health);
				owner.health += val;
				other.health -= val;
				await State.pushMessage(`${actionStr}, stealing ${val} heart${
					val === 1 ? '' : 's'} from ${other.object}`, options.message);
			} else if (this.attack) {
				// Attack
				owner.damage *= this.attack;
				await State.pushMessage(`${actionStr}, raising ${owner.possessive} attack`,
					options.message);
			} else if (this.defense) {
				// Defense
				owner.damage /= this.defense;
				await State.pushMessage(`${actionStr}, raising ${owner.possessive} defense`,
					options.message);
			} else {
				// Damage (traditional / elemental)
				const damage = Math.round((this.power + elemental)
					* owner.damage * partRatio * rollRatio);
				// Deal damage
				other.health = Math.max(0, other.health - damage);
				await State.pushMessage(`${actionStr}, dealing ${damage} damage${elementalStr}`,
					options.message);
			}
			return true;
		} else {
			// You done failed
			await State.pushMessage(`${cap(owner.pronoun)} ${this.description} ${at} ${
				partStr}, but ${owner.pronoun} miss${
				owner === State.player ? '' : 'es'}`, options.message);
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