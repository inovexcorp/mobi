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
        var bnode = createBNode(prefixes.owl + 'Class');
        bnode[prefixes.owl + 'unionOf'] = [{'@list': []}];
        this.arr.push(bnode);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'unionOf', list: true};
        if (hasParentNode(ctx, this)) {
            var obj = this.map[ctx.parentCtx.invokingState];
            util.setPropertyId(obj.bnode, obj.prop, bnode['@id']);
        }
    } else {
        pass(ctx, this);
    }
};
BlankNodesListener.prototype.enterConjunction = function(ctx) {
    if (ctx.AND_LABEL().length > 0) {
        var bnode = createBNode(prefixes.owl + 'Class');
        bnode[prefixes.owl + 'intersectionOf'] = [{'@list': []}];
        this.arr.push(bnode);
        this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'intersectionOf', list: true};
    } else {
        pass(ctx, this);
    }
};
BlankNodesListener.prototype.enterPrimary = function(ctx) {
    if (hasParentNode(ctx, this)) {
        inheritParentNode(ctx, this);
    } else {
        if (ctx.NOT_LABEL()) {
            var bnode = createBNode(prefixes.owl + 'Class');
            this.arr.push(bnode);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'complementOf'};
        }
    }
};
BlankNodesListener.prototype.enterAtomic = function(ctx) {
    if (hasParentNode(ctx, this)) {
        var obj = this.map[ctx.parentCtx.invokingState];
        if (ctx.classIRI()) {
            var iri = this.localNames[ctx.getText()];
            if (obj.list) {
                obj.bnode[obj.prop][0]['@list'].push({'@id': iri});
            } else {
                if (obj.prop === prefixes.owl + 'allValuesFrom' || obj.prop === prefixes.owl + 'someValuesFrom' || obj.prop === prefixes.owl + 'complementOf') {
                    util.setPropertyId(obj.bnode, obj.prop, iri);
                } else {
                    util.setPropertyId(obj.bnode, prefixes.owl + 'onClass', iri);
                }
            }
        } else if (ctx.individualList()) {
            var bnode = createBNode(prefixes.owl + 'Class');
            bnode[prefixes.owl + 'oneOf'] = [{'@list': []}];
            this.arr.push(bnode);
            util.setPropertyId(obj.bnode, obj.prop, bnode['@id']);
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        } else {
            this.map[ctx.invokingState] = obj;
        }
    } else {
        if (ctx.individualList()) {
            var bnode = createBNode(prefixes.owl + 'Class');
            bnode[prefixes.owl + 'oneOf'] = [{'@list': []}];
            this.arr.push(bnode);
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
        var obj = this.map[ctx.parentCtx.invokingState];
        if (ctx.literalList()) {
            var bnode = createBNode(prefixes.rdfs + 'Datatype');
            bnode[prefixes.owl + 'oneOf'] = [{'@list': []}];
            this.arr.push(bnode);
            obj.bnode[obj.prop] = [{'@id': bnode['@id']}];
            this.map[ctx.invokingState] = {bnode, prop: prefixes.owl + 'oneOf', list: true};
        } else {
            this.map[ctx.invokingState] = obj;
        }
    } else {
        if (ctx.literalList()) {
            var bnode = createBNode(prefixes.rdfs + 'Datatype');
            bnode[prefixes.owl + 'oneOf'] = [{'@list': []}];
            this.arr.push(bnode);
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
    var bnode = createBNode(prefixes.owl + 'Restriction');
    if (hasParentNode(ctx, this)) {
        var obj = this.map[ctx.parentCtx.invokingState];
        obj.bnode[obj.prop][0]['@list'].push({'@id': bnode['@id']});
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

    this.arr.push(bnode);
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
    var obj = this.map[ctx.parentCtx.invokingState];
    var iriObj = {'@id': this.localNames[ctx.getText()]};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(iriObj);
    } else {
        obj.bnode[obj.prop] = [iriObj];
    }
};
BlankNodesListener.prototype.exitStringLiteralNoLanguage = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    var valueObj = {'@value': ctx.getText().replace(/\"/g, "")};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(valueObj);
    } else {
        obj.bnode[obj.prop] = [valueObj];
    }
};
BlankNodesListener.prototype.exitStringLiteralWithLanguage = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    var valueObj = {'@value': ctx.children[0].getText().replace(/\"/g, ""), '@language': ctx.children[1].getText().replace("@", "")};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(valueObj);
    } else {
        obj.bnode[obj.prop] = [valueObj];
    }
};
BlankNodesListener.prototype.exitIntegerLiteral = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'integer'};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(valueObj);
    } else {
        obj.bnode[obj.prop] = [valueObj];
    }
};
BlankNodesListener.prototype.exitDecimalLiteral = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'decimal'};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(valueObj);
    } else {
        obj.bnode[obj.prop] = [valueObj];
    }
};
BlankNodesListener.prototype.exitFloatingPointLiteral = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    var valueObj = {'@value': ctx.getText(), '@type': prefixes.xsd + 'float'};
    if (obj.list) {
        obj.bnode[obj.prop][0]['@list'].push(valueObj);
    } else {
        obj.bnode[obj.prop] = [valueObj];
    }
};
BlankNodesListener.prototype.exitNonNegativeInteger = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    obj.bnode[obj.prop] = [{'@value': ctx.getText(), '@type': prefixes.xsd + 'nonNegativeInteger'}];
};

var createBNode = function(type) {
    return {'@id': util.getIdForBlankNode(), '@type': [type]};
}
var setOnProperty = function(ctx, self) {
    var bnode = self.map[ctx.parentCtx.invokingState].bnode;
    util.setPropertyId(bnode, prefixes.owl + 'onProperty', self.localNames[ctx.getText()]);
}
var hasParentNode = function(ctx, self) {
    return ctx.parentCtx && self.map[ctx.parentCtx.invokingState];
}
var inheritParentNode = function(ctx, self) {
    self.map[ctx.invokingState] = self.map[ctx.parentCtx.invokingState];
}
var pass = function(ctx, self) {
    if (hasParentNode(ctx, self)) {
        inheritParentNode(ctx, self);
    }
}

exports.BlankNodesListener = BlankNodesListener;