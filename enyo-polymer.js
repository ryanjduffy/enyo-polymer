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

    enyo.registerAsWebComponent = function(ctor, config) {
        config = enyo.mixin({
            // because content will only be inserted once, if a kind provides an instance of enyo.Content
            // injecting another enyo.Content will have no effect (unless the provided is scoped by select)
            // by making the default true, any kind can be easily wrapped as a web component and only disabled
            // if the provider wants to ignore any consumer-provided content
            wrapContent: true,
            
            // default tag is the kindName (prefixed by x- and swapping . for -)
            tag: "x-" + ctor.prototype.kindName.replace(".", "-")
        }, config);
        
        // ensure tag starts with x-
        if(config.tag.indexOf("x-") !== 0) {
            config.tag = "x-"+config.tag;
        }
        
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
            
            if(config.wrapContent) {
                props.components = [
                    {kind:"enyo.Content"}
                ];
            }
            
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

        // register the enyo kind as a web component
        document.register(config.tag.toLowerCase(), {
            prototype: e
        });
    };
    
    enyo.kind.features.push(function(ctor, props) {
        if(props.webComponent) {
            enyo.registerAsWebComponent(ctor, {
                tag:props.webComponent.tag,
                wrapContent:props.webComponent.wrapContent
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
})(window.enyo);