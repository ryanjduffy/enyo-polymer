(function registerKindAsWebComponent(enyo) {
    if(!enyo) return;
    
    function getPublished(ctor) {
        if(ctor) {
            return enyo.mixin(enyo.clone(ctor.prototype.published), getPublished(ctor.prototype.base));
        } else {
            return {};
        }
    }

    function featureHook(ctor, props) {
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
            
            // render the instance
            this.enyoInstance.renderInto(this);
        };

        // dispatch node attribute changes to the enyo instance
        e.attributeChangedCallback = function(name, oldValue) {
            if(this.enyoPublished.hasOwnProperty(name)) {
                this.enyoInstance.set(name, this.getAttribute(name));
            }
        };

        // register the enyo kind as a web component
        document.register("x-"+ctor.prototype.kindName.replace(".", "-").toLowerCase(), {
            prototype: e
        });
    }
    
    enyo.kind.features.push(featureHook);
})(window.enyo);