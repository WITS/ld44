/// Stores information about the current session & updates UI
class QuotientState {

	constructor() {
		this.counter = 0;
		this.status = 'travel';
		this.player = new Player();
		this.opponent = null;
		this.messages = [];
		// The slices in the current intent
		this.intent = [];
		this.slices = [];
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
		// TODO: show merchants occasionally
		++ this.counter;
		State.startBattle(new Enemy(createEnemy()));
	}

	startBattle(other) {
		this.status = 'battle';
		this.opponent = other;
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
					? `${cat} the ${other.name}`
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
		let item = null;
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
		// If the player isn't dead
		if (this.player.health > 0) {
			// If the opponent is done for
			if (this.opponent.health <= 0) {
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
				await this.pushMessage(`You defeated the ${this.opponent.name}!`, {
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

	// Ends a turn
	endTurn() {
		// Branch based on status
		switch (this.status) {
			case 'battle': this.stepBattle(); break;
			default: break;
		}
	}

	createElement() {
		return $new('.quotient')
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