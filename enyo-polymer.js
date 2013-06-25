(function (enyo) {
    if(!enyo) return;
    
    function getPublished(ctor) {
        if(ctor) {
            return enyo.mixin(enyo.clone(ctor.prototype.published), getPublished(ctor.prototype.base));
        } else {
            return {};
        }
    }

    function connect(doc) {
        var d = enyo.getDocument();
        enyo.setDocument(doc);
        enyo.dispatcher.connect();
        enyo.setDocument(d);
    }

    enyo.registerAsWebComponent = function(ctor, tag) {
        var e = Object.create(HTMLElement.prototype);
        e.readyCallback = function() {

            // retrieve published enyo properties (including all inherited)
            this.enyoPublished = getPublished(ctor);
            
            // filter node attributes by published
            var props = {};
            enyo.forEach(this.attributes, function(a) {
                if(this.enyoPublished.hasOwnProperty(a.name)) {
                    props[a.name] = a.value;
                }
            }, this);
            
            // create the enyo instance
            this.enyoInstance = new ctor(props);
            
            // wire a callback to update node attributes when published properties are changed
            enyo.forEach(Object.keys(this.enyoPublished), function(prop) {
                this.enyoInstance.addObserver(prop, function(property, prev, value) {
                    this.setAttribute(property, this.enyoInstance[property]);
                }, this);
            }, this);

            var wcProps = enyo.mixin({
                applyAuthorStyles: true,
                resetStyleInheritance: false
            }, this.enyoInstance.webComponent);

            // render the instance
            var shadow = this.createShadowRoot();
            shadow.applyAuthorStyles = wcProps.applyAuthorStyles;
            shadow.resetStyleInheritance = wcProps.resetStyleInheritance;

            connect(shadow);
            this.enyoInstance.renderInto(shadow);
        };

        // dispatch node attribute changes to the enyo instance
        e.attributeChangedCallback = function(name, oldValue) {
            if(this.enyoPublished.hasOwnProperty(name)) {
                this.enyoInstance.set(name, this.getAttribute(name));
            }
        };

        if(tag) {
            if(tag.indexOf("x-") !== 0) {
                tag = "x-" + tag;
            }
        } else {
            tag = "x-" + ctor.prototype.kindName.replace(".", "-");
        }

        // register the enyo kind as a web component
        document.register(tag.toLowerCase(), {
            prototype: e
        });
    }
    
    enyo.kind.features.push(function(ctor, props) {
        if(props.webComponent) {
            enyo.registerAsWebComponent(ctor, props.webComponent.tag);
        }
        
    });
})(window.enyo);