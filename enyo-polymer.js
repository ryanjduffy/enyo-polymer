(function registerKindAsWebComponent(enyo) {
    if(!enyo) return;

    function featureHook(ctor, props) {
        var e = Object.create(HTMLElement.prototype);
        e.readyCallback = function() {
            var props = {};
            enyo.forEach(this.attributes, function(a) {
                props[a.name] = a.value;
            });

            this.enyoInstance = new ctor(props);
            this.enyoInstance.renderInto(this);
        }

        e.attributeChangedCallback = function(name, oldValue) {
            var me = this.enyoInstance;
            var value = this.getAttribute(name);
            //if(me.set) {    // >= v2.3
            //    me.set(name, value);
            //} else {        // < v2.3
                me["set"+enyo.cap(name)](value);
            //}
        }

        document.register("x-"+ctor.prototype.kindName.replace(".", "-").toLowerCase(), {
            prototype: e
        });
    }
    
    enyo.kind.features.push(featureHook);
})(window.enyo);