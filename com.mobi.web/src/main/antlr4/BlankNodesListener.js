/*-
 * #%L
 * com.mobi.web
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
var MOSListener = require('./../../../target/generated-sources/antlr4/MOSListener');

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
        var bnode = addBNode(prefixes.owl + 'Class', this);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'unionOf', list: true, numChildren: ctx.conjunction().length, children: []};
        if (hasParentNode(ctx, this)) {
            var obj = getParentNode(ctx, this);
            addValueToBNode(obj, {'@id': bnode['@id']}, this);
        }
    } else {
        pass(ctx, this);
    }
};
BlankNodesListener.prototype.enterConjunction = function(ctx) {
    if (ctx.AND_LABEL().length > 0) {
        var bnode = addBNode(prefixes.owl + 'Class', this);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'intersectionOf', list: true, numChildren: ctx.primary().length, children: []};
        if (hasParentNode(ctx, this)) {
            var obj = getParentNode(ctx, this);
            addValueToBNode(obj, {'@id': bnode['@id']}, this);
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
                addIdToListNode(parent, bnode['@id'], this);
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
            var iri = getFullIRI(ctx, this);
            if (parent.list) {
                addIdToListNode(parent, iri, this);
            } else {
                if (parent.prop === prefixes.owl + 'allValuesFrom' || parent.prop === prefixes.owl + 'someValuesFrom' || parent.prop === prefixes.owl + 'complementOf') {
                    util.setPropertyId(parent.bnode, parent.prop, iri);
                } else {
                    util.setPropertyId(parent.bnode, prefixes.owl + 'onClass', iri);
                }
            }
        } else if (ctx.individualList()) {
            var bnode = addBNode(prefixes.owl + 'Class', this);
            util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.individualList().individual().length, children: []};
        } else {
            this.map[ctx.invokingState] = parent;
        }
    } else {
        if (ctx.individualList()) {
            var bnode = addBNode(prefixes.owl + 'Class', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.individualList().individual().length, children: []};
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
            var bnode = addBNode(prefixes.rdfs + 'Datatype', this);
            util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.literalList().literal().length, children: []};
        } else {
            this.map[ctx.invokingState] = parent;
        }
    } else {
        if (ctx.literalList()) {
            var bnode = addBNode(prefixes.rdfs + 'Datatype', this);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.literalList().literal().length, children: []};
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
        addIdToListNode(parent, bnode['@id'], this);
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
    var iriObj = {'@id': getFullIRI(ctx, this)};
    addValueToBNode(parent, iriObj, this);
};
BlankNodesListener.prototype.exitTypedLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var type = ctx.dataType().getText();
    if (type.substr(0, 'xsd:'.length) === 'xsd:') {
        type = type.replace('xsd:', prefixes.xsd);
    } else {
        type = type.replace('<', '').replace('>', '');
    }
    var valueObj = {'@value': ctx.lexicalValue().getText().replace(/\"/g, ''), '@type': type};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitStringLiteralNoLanguage = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText().replace(/\"/g, '')};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitStringLiteralWithLanguage = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.children[0].getText().replace(/\"/g, ''), '@language': ctx.children[1].getText().replace('@', '')};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitIntegerLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'integer'};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitDecimalLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'decimal'};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitFloatingPointLiteral = function(ctx) {
    var parent = getParentNode(ctx, this);
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'float'};
    addValueToBNode(parent, valueObj, this);
};
BlankNodesListener.prototype.exitNonNegativeInteger = function(ctx) {
    var parent = getParentNode(ctx, this);
    parent.bnode[parent.prop] = [{'@value': ctx.getText(), '@type': prefixes.xsd + 'nonNegativeInteger'}];
};

var createBNode = function(type) {
    return {'@id': util.getSkolemizedIRI(), '@type': [type]};
}
var setOnProperty = function(ctx, self) {
    var bnode = self.map[ctx.parentCtx.invokingState].bnode;
    util.setPropertyId(bnode, prefixes.owl + 'onProperty', getFullIRI(ctx, self));
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
var addIdToListNode = function(mapItem, iri, self) {
    addObjToListNode(mapItem, {'@id': iri}, self);
}
var addObjToListNode = function(mapItem, valueObj, self) {
    if (mapItem.numChildren > 1) {
        var listBnode = addBNode(prefixes.rdf + 'List', self);
        listBnode[prefixes.rdf + 'first'] = [valueObj];
        if (mapItem.children.length === 0) {
            mapItem.bnode[mapItem.prop] = [{'@id': listBnode['@id']}];
        } else {
            var previousListBnode = mapItem.children[mapItem.children.length - 1];
            previousListBnode[prefixes.rdf + 'rest'] = [{'@id': listBnode['@id']}];
            if (mapItem.children.length === mapItem.numChildren - 1) {
                listBnode[prefixes.rdf + 'rest'] = [{'@list': []}];
            }
        }
        mapItem.children.push(listBnode);
    } else {
        mapItem.bnode[mapItem.prop] = [{'@list': [valueObj]}];
    }
}
var addValueToBNode = function(mapItem, valueObj, self) {
    if (mapItem.list) {
        addObjToListNode(mapItem, valueObj, self);
    } else {
        mapItem.bnode[mapItem.prop] = [valueObj];
    }
}
var getFullIRI = function(ctx, self) {
    var localName = ctx.getText();
    var iri = self.localNames[localName];
    if (!iri) {
        throw 'line ' + ctx.start.line + ':' + ctx.start.column + ' - "' + localName + '" does not correspond to a known IRI';
    }
    return iri;
}

exports.BlankNodesListener = BlankNodesListener;