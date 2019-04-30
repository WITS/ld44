/// Stores information about the current session & updates UI
class QuotientState {

	constructor() {
		this.counter = 0;
		this.status = 'travel';
		this.player = null;
		this.lastStabby = null;
		this.opponent = null;
		this.messages = [];
		this.meta = {};
		// The slices in the current intent
		this.intent = [];
		this.slices = [];
	}

	get nav() {
		if (this._nav == null) {
			this._nav = this.createNav();
		}
		return this._nav;
	}

	get playerNameElement() {
		return this.nav.$child.player.$child.name;
	}

	get playerHealthElement() {
		return this.nav.$child.player.$child.health;
	}

	get opponentNameElement() {
		return this.nav.$child.opponent.$child.name;
	}

	get opponentHealthElement() {
		return this.nav.$child.opponent.$child.health;
	}

	get element() {
		if (this._element == null) {
			this._element = this.createElement();
		}
		return this._element;
	}

	get intentElement() {
		return this.element.$child.intent;
	}

	get slicesElement() {
		return this.element.$child.slices;
	}

	get firstSlice() {
		return this.intent[0] || null;
	}

	get lastSlice() {
		return this.intent[this.intent.length - 1] || null;
	}

	async pushMessage(text, options = {}) {
		// If there is a narrator element before the intent element
		if (this.intentElement !== this.element.firstChild) {
			const snapshot = Transition.snapshot(this.intentElement);
			while (this.intentElement !== this.element.firstChild) {
				this.element.firstChild.remove();
			}
			const dur = 500;
			Transition.from(this.intentElement, snapshot, dur, {
				aspectRatio: 'none'
			});
			await sleep(dur);
		}
		this.messages.push(text);
		const msg = $new('.narrator')
			.text(text)
			.element();
		this.element.insertBefore(msg, options.before || this.slicesElement);
		const dur = 500;
		Transition.animate(msg, {
			from: {
				transform: `translateY(256px)`,
				opacity: 0
			},
			to: {
				transform: `none`,
				opacity: 1
			}
		}, dur);
		await sleep(dur + 250);
	}

	// What's next?
	nextEncounter() {
		// Clear the previous encounter
		this.intent.splice(0);
		this.intentElement.empty();
		this.element.q('.narrator').each(el => el.remove());
		// If it's time for a merchant
		if (this.nextMerchantIn === 0) {
			// Calculate the next time to show a merchant
			const [prev1, prev2] = this.prevMerchant;
			const next = prev1 + prev2;
			this.prevMerchant = [prev2, next];
			this.nextMerchantIn = next;
			// Show a merchant
			this.startShop(new Enemy(createMerchant()));
		} else {			
			++ this.counter;
			-- this.nextMerchantIn;
			this.startBattle(new Enemy(createEnemy()));
		}
	}

	async startBattle(other, options = {}) {
		this.status = 'battle';
		this.player.damage = 1;
		this.opponent = other;
		this.meta = {
			reward: Math.ceil(other.health * 0.25),
			options: options
		};
		State.opponentNameElement.attr('data-value', cap(other.shortName));
		if (options.isTheft !== true) {
			State.pushMessage(choose(
					`You nearly bump into ${other.single}`,
					`You stop just short of ${other.single}`,
					`${cap(other.single)} blocks your path`,
					`You come across ${other.single}`,
					`Your journey is interrupted by ${other.single}`,
					`There's ${other.single} directly in front of you`,
					`You feel the eyes of ${other.single} watching you`,
					`You turn to meet the watchful face of ${other.single}`
				), {
				before: this.intentElement
			});
		} else {
			await other.turn();
			// If they killed you already
			if (this.player.health <= 0) {
				// Stop here
				this.pushMessage(`You died`);
				return;
			}
			this.resetIntent();
		}
		// Start up the slices
		const itemCategories = new Map();
		const slices = [];
		for (let item of this.player.items) {
			if (!itemCategories.has(item.category)) {
				itemCategories.set(item.category, []);
			}
			itemCategories.get(item.category).push(item);
		}
		// Create actual slices
		for (let [cat, items] of itemCategories) {
			// Create slices for items
			const slice = new Slice({
				text: cat !== 'cast'
					? cat
					: 'cast a spell',
				description: cat !== 'cast'
					? `${cat} ${other.the}`
					: cat,
				isEnd: cat !== 'cast'
			});
			slices.push(slice);
			let withSlice = null, inSlice = null;
			const itemSlices = items.map(x => new Slice({
				text: x.name,
				item: x
			}));
			const partSlices = other.parts.map(x => new Slice({
				text: x.name,
				part: x
			}));
			// If there's parts
			if (partSlices.length !== 0) {
				inSlice = new Slice({
					text: `in ${other.possessive}`,
					next: partSlices
				});
			}
			if (cat === 'cast') {
				slice._next = itemSlices;
			} else if (items.length === 1) {
				// Don't prompt the player to pick an item
				slice.item = items[0];
			} else {
				// Give the player the choice of each item in the category
				withSlice = new Slice({
					text: 'with',
					description: 'with your',
					next: itemSlices
				});
				// Link up to the main category slice
				slice.addNext(withSlice);
				// If there's part slices
				if (inSlice) {
					for (let s of partSlices) {
						s.addNext(withSlice);
					}
					for (let s of itemSlices) {
						s.addNext(inSlice);
					}
				}
			}
			// Link up part slices
			if (inSlice && cat !== 'cast') {
				slice.addNext(inSlice);
			}
		}
		// Show the initial slices
		this.showSlices(slices);
	}

	// Handles the next step in a battle
	async stepBattle() {
		// Parse the intent
		let item = this.lastStabby;
		let part = null;
		for (let slice of this.intent) {
			if (slice.item != null) {
				item = slice.item;
			}
			if (slice.part != null) {
				part = slice.part;
			}
		}

		// Attempt to use the item, on the part
		await item.use(this.opponent, part);

		// If the opponent isn't already dead
		if (this.opponent.health > 0) {
			// Let the enemy take their turn
			await this.opponent.turn();
		}

		// Start the player's next turn
		const slices = this.intent[0].siblings;
		this.resetIntent();
		// If the player isn't dead
		if (this.player.health > 0) {
			// If the opponent is done for
			if (this.opponent.health <= 0) {
				// Wait a moment, so the player can read the text
				await sleep(750);
				// Fade out the current text
				const dur = 500;
				for (let child of this.element.children) {
					if (child !== this.slicesElement) {
						child.style.opacity = '0';
						Transition.animate(child, {
							opacity: {
								from: '1',
								to: '0'
							}
						}, dur);
					}
				}
				// Update the current text
				await sleep(dur);
				// Reward the player
				let rewardStr = '';
				if (!this.meta.options.isTheft) {
					const reward = this.meta.reward;
					this.player.health += reward;
					rewardStr = ` and gained ${reward} heart${
						reward > 1 ? 's' : ''
					}`;
				}
				await this.pushMessage(`You defeated ${this.opponent.the}${rewardStr}!`, {
					before: this.intentElement
				});
				// Let the player continue
				this.showSlices([
					new Slice({
						id: 'continue',
						text: 'continue'
					})
				]);
				this.intentElement.style.opacity = '1';
			} else {
				// Continue the fight
				this.showSlices(slices);
			}
		} else {
			// Game over
			this.pushMessage(`You died`);
		}
	}

	startShop(other) {
		this.status = 'shop';
		this.player.damage = 1;
		this.opponent = other;
		State.opponentNameElement.attr('data-value', cap(other.shortName));
		State.pushMessage(choose(
				`${cap(other.single)} runs up to you`,
				`You nearly bump into ${other.single}`,
				`You hear ${other.single} nearby`,
				`You come across ${other.single}`,
				`There's ${other.single} directly in front of you`
			), {
			before: this.intentElement
		});
		// Show the initial slices
		this.showSlices(this.shopSlices());
	}

	// Creates slices for the top-level shopping status
	shopSlices() {
		const player = this.player;
		const other = this.opponent;
		return [
			new Slice({
				text: 'buy',
				description: `buy their`,
				next: other.items.map(x => new Slice({
					text: x.category === 'cast'
						? `${x.name} spell`
						: x.name,
					item: x
				}))
			}),
			new Slice({
				text: 'sell',
				description: `sell your`,
				next: player.items.map(x => new Slice({
					text: x.category === 'cast'
						? `${x.name} spell`
						: x.name,
					item: x
				}))
			}),
			new Slice({
				id: 'end',
				text: 'done'
			})
		];
	}

	// Handles the next step while shopping
	async stepShop() {
		// Parse the intent
		let type = this.intent[0].text;
		let item = null;
		for (let slice of this.intent) {
			if (slice.item != null) {
				item = slice.item;
			}
		}

		// Done?
		if (type === 'done') {
			this.nextEncounter();
		} else if (type === 'sell') {
			// Offer to buy it for a reduced price
			const val = Math.ceil(item.price * 0.75);
			this.meta = {
				status: 'sell',
				item: item,
				hearts: val
			};
			await this.pushMessage(`Hmm... I'll give you ${val} heart${
				val > 1 ? 's' : ''} for this`);
			this.resetIntent();
			await this.showSlices([
				new Slice({
					id: 'end',
					text: 'deal'
				}),
				new Slice({
					id: 'end',
					text: 'no deal'
				})
			]);
		} else if (type === 'deal' || type === 'no deal') { // Sell: Response
			// Accept
			if (type === 'deal') {
				const { status, item, hearts } = this.meta;
				if (status === 'sell') {
					this.player.health += hearts;
					this.opponent.addItem(item);
					this.player.items.splice(this.player.items.indexOf(item), 1);
					if (this.lastStabby === item) {
						for (let item of this.player.items) {
							if (item instanceof Stabby) {
								this.lastStabby = item;
								break;
							}
						}
					}
				} else {
					this.player.health -= hearts;
					this.player.addItem(item);
					this.opponent.items.splice(this.opponent.items.indexOf(item), 1);
				}
				await this.pushMessage(`Pleasure doing business with you`);
			} else {
				await this.pushMessage(`No worries`);
			}
			this.meta = {};
			await this.pushMessage(`Is there anything else you're interested in?`);
			this.resetIntent();
			await this.showSlices(this.shopSlices());
		} else if (type === 'buy') { // Buy
			// Offer to sell it for full price
			this.meta = {
				status: 'buy',
				item: item,
				hearts: item.price,
				isFullPrice: true
			};
			const halfPrice = Math.max(1, Math.floor(item.price * 0.5));
			await this.pushMessage(`Good choice! That'll cost you ${item.price
				} heart${item.price > 1 ? 's' : ''}`);
			this.resetIntent();
			await this.showSlices([
				new Slice({
					text: 'offer to pay',
					next: [
						new Slice({
							text: 'full price',
							price: item.price
						}),
						new Slice({
							text: `${halfPrice} heart${halfPrice > 1 ? 's' : ''}`,
							price: halfPrice
						})
					]
				}),
				new Slice({
					id: 'end',
					text: 'steal it'
				}),
				new Slice({
					id: 'end',
					text: 'nevermind'
				})
			]);
		} else if (this.meta.status === 'buy') {
			// Accept
			if (type === 'nevermind') {
				await this.pushMessage(`No worries`);
			} else if (type === 'steal it') {
				// Add the item to your inventory
				const { item } = this.meta;
				this.player.addItem(item);
				this.opponent.items.splice(this.opponent.items.indexOf(item), 1);
				// Start fighting them
				await this.pushMessage(`You grab the ${item.name}, but ${
					this.opponent.the} blocks your path`);
				this.startBattle(this.opponent, {
					isTheft: true
				});
				return;
			} else {
				// If the player offered to pay the previous price
				const offer = this.intent[1].price;
				const { item, hearts, isFullPrice } = this.meta;
				if (offer === hearts || roll() <= 25) {
					this.player.health -= offer;
					this.player.addItem(item);
					this.opponent.items.splice(this.opponent.items.indexOf(item), 1);
					await this.pushMessage(`Pleasure doing business with you`);
				} else if (isFullPrice) {
					if (roll() <= 50) {
						// Meet the player halfway
						this.meta.isFullPrice = false;
						this.meta.hearts = Math.ceil(hearts * 0.75);
						await this.pushMessage(`I can do ${this.meta.hearts}`);
					} else {
						// I'm not going to play this game
						this.meta.isFullPrice = false;
						this.meta.hearts = Math.ceil(hearts * 1.2);
						await this.pushMessage(`How about ${this.meta.hearts}?`);
					}
					this.resetIntent();
					await this.showSlices([
						new Slice({
							id: 'end',
							text: 'deal'
						}),
						new Slice({
							id: 'end',
							text: 'no deal'
						})
					]);
					return;
				}
			}
			this.meta = {};
			await this.pushMessage(`Is there anything else you're interested in?`);
			this.resetIntent();
			await this.showSlices(this.shopSlices());
		}
	}

	// Shows a list of slices
	showSlices(slices, options = {}) {
		this.slices = slices.slice();
		// Clear current list
		this.slicesElement.empty();
		// If this is a valid place to end the player's turn
		if (this.intent.length !== 0 && this.lastSlice.isEnd === true) {
			slices.push(new Slice({
				id: 'end',
				text: 'done',
				description: '.'
			}));
		}
		// Add in the new elements
		let dur = 500;
		for (let slice of slices) {
			this.slicesElement.append(slice.element);
			if (options.skipAnimationFor !== slice) {
				Transition.animate(slice.element, {
					from: {
						transform: `translateY(300px)`,
						opacity: 0
					},
					to: {
						transform: `none`,
						opacity: 1
					}
				}, dur);
				dur += 100;
			}
		}
	}

	// Adds a slice to the current intent array
	async addSlice(slice) {
		// Keep track of the slices at the time that this slice was selected
		slice.siblings = this.slices;
		this.intent.push(slice);
		// Capture locations of current tokens
		const tokens = new Map();
		for (let token of this.intentElement.children) {
			tokens.set(token, Transition.snapshot(token));
		}
		const textSnapshot = Transition.snapshot(slice.textElement);
		this.intentElement.append(slice.token);
		// Transition the slice to the token
		Transition.from(slice.token, textSnapshot, 500, {
			aspectRatio: 'height'
		});
		// If the token's text is longer than the slice's
		if (slice.description.length > slice.text.length &&
			slice.description.indexOf(slice.text) === 0) {
			// Fade in the extra words
			slice.token.empty();
			slice.token.append(slice.text);
			const fade = $new('span')
				.text(slice.description.substr(slice.text.length))
				.element();
			slice.token.append(fade);
			Transition.animate(fade, {
				opacity: {
					from: 0,
					to: 1
				}
			}, 750);
		}
		// Animate the current tokens over
		for (let [token, snapshot] of tokens) {
			Transition.from(token, snapshot, 500, {
				aspectRatio: 'none',
				timing: 'cubic-bezier(0.2, 0.75, 0.3, 1.5)'
			});
		}
		// Remove the current slices
		this.slicesElement.empty();
		// Wait for the animation to (partly) finish
		await sleep(250);
		// If the player was ending their turn
		if (this.lastSlice.id === 'continue') {
			// Next encounter!
			await sleep(250);
			this.nextEncounter();
		} else if (this.lastSlice.id === 'end') {
			// Handle the end of the turn
			this.endTurn();
		} else {
			// Update the currently visible slices
			this.showSlices(slice.next);
		}
	}

	// Resets the intent UI
	resetIntent() {
		this.intent.splice(0);
		const narrator = new Map();
		for (let child of this.element.children) {
			if (child === this.intentElement || child === this.slicesElement) {
				continue;
			} else {
				narrator.set(child, Transition.snapshot(child));
			}
		}
		this.intentElement.empty();
		this.element.insertBefore(this.intentElement, this.slicesElement);
		for (let [el, snapshot] of narrator) {
			Transition.from(el, snapshot, 500, {
				aspectRatio: 'none'
			});
		}
	}

	// Ends a turn
	endTurn() {
		// Branch based on status
		switch (this.status) {
			case 'battle': this.stepBattle(); break;
			case 'shop': this.stepShop(); break;
			default: break;
		}
	}

	createNav() {
		return $new('nav')
			.append(
				$new('.player.info')
					.name('player')
					.append(
						$new('.health').name('health'),
						$new('.name').name('name')
						// TODO: elemental
					),
				$new('.opponent.info')
					.name('opponent')
					.append(
						$new('.name').name('name'),
						$new('.health').name('health')
						// TODO: elemental
					)
			)
			.element();
	}

	createElement() {
		return $new('main.quotient')
			.append(
				$new('.intent').name('intent'),
				$new('.slices').name('slices')
			)
			.element();
	}
}

/// Represents one option for the next fragment of the player's intent
class Slice {

	constructor(json) {
		// Special
		this.id = json.id || null;
		// The text for this slice
		this.text = json.text;
		// The text for the token
		this.description = json.description || json.text;
		// Associated data
		this.item = json.item || null;
		this.part = json.part || null;
		this.price = json.price || 0;
		// Slices that can be added after this one
		this._next = json.next || [];
		// Whether this slice can be the end of the intent
		this.isEnd = json.isEnd != null
			? json.isEnd
			: this.next.length === 0;
	}

	get specialClasses() {
		switch (this.id) {
			case 'end': return 'end-slice';
			default: return '';
		}
	}

	get next() {
		return this._next.filter(x => !State.intent.includes(x));
	}
	set next(x) {
		this._next = x;
	}

	addNext(other) {
		this._next.push(other);
	}

	get token() {
		if (!this._token) {
			this._token = this.createToken();
		}
		return this._token;
	}

	createToken() {
		return $new('span.token')
			.text(this.description)
			.on('click', () => {
				// If the intent is followed by narration
				if (State.intentElement.nextSibling.hasClass('narrator')) {
					// Stop here
					return;
				}
				// Capture locations of current tokens
				const tokens = new Map();
				for (let token of State.intentElement.children) {
					tokens.set(token, Transition.snapshot(token));
				}
				// Remove every token up to and including this one
				for (let i = State.intent.length; i --; ) {
					const slice = State.intent[i];
					slice.token.remove();
					if (slice === this) {
						State.intent.splice(i);
						break;
					}
				}
				// Load this token and its siblings again
				State.showSlices(this.siblings, {
					skipAnimationFor: this
				});
				// Animate the changes to the tokens
				const el = this.token;
				for (let [token, snapshot] of tokens) {
					if (token === el) {
						// Animate this slice from its token
						Transition.from(this.textElement, snapshot, 500, {
							aspectRatio: 'height'
						});
					} else {
						Transition.from(token, snapshot, 500, {
							aspectRatio: 'none'
						});
					}
				}
			})
			.element();
	}

	get element() {
		 if (!this._element) {
			this._element = this.createElement();
		}
		return this._element;
	}

	get textElement() {
		return this.element.$child.text;
	}

	createElement() {
		return $new('.slice')
			.class(this.specialClasses)
			.append(
				$new('span.text')
					.name('text')
					.text(this.text)
			)
			.on('click', () => State.addSlice(this))
			.element();
	}
}