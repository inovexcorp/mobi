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

var idNum = 0;

var BlankNodesListener = function(arr, localNames) {
    this.arr = arr;
    this.localNames = localNames;
    this.map = {};
    MOSListener.MOSListener.call(this);
    return this;
}

// inherit default listener
BlankNodesListener.prototype = Object.create(MOSListener.MOSListener.prototype);
BlankNodesListener.prototype.constructor = BlankNodesListener;

// override default listener behavior
BlankNodesListener.prototype.enterDescription = function(ctx) {
    if (ctx.OR_LABEL().length > 0) {
        var bnode = createBNode('http://www.w3.org/2002/07/owl#Class');
        bnode['http://www.w3.org/2002/07/owl#unionOf'] = [{'@list': []}];
        this.arr.push(bnode);
        this.map[ctx.invokingState] = {bnode, prop: 'http://www.w3.org/2002/07/owl#unionOf', list: true};
        if (ctx.parentCtx && this.map[ctx.parentCtx.invokingState]) {
            var obj = this.map[ctx.parentCtx.invokingState];
            obj.bnode[obj.prop] = [{'@id': bnode['@id']}];
        }
    } else {
        if (ctx.parentCtx && this.map[ctx.parentCtx.invokingState]) {
            this.map[ctx.invokingState] = this.map[ctx.parentCtx.invokingState];
        }
    }
};
BlankNodesListener.prototype.enterConjunction = function(ctx) {
    if (ctx.AND_LABEL().length > 0) {
        var bnode = createBNode('http://www.w3.org/2002/07/owl#Class');
        bnode['http://www.w3.org/2002/07/owl#intersectionOf'] = [{'@list': []}];
        this.arr.push(bnode);
        this.map[ctx.invokingState] = {bnode, prop: 'http://www.w3.org/2002/07/owl#intersectionOf', list: true};
    } else {
        if (ctx.parentCtx && this.map[ctx.parentCtx.invokingState]) {
            this.map[ctx.invokingState] = this.map[ctx.parentCtx.invokingState];
        }
    }
};
BlankNodesListener.prototype.enterPrimary = function(ctx) {
    if (ctx.parentCtx && this.map[ctx.parentCtx.invokingState]) {
        this.map[ctx.invokingState] = this.map[ctx.parentCtx.invokingState];
    }
};
BlankNodesListener.prototype.enterAtomic = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    if (ctx.classIRI()) {
        if (obj.list) {
            obj.bnode[obj.prop][0]['@list'].push({'@id': ctx.getText()});
        } else {
            if (obj.prop === 'http://www.w3.org/2002/07/owl#allValuesFrom' || obj.prop === 'http://www.w3.org/2002/07/owl#someValuesFrom') {
                obj.bnode[obj.prop] = [{'@id': ctx.getText()}];
            } else {
                obj.bnode['http://www.w3.org/2002/07/owl#onClass'] = [{'@id': ctx.getText()}];
            }
        }
    } else {
        this.map[ctx.invokingState] = obj;
    }
};
BlankNodesListener.prototype.enterRestriction = function(ctx) {
    var bnode = createBNode('http://www.w3.org/2002/07/owl#Restriction');
    if (ctx.parentCtx && this.map[ctx.parentCtx.invokingState]) {
        var obj = this.map[ctx.parentCtx.invokingState];
        obj.bnode[obj.prop][0]['@list'].push({'@id': bnode['@id']});
    }
    var prop;
    if (ctx.MAX_LABEL()) {
        prop = 'http://www.w3.org/2002/07/owl#maxCardinality';
    } else if (ctx.MIN_LABEL()) {
        prop = 'http://www.w3.org/2002/07/owl#minCardinality';
    } else if (ctx.EXACTLY_LABEL()) {
        prop = 'http://www.w3.org/2002/07/owl#cardinality';
    } else if (ctx.ONLY_LABEL()) {
        prop = 'http://www.w3.org/2002/07/owl#allValuesFrom';
    } else if (ctx.SOME_LABEL()) {
        prop = 'http://www.w3.org/2002/07/owl#someValuesFrom';
    }

    this.arr.push(bnode);
    this.map[ctx.invokingState] = {bnode, prop};
};


BlankNodesListener.prototype.exitObjectPropertyExpression = function(ctx) {
    var bnode = this.map[ctx.parentCtx.invokingState].bnode;
    var localName = ctx.getText();
    bnode['http://www.w3.org/2002/07/owl#onProperty'] = [{'@id': this.localNames[localName]}];
};
BlankNodesListener.prototype.exitDataPropertyExpression = function(ctx) {
    var bnode = this.map[ctx.parentCtx.invokingState].bnode;
    var localName = ctx.getText();
    bnode['http://www.w3.org/2002/07/owl#onProperty'] = [{'@id': this.localNames[localName]}];
};
BlankNodesListener.prototype.exitNonNegativeInteger = function(ctx) {
    var obj = this.map[ctx.parentCtx.invokingState];
    obj.bnode[obj.prop] = [{'@value': ctx.getText(), '@type': ['http://www.w3.org/2001/XMLSchema#nonNegativeInteger']}];
};

var createBNode = function(type) {
    var bnode = {'@id': '_:genid' + idNum, '@type': [type]};
    idNum++;
    return bnode;
}

exports.BlankNodesListener = BlankNodesListener;