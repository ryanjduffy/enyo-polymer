enyo.kind({
    name: "MyKind",
    kind: "Control",
    published: {
        color: "green",
        label: "Enyo + Polymer - Getting the band back together"
    },
    events: {
        
    },
    components: [
        {name:"label"},
        {name:"color", style:"font-weight:bold"},
        {kind:"Button", content:"Set Color = Red", ontap:"tapped"}
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
    tapped: function() {
        this.setColor("Red");
    }
});

enyo.kind({
    name: "ex.Button",
    kind: "onyx.Button",
    index: 0,
    tap: function() {
        var messages = ["You tapped me", "Clicky Clicky", "Tappy tap tap tap-a-roo"];
        this.setContent(messages[this.index++%messages.length]);
    }
})