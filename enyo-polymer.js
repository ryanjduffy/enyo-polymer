(function (enyo) {
	if(!enyo) return;
	
	function getPublished(ctor) {
		if(ctor) {
			return enyo.mixin(enyo.clone(ctor.prototype.published), getPublished(ctor.prototype.base));
		} else {
			return {};
		}
	}

	enyo.dispatcher.connect = function(_doc) {
		var doc = _doc || document;
		var d = enyo.dispatcher, i, n;
		for (i=0; (n=d.events[i]); i++) {
			d.listen(doc, n);
		}
		for (i=0; (n=d.windowEvents[i]); i++) {
			// Chrome Packaged Apps don't like "unload"
			if(n === "unload" &&
			   (typeof window.chrome === "object") &&
			   window.chrome.app) {
				continue;
			}
			
			d.listen(window, n);
		}
	}
	
	enyo.Control.prototype.getDocument = function() {
		var c = this.container;
		this.document = this.document || (c && c.getDocument && c.getDocument()) || document;
		return this.document;
	}
	
	enyo.Control.prototype.findNodeById = function() {
		return this.id && (this.node = enyo.dom.byId(this.id, this.getDocument()));
	},

	enyo.registerAsWebComponent = function(ctor, config) {
		config = enyo.mixin({
			// because content will only be inserted once, if a kind provides an instance of enyo.Content
			// injecting another enyo.Content will have no effect (unless the provided is scoped by select)
			// by making the default true, any kind can be easily wrapped as a web component and only disabled
			// if the provider wants to ignore any consumer-provided content
			wrapContent: true,
			
			// default tag is the kindName (swapping . for -)
			tag: ctor.prototype.kindName.replace(".", "-")
		}, config);
		
		// ensure tag starts with x-
		//if(config.tag.indexOf("x-") !== 0) {
		//    config.tag = "x-"+config.tag;
		//}
		
		var e = Object.create(HTMLElement.prototype);
		e.createdCallback = function() {

			// retrieve published enyo properties (including all inherited)
			this.enyoPublished = getPublished(ctor);
			
			// filter node attributes by published
			var props = {};
			var attr = this.attributes;
			for(var i=0, l=attr.length;i<l; i++) {
				var a = attr.item(i);
				if(this.enyoPublished.hasOwnProperty(a.name)) {
					props[a.name] = a.value;
				}
			}
			
			if(config.wrapContent) {
				props.components = [
					{kind:"enyo.Content"}
				];
			}

			// create the enyo instance
			this.enyoInstance = new ctor(props);
			
			// wire a callback to update node attributes when published properties are changed
			enyo.forEach(Object.keys(this.enyoPublished), function(prop) {
				this.enyoInstance.addObserver(prop, function(prev, value, property) {
					this.setAttribute(property, this.enyoInstance[property]);
				}, this);
			}, this);

			var wcProps = enyo.mixin({
				applyAuthorStyles: true,
				resetStyleInheritance: false
			}, this.enyoInstance.webComponent);

			// render the instance
			var shadow = this.createShadowRoot();

			enyo.dispatcher.connect(shadow);
			this.enyoInstance.document = shadow;
			this.enyoInstance.renderInto(shadow);
		};

		// dispatch node attribute changes to the enyo instance
		e.attributeChangedCallback = function(name, oldValue) {
			if(this.enyoPublished.hasOwnProperty(name)) {
				this.enyoInstance.set(name, this.getAttribute(name));
			}
		};

		// register the enyo kind as a web component
		var tag = config.tag.toLowerCase();
		if(tag.indexOf("-") == -1) {
			tag = "x-" + tag;
		}

		document.registerElement(tag, {
			prototype: e
		});
	};
	
	enyo.kind.features.push(function(ctor, props) {
		if(props.webComponent) {
			enyo.registerAsWebComponent(ctor, {
				tag: props.webComponent.tag,
				wrapContent: props.webComponent.wrapContent
			});
		}
		
	});
	
	enyo.kind({
		name:"enyo.Content",
		tag: "content",
		published: {
			select: null
		},
		create: function() {
			this.inherited(arguments);
			this.selectChanged();
		},
		selectChanged: function() {
			this.setAttribute("select", this.select);
		}
	});

	enyo.mixin(enyo.gesture, {
		getDocument: function(inEvent) {
			var n = inEvent.target;
			var doc;
			while(n) {
				if(n instanceof Document || n instanceof DocumentFragment) {
					return n;
				}
				
				n = n.parentNode;
			}
		},
		documents: [],
		getDocumentIndex: function(inEvent) {
			// WeakMap would be nice here instead
			var doc = this.getDocument(inEvent);
			var docIndex = enyo.indexOf(this.documents, doc);
			if(docIndex === -1) {
				this.documents.push(doc);
				docIndex = this.documents.length-1;
			}
			return docIndex;   
		},
		state: [],
		set: function(inEvent, name, value) {
			var i = this.getDocumentIndex(inEvent);
			var s = this.state[i] = this.state[i] || {};
			s[name] = value;
		},
		get: function(inEvent, name) {
			var i = this.getDocumentIndex(inEvent);
			var s = this.state[i];
			return s && s[name];
		},
		down: function(inEvent) {
			// set holdpulse defaults
			this.drag.holdPulseConfig = enyo.clone(this.drag.holdPulseDefaultConfig);

			// cancel any hold since it's possible in corner cases to get a down without an up
			var e = this.makeEvent("down", inEvent);

			// expose method for configuring holdpulse options
			e.configureHoldPulse = this.configureHoldPulse;

			enyo.dispatch(e);
			this.set(e, "downEvent", e);

			// workaround to allow event to propagate to control before hold job begins
			this.drag.cancelHold();
			this.drag.beginHold(e);
		},
		move: function(inEvent) {
			var downEvent = this.get(inEvent, "downEvent");
			
			var e = this.makeEvent("move", inEvent);
			// include delta and direction v. down info in move event
			e.dx = e.dy = e.horizontal = e.vertical = 0;
			if (e.which && downEvent) {
				e.dx = inEvent.clientX - downEvent.clientX;
				e.dy = inEvent.clientY - downEvent.clientY;
				e.horizontal = Math.abs(e.dx) > Math.abs(e.dy);
				e.vertical = !e.horizontal;
			}
			enyo.dispatch(e);
		},
		up: function(inEvent) {
			var e = this.makeEvent("up", inEvent);
			var tapPrevented = false;
			var downEvent = this.get(inEvent, "downEvent");
			
			e.preventTap = function() {
				tapPrevented = true;
			};
			enyo.dispatch(e);
			if (!tapPrevented && downEvent && downEvent.which == 1) {
				this.sendTap(e);
			}
			
			this.set(inEvent, "downEvent", null);
		},
		sendTap: function(inEvent) {
			// The common ancestor for the down/up pair is the origin for the tap event
			var downEvent = this.get(inEvent, "downEvent");
			var t = this.findCommonAncestor(downEvent.target, inEvent.target);
			if (t) {
				var e = this.makeEvent("tap", inEvent);
				e.target = t;
				enyo.dispatch(e);
			}
		},
	});

})(window.enyo);