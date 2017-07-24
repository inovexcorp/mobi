/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
var MOSListener = require('./generated/MOSListener');

var prefixes, util;

var BlankNodesListener = function(arr, localNames, prefixesService, utilService) {
    this.arr = arr;
    this.localNames = localNames;
    this.map = {};
    prefixes = prefixesService;
    util = utilService;
    MOSListener.MOSListener.call(this);
    return this;
}

// inherit default listener
BlankNodesListener.prototype = Object.create(MOSListener.MOSListener.prototype);
BlankNodesListener.prototype.constructor = BlankNodesListener;

// override default listener behavior
BlankNodesListener.prototype.enterDescription = function(ctx) {
    if (ctx.OR_LABEL().length > 0) {
        var bnode = addBNodeWithList(prefixes.owl + 'Class', prefixes.owl + 'unionOf', this);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'unionOf', list: true};
        if (hasParentNode(ctx, this)) {
            var obj = getParentNode(ctx, this);
            addValueToBNode(obj, {'@id': bnode['@id']});
        }
    } else {
        pass(ctx, this);
    }
};
BlankNodesListener.prototype.enterConjunction = function(ctx) {
    if (ctx.AND_LABEL().length > 0) {
        var bnode = addBNodeWithList(prefixes.owl + 'Class', prefixes.owl + 'intersectionOf', this);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'intersectionOf', list: true};
        if (hasParentNode(ctx, this)) {
            var obj = getParentNode(ctx, this);
            addValueToBNode(obj, {'@id': bnode['@id']});
        }
    } else {
        pass(ctx, this);
    }
};
BlankNodesListener.prototype.enterPrimary = function(ctx) {
    if (hasParentNode(ctx, this)) {
        if (ctx.NOT_LABEL()) {
            var bnode = addBNode(prefixes.owl + 'Class', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'complementOf'};
            var parent = getParentNode(ctx, this);
            if (parent.list) {
                addIdToList(parent.bnode, parent.prop, bnode['@id']);
            }
        } else {
            inheritParentNode(ctx, this);
        }
    } else {
        if (ctx.NOT_LABEL()) {
            var bnode = addBNode(prefixes.owl + 'Class', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'complementOf'};
        }
    }
};
BlankNodesListener.prototype.enterAtomic = function(ctx) {
    if (hasParentNode(ctx, this)) {
        var parent = getParentNode(ctx, this);
        if (ctx.classIRI()) {
            var iri = this.localNames[ctx.getText()];
            if (parent.list) {
                addIdToList(parent.bnode, parent.prop, iri);
            } else {
                if (parent.prop === prefixes.owl + 'allValuesFrom' || parent.prop === prefixes.owl + 'someValuesFrom' || parent.prop === prefixes.owl + 'complementOf') {
                    util.setPropertyId(parent.bnode, parent.prop, iri);
                } else {
                    util.setPropertyId(parent.bnode, prefixes.owl + 'onClass', iri);
                }
            }
        } else if (ctx.individualList()) {
            var bnode = addBNodeWithList(prefixes.owl + 'Class', prefixes.owl + 'oneOf', this);
            util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        } else {
            this.map[ctx.invokingState] = parent;
        }
    } else {
        if (ctx.individualList()) {
            var bnode = addBNodeWithList(prefixes.owl + 'Class', prefixes.owl + 'oneOf', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        }
    }
};
BlankNodesListener.prototype.enterDataRange = function(ctx) {
    pass(ctx, this);
};
BlankNodesListener.prototype.enterDataConjunction = function(ctx) {
    pass(ctx, this);
};
BlankNodesListener.prototype.enterDataPrimary = function(ctx) {
    pass(ctx, this);
};
BlankNodesListener.prototype.enterDataAtomic = function(ctx) {
    if (hasParentNode(ctx, this)) {
        var parent = getParentNode(ctx, this);
        if (ctx.literalList()) {
            var bnode = addBNodeWithList(prefixes.rdfs + 'Datatype', prefixes.owl + 'oneOf', this);
            util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        } else {
            this.map[ctx.invokingState] = parent;
        }
    } else {
        if (ctx.literalList()) {
            var bnode = addBNodeWithList(prefixes.rdfs + 'Datatype', prefixes.owl + 'oneOf', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        }
    }
};
BlankNodesListener.prototype.enterIndividualList = function(ctx) {
    pass(ctx, this);
};
BlankNodesListener.prototype.enterLiteralList = function(ctx) {
    pass(ctx, this);
};
BlankNodesListener.prototype.enterRestriction = function(ctx) {
    var bnode = addBNode(prefixes.owl + 'Restriction', this);
    if (hasParentNode(ctx, this)) {
        var parent = getParentNode(ctx, this);
        addIdToList(parent.bnode, parent.prop, bnode['@id']);
    }
    var prop;
    if (ctx.MAX_LABEL()) {
        prop = prefixes.owl + 'maxCardinality';
    } else if (ctx.MIN_LABEL()) {
        prop = prefixes.owl + 'minCardinality';
    } else if (ctx.EXACTLY_LABEL()) {
        prop = prefixes.owl + 'cardinality';
    } else if (ctx.ONLY_LABEL()) {
        prop = prefixes.owl + 'allValuesFrom';
    } else if (ctx.SOME_LABEL()) {
        prop = prefixes.owl + 'someValuesFrom';
    } else if (ctx.VALUE_LABEL()) {
        prop = prefixes.owl + 'hasValue';
    }

    this.map[ctx.invokingState] = {bnode, prop};
};
BlankNodesListener.prototype.enterLiteral = function(ctx) {
    pass(ctx, this);
};

BlankNodesListener.prototype.exitObjectPropertyExpression = function(ctx) {
    setOnProperty(ctx, this);
};
BlankNodesListener.prototype.exitDataPropertyExpression = function(ctx) {
    setOnProperty(ctx, this);
};
BlankNodesListener.prototype.exitIndividual = function(ctx) {
    var parent = getParentNode(ctx, this);
    var iriObj = {'@id': this.localNames[ctx.getText()]};
    addValueToBNode(parent, iriObj);
};
BlankNodesListener.prototype.exitStringLiteralNoLanguage = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText().replace(/\"/g, '')};
    addValueToBNode(parent, valueObj);
};
BlankNodesListener.prototype.exitStringLiteralWithLanguage = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.children[0].getText().replace(/\"/g, ''), '@language': ctx.children[1].getText().replace('@', '')};
    addValueToBNode(parent, valueObj);
};
BlankNodesListener.prototype.exitIntegerLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'integer'};
    addValueToBNode(parent, valueObj);
};
BlankNodesListener.prototype.exitDecimalLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'decimal'};
    addValueToBNode(parent, valueObj);
};
BlankNodesListener.prototype.exitFloatingPointLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'float'};
    addValueToBNode(parent, valueObj);
};
BlankNodesListener.prototype.exitNonNegativeInteger = function(ctx) {
    var parent = getParentNode(ctx, this);
    parent.bnode[parent.prop] = [{'@value': ctx.getText(), '@type': prefixes.xsd + 'nonNegativeInteger'}];
};

var createBNode = function(type) {
    return {'@id': util.getIdForBlankNode(), '@type': [type]};
}
var setOnProperty = function(ctx, self) {
    var bnode = self.map[ctx.parentCtx.invokingState].bnode;
    util.setPropertyId(bnode, prefixes.owl + 'onProperty', self.localNames[ctx.getText()]);
}
var getParentNode = function(ctx, self) {
    return self.map[ctx.parentCtx.invokingState];
}
var hasParentNode = function(ctx, self) {
    return ctx.parentCtx && getParentNode(ctx, self);
}
var inheritParentNode = function(ctx, self) {
    self.map[ctx.invokingState] = getParentNode(ctx, self);
}
var pass = function(ctx, self) {
    if (hasParentNode(ctx, self)) {
        inheritParentNode(ctx, self);
    }
}
var addBNode = function(type, self) {
    var bnode = createBNode(type);
    self.arr.push(bnode);
    return bnode;
}
var addBNodeWithList = function(type, listProp, self) {
    var bnode = addBNode(type, self);
    bnode[listProp] = [{'@list': []}];
    return bnode;
}
var addIdToList = function(obj, prop, id) {
    addObjToList(obj, prop, {'@id': id});
}
var addValueToList = function(obj, prop, value) {
    addObjToList(obj, prop, {'@value': value});
}
var addObjToList = function(obj, prop, valueObj) {
    obj[prop][0]['@list'].push(valueObj);
}
var addValueToBNode = function(mapItem, valueObj) {
    if (mapItem.list) {
        addObjToList(mapItem.bnode, mapItem.prop, valueObj);
    } else {
        mapItem.bnode[mapItem.prop] = [valueObj];
    }
}

exports.BlankNodesListener = BlankNodesListener;