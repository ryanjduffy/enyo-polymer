enyo.kind({
    name: "MyKind",
    kind: "Control",
    webComponent: true,
    published: {
        color: "green",
        label: "Enyo + Polymer"
    },
    events: {
        
    },
    components: [
        {tag: "h1", name: "label"},
        {name:"color", style:"font-weight:bold"},
        {kind:"onyx.Button", content:"Set Color = Red", onclick:"red"},
        //{tag:"onyx-button", content:"Blue (onyx-button element)", onclick:"blue"}
    ],
    create:function() {
        this.inherited(arguments);
        this.colorChanged();
        this.labelChanged();
    },
    colorChanged:function() {
        this.$.color.setContent(this.color);
        this.$.color.applyStyle("color", this.color)
    },
    labelChanged:function() {
        this.$.label.setContent(this.label);
    },
    red: function() {
        this.setColor("Red");
    },
    blue: function() {
        this.setColor("Blue");
    }
});


enyo.kind({
    name:"ex.Hello",
    classes:"hello",
    webComponent: {
        tag: "hello"
    },
    published: {
        color: "red"
    },
    components:[
        {classes:"top", content:"Hello, my name is"},
        {classes:"name", components:[
            {kind:"enyo.Content"}
        ]},
        {classes:"bottom"},
        {name:"style", kind:"extras.Style", css:{
            ".hello": {"margin":"20px", "border-radius":"40px","border":"3px solid","text-align":"center","overflow":"hidden","max-width":"300px"},
            ".top": {"padding":"20px 10px","font-size":"20px","color":"white"},
            ".name": {"padding":"20px 10px","font-size":"32px"},
            ".bottom": {"height":"30px"}
        }}
    ],
    create: function() {
        this.inherited(arguments);
        this.colorChanged();
    },
    colorChanged: function(oldColor) {
        this.$.style.set(".hello", {"border-color": this.color});
        this.$.style.set(".top, .bottom", {"background-color": this.color});
    }
});

enyo.kind({
    name:"extras.Style",
    kind:"Control",
    tag:"style",
    published:{
        css:0,
        media:"",
        prefix:""
    },
    create:function() {
        this.inherited(arguments);
        this.cssChanged();
    },
    cssChanged:function() {
        var s = [], l = "{", r = "}", c = ":", n = ";", w = " ";
        for(var k in this.css) {
            this.prefix && s.push(this.prefix,w)
            s.push(k,l);
            for(var j in this.css[k]) {
                s.push(j,c,this.css[k][j],n);
            }
            s.push(r);
        }

        if(this.media) {
            s.unshift("@media ", this.media, l);
            s.push(r);
        }

        this._css = s.join("");
        this.hasNode() && this.render();
    },
    mediaChanged:function() {
        this.cssChanged();
    },
    prefixChanged:function() {
        this.cssChanged();
    },
    getInnerHtml:function() {
        return this._css;
    },
    generateInnerHtml:function() {
        return this._css;
    },
    set:function(selector, css) {
        var c;
        if(this.css === 0) {
            this.css = {};
        }
        
        if(!this.css[selector]) this.css[selector] = {};
        var c = this.css[selector];

        // custom mixin that delete when value === null
        for(var k in css) {
            if(css[k] === null && c[k]) {
                delete c[k];
            } else {
                c[k] = css[k];
            }
        }
        
        this.cssChanged();
        this.render();
    }
});