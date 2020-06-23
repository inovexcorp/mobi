/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { MOSListener } from './dist/MOSListener';
import { DescriptionContext, ConjunctionContext, PrimaryContext, AtomicContext, DataRangeContext, DataConjunctionContext, DataPrimaryContext, DataAtomicContext, IndividualListContext, LiteralListContext, RestrictionContext, LiteralContext, ObjectPropertyContext, DataPropertyContext, DataPropertyExpressionContext, IndividualContext, TypedLiteralContext, StringLiteralNoLanguageContext, StringLiteralWithLanguageContext, IntegerLiteralContext, DecimalLiteralContext, FloatingPointLiteralContext, NonNegativeIntegerContext } from './dist/MOSParser';
import { ParserRuleContext } from 'antlr4ts';

var prefixes, util;

class BlankNodesListener implements MOSListener {
    arr: any;
    localNames: any;
    map: {};

    constructor(arr, localNames, prefixesService, utilService) {
        this.arr = arr;
        this.localNames = localNames;
        this.map = {};
        prefixes = prefixesService;
        util = utilService;
    }

    enterDescription = function(ctx: DescriptionContext) { // Used for unions
        if (ctx.OR_LABEL().length > 0) {
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                var parent = this._getParentNode(ctx);
            }
            var bnode = this._addBNode(prefixes.owl + 'Class');
            this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'unionOf', list: true, numChildren: ctx.conjunction().length, children: []};
            if (parent && parent.bnode['@id'] !== bnode['@id']) {
                this._addValueToBNode(parent, {'@id': bnode['@id']});
            }
        } else {
            this._pass(ctx);
        }
    }

    enterConjunction = function(ctx: ConjunctionContext) { // Used for intersections
        if (ctx.AND_LABEL().length > 0) {
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                var parent = this._getParentNode(ctx);
            }
            var bnode = this._addBNode(prefixes.owl + 'Class');
            this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'intersectionOf', list: true, numChildren: ctx.primary().length, children: []};
            if (parent && parent.list && parent.bnode['@id'] !== bnode['@id']) {
                this._addValueToBNode(parent, {'@id': bnode['@id']});
            }
        } else {
            this._pass(ctx);
        }
    }

    enterPrimary = function(ctx: PrimaryContext) { // Used for complements
        if (ctx.NOT_LABEL()) {
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                var parent = this._getParentNode(ctx);
            }
            var bnode = this._addBNode(prefixes.owl + 'Class');
            this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'complementOf'};
            if (parent && parent.list && parent.bnode['@id'] !== bnode['@id']) {
                this._addIdToListNode(parent, bnode['@id']);
            }
        } else {
            if (this._hasParentNode(ctx)) {
                this._inheritParentNode(ctx);
            }
        }
    }

    enterAtomic = function(ctx: AtomicContext) { // Used for IRI references and lists of individuals
        if (this._hasParentNode(ctx)) {
            var parent = this._getParentNode(ctx); // Fetch parent first to avoid circular references
            if (ctx.classIRI()) {
                var iri = this._getFullIRI(ctx);
                if (parent.list) {
                    this._addIdToListNode(parent, iri);
                } else {
                    if (parent.prop === prefixes.owl + 'allValuesFrom' || parent.prop === prefixes.owl + 'someValuesFrom' || parent.prop === prefixes.owl + 'complementOf') {
                        util.setPropertyId(parent.bnode, parent.prop, iri);
                    } else {
                        util.setPropertyId(parent.bnode, prefixes.owl + 'onClass', iri);
                    }
                }
            } else if (ctx.individualList()) {
                var bnode = this._addBNode(prefixes.owl + 'Class');
                util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.individualList().individual().length, children: []};
            } else {
                this.map[this._getCtxHash(ctx)] = parent;
            }
        } else {
            if (ctx.individualList()) {
                var bnode = this._addBNode(prefixes.owl + 'Class');
                this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.individualList().individual().length, children: []};
            }
        }
    }

    enterDataRange = function(ctx: DataRangeContext) {
        this._pass(ctx);
    }

    enterDataConjunction = function(ctx: DataConjunctionContext) {
        this._pass(ctx);
    }

    enterDataPrimary = function(ctx: DataPrimaryContext) {
        this._pass(ctx);
    }

    enterDataAtomic = function(ctx: DataAtomicContext) { // Used for lists of literals
        if (this._hasParentNode(ctx)) {
            var parent = this._getParentNode(ctx);
            if (ctx.literalList()) {
                var bnode = this._addBNode(prefixes.rdfs + 'Datatype');
                util.setPropertyId(parent.bnode, parent.prop, bnode['@id']);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.literalList().literal().length, children: []};
            } else {
                this.map[this._getCtxHash(ctx)] = parent;
            }
        } else {
            if (ctx.literalList()) {
                var bnode = this._addBNode(prefixes.rdfs + 'Datatype');
                this.map[this._getCtxHash(ctx)] = {bnode, prop: prefixes.owl + 'oneOf', list: true, numChildren: ctx.literalList().literal().length, children: []};
            }
        }
    }

    enterIndividualList = function(ctx: IndividualListContext) {
        this._pass(ctx);
    }

    enterLiteralList = function(ctx: LiteralListContext) {
        this._pass(ctx);
    }

    enterRestriction = function(ctx: RestrictionContext) { // Used to create parent restriction bnodes
        var bnode = this._addBNode(prefixes.owl + 'Restriction');
        if (this._hasParentNode(ctx)) {
            var parent = this._getParentNode(ctx);
            this._addIdToListNode(parent, bnode['@id']);
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
    
        this.map[this._getCtxHash(ctx)] = {bnode, prop};
    
    }

    enterLiteral = function(ctx: LiteralContext) {
        this._pass(ctx);
    }
    
    exitObjectPropertyExpression = function(ctx: ObjectPropertyContext) {
        this._setOnProperty(ctx);
    }

    exitDataPropertyExpression = function(ctx: DataPropertyExpressionContext) {
        this._setOnProperty(ctx);
    }

    exitIndividual = function(ctx: IndividualContext) {
        var parent = this._getParentNode(ctx);
        var iriObj = {'@id': this._getFullIRI(ctx)};
        this._addValueToBNode(parent, iriObj);
    }

    exitTypedLiteral = function(ctx: TypedLiteralContext) {
        var parent = this._getParentNode(ctx);
        var type = ctx.dataType().text;
        if (type.substr(0, 'xsd:'.length) === 'xsd:') {
            type = type.replace('xsd:', prefixes.xsd);
        } else {
            type = type.replace('<', '').replace('>', '');
        }
        var valueObj = {'@value': ctx.lexicalValue().text.replace(/\"/g, ''), '@type': type};
        this._addValueToBNode(parent, valueObj);
    }

    exitStringLiteralNoLanguage = function(ctx: StringLiteralNoLanguageContext) {
        var parent = this._getParentNode(ctx);
        var valueObj = {'@value': ctx.text.replace(/\"/g, '')};
        this._addValueToBNode(parent, valueObj);
    }

    exitStringLiteralWithLanguage = function(ctx: StringLiteralWithLanguageContext) {
        var parent = this._getParentNode(ctx);
        var valueObj = {'@value': ctx.children[0].text.replace(/\"/g, ''), '@language': ctx.children[1].text.replace('@', '')};
        this._addValueToBNode(parent, valueObj);
    }

    exitIntegerLiteral = function(ctx: IntegerLiteralContext) {
        var parent = this._getParentNode(ctx);
        var valueObj = {'@value': ctx.text, '@type': prefixes.xsd + 'integer'};
        this._addValueToBNode(parent, valueObj);
    }

    exitDecimalLiteral = function(ctx: DecimalLiteralContext) {
        var parent = this._getParentNode(ctx);
        var valueObj = {'@value': ctx.text, '@type': prefixes.xsd + 'decimal'};
        this._addValueToBNode(parent, valueObj);
    }

    exitFloatingPointLiteral = function(ctx: FloatingPointLiteralContext) {
        var parent = this._getParentNode(ctx);
        var valueObj = {'@value': ctx.text, '@type': prefixes.xsd + 'float'};
        this._addValueToBNode(parent, valueObj);
    }

    exitNonNegativeInteger = function(ctx: NonNegativeIntegerContext) {
        var parent = this._getParentNode(ctx);
        parent.bnode[parent.prop] = [{'@value': ctx.text, '@type': prefixes.xsd + 'nonNegativeInteger'}];
    }

    private _createBNode(type) {
        return {'@id': util.getSkolemizedIRI(), '@type': [type]};
    }

    private _setOnProperty(ctx: ParserRuleContext) {
        var bnode = this.map[this._getCtxHash(ctx.parent)].bnode;
        util.setPropertyId(bnode, prefixes.owl + 'onProperty', this._getFullIRI(ctx));
    }

    private _getParentNode(ctx: ParserRuleContext) {
        return this.map[this._getCtxHash(ctx.parent)];
    }

    private _hasParentNode(ctx: ParserRuleContext) {
        return ctx.parent && this._getParentNode(ctx);
    }

    private _inheritParentNode(ctx: ParserRuleContext) {
        this.map[this._getCtxHash(ctx)] = this._getParentNode(ctx);
    }

    private _pass(ctx: ParserRuleContext) {
        if (this._hasParentNode(ctx)) {
            this._inheritParentNode(ctx);
        }
    }

    private _addBNode(type) {
        var bnode = this._createBNode(type);
        this.arr.push(bnode);
        return bnode;
    }

    private _addIdToListNode(mapItem, iri) {
        this._addObjToListNode(mapItem, {'@id': iri});
    }

    private _addObjToListNode(mapItem, valueObj) {
        if (mapItem.numChildren > 1) { // If the parent node has more than one child
            if (mapItem.children.length === 0) { // If this is the first item in the list
                var listBnode = this._addBNode(prefixes.rdf + 'List');
                listBnode[prefixes.rdf + 'first'] = [valueObj]; // Create the starting bnode of the list
                mapItem.bnode[mapItem.prop] = [{'@id': listBnode['@id']}]; // Add bnode of the list to the parent node with the specified property
                mapItem.children.push(listBnode);
            } else { // If this is not the first item in the list
                var previousListBnode = mapItem.children[mapItem.children.length - 1]; // Get the child bnode right before this
                if (mapItem.children.length === mapItem.numChildren - 1) { // If this is the last item in the list
                    previousListBnode[prefixes.rdf + 'rest'] = [{'@list': [valueObj]}]; // Update the rdf:rest property on the previous bnode
                } else { // If this is not the last item in the list
                    var listBnode = this._addBNode(prefixes.rdf + 'List');
                    listBnode[prefixes.rdf + 'first'] = [valueObj]; // Create the bnode of the list
                    previousListBnode[prefixes.rdf + 'rest'] = [{'@id': listBnode['@id']}]; // Link to the previous bnode
                    mapItem.children.push(listBnode);
                }
            }
        } else { // If parent node only has one child, set as value
            mapItem.bnode[mapItem.prop] = [{'@list': [valueObj]}]; 
        }
    }

    private _addValueToBNode(mapItem, valueObj) {
        if (mapItem.list) {
            this._addObjToListNode(mapItem, valueObj);
        } else {
            mapItem.bnode[mapItem.prop] = [valueObj];
        }
    }

    private _getFullIRI(ctx: ParserRuleContext) {
        var localName = ctx.text;
        var iri = this.localNames[localName];
        if (!iri) {
            throw 'line ' + ctx.start.line + ':' + ctx.start.startIndex + ' - "' + localName + '" does not correspond to a known IRI';
        }
        return iri;
    }

    private _getCtxHash(ctx: ParserRuleContext) {
        return this._hash(ctx.text, ctx.start);
    }

    private _hash(...args: any[]) {
        var h=0, i=0;
        if (args.length == 1) {
            for (i = 0; i < args[0].length; i++) {
                h = (h * 31 + args[0].charCodeAt(i)) & 0xffffffff;
            }
        } else {
            for (let i in args) {
                h ^= this._hash(args[i]);
            }
        }
    
        return h;
    }
}

export default BlankNodesListener;