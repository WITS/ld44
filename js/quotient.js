/// Stores information about the current session & updates UI
class QuotientState {

	constructor() {
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

	get narratorElement() {
		return this.element.$child.narrator;
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

	pushMessage(text) {
		this.messages.push(text);
		this.narratorElement.textContent = text;
	}

	startBattle(other) {
		this.opponent = other;
		State.pushMessage(`You nearly bump into a ${other.name}`);
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
				text: x.description,
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
		this.intentElement.append(slice.token);
		// Transition the slice to the token
		Transition.from(slice.token, Transition.snapshot(slice.textElement), 500, {
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
		if (this.lastSlice.id === 'end') {
			// TODO
		} else {
			// Update the currently visible slices
			this.showSlices(slice.next);
		}
	}

	createElement() {
		return $new('.quotient')
			.append(
				$new('.narrator').name('narrator'),
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