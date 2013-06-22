(function (enyo) {
    if(!enyo) return;
    
    function getPublished(ctor) {
        if(ctor) {
            return enyo.mixin(enyo.clone(ctor.prototype.published), getPublished(ctor.prototype.base));
        } else {
            return {};
        }
    }

    enyo.registerAsWebComponent = function(ctor) {
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

            var content = this.innerHTML;
            if(content) {
                props.allowHtml = true;
                props.content = content;
            }
            
            // create the enyo instance
            this.enyoInstance = new ctor(props);
            
            // wire a callback to update node attributes when published properties are changed
            enyo.forEach(Object.keys(this.enyoPublished), function(prop) {
                this.enyoInstance.addObserver(prop, function(property, prev, value) {
                    this.setAttribute(property, this.enyoInstance[property]);
                }, this);
            }, this);
            
            // render the instance
            this.enyoInstance.node = this;
            this.enyoInstance.generated = true;
            this.enyoInstance.id = this.id;
            this.enyoInstance.render();
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
    
    enyo.kind.features.push(function(ctor, props) {
        enyo.registerAsWebComponent(ctor);
    });
})(window.enyo);