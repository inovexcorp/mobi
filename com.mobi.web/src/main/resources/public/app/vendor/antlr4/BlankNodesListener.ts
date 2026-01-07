/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { OWL, RDF, RDFS, XSD } from '../../prefixes';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { getSkolemizedIRI, setPropertyId } from '../../shared/utility';

class BlankNodesListener implements MOSListener {
    arr: JSONLDObject[];
    localNames: {[key: string]: string};
    map: any;

    constructor(arr: JSONLDObject[], localNames: {[key: string]: string}) {
        this.arr = arr;
        this.localNames = localNames;
        this.map = {};
    }

    enterDescription(ctx: DescriptionContext): void { // Used for unions
        if (ctx.OR_LABEL().length > 0) {
            let parent;
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                parent = this._getParentNode(ctx);
            }
            const bnode = this._addBNode(`${OWL}Class`);
            this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}unionOf`, list: true, numChildren: ctx.conjunction().length, children: []};
            if (parent && parent.bnode['@id'] !== bnode['@id']) {
                this._addValueToBNode(parent, {'@id': bnode['@id']});
            }
        } else {
            this._pass(ctx);
        }
    }

    enterConjunction(ctx: ConjunctionContext): void { // Used for intersections
        if (ctx.AND_LABEL().length > 0) {
            let parent;
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                parent = this._getParentNode(ctx);
            }
            const bnode = this._addBNode(`${OWL}Class`);
            this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}intersectionOf`, list: true, numChildren: ctx.primary().length, children: []};
            if (parent && parent.list && parent.bnode['@id'] !== bnode['@id']) {
                this._addValueToBNode(parent, {'@id': bnode['@id']});
            }
        } else {
            this._pass(ctx);
        }
    }

    enterPrimary(ctx: PrimaryContext): void { // Used for complements
        if (ctx.NOT_LABEL()) {
            let parent;
            if (this._hasParentNode(ctx)) { // Fetch parent first to avoid circular references
                parent = this._getParentNode(ctx);
            }
            const bnode = this._addBNode(`${OWL}Class`);
            this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}complementOf`};
            if (parent && parent.list && parent.bnode['@id'] !== bnode['@id']) {
                this._addIdToListNode(parent, bnode['@id']);
            }
        } else {
            if (this._hasParentNode(ctx)) {
                this._inheritParentNode(ctx);
            }
        }
    }

    enterAtomic(ctx: AtomicContext): void { // Used for IRI references and lists of individuals
        if (this._hasParentNode(ctx)) {
            const parent = this._getParentNode(ctx); // Fetch parent first to avoid circular references
            if (ctx.classIRI()) {
                const iri = this._getFullIRI(ctx);
                if (parent.list) {
                    this._addIdToListNode(parent, iri);
                } else {
                    if (parent.prop === `${OWL}allValuesFrom` || parent.prop === `${OWL}someValuesFrom` || parent.prop === `${OWL}complementOf`) {
                        setPropertyId(parent.bnode, parent.prop, iri);
                    } else {
                        setPropertyId(parent.bnode, `${OWL}onClass`, iri);
                    }
                }
            } else if (ctx.individualList()) {
                const bnode = this._addBNode(`${OWL}Class`);
                setPropertyId(parent.bnode, parent.prop, bnode['@id']);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}oneOf`, list: true, numChildren: ctx.individualList().individual().length, children: []};
            } else {
                this.map[this._getCtxHash(ctx)] = parent;
            }
        } else {
            if (ctx.individualList()) {
                const bnode = this._addBNode(`${OWL}Class`);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}oneOf`, list: true, numChildren: ctx.individualList().individual().length, children: []};
            }
        }
    }

    enterDataRange(ctx: DataRangeContext): void {
        this._pass(ctx);
    }

    enterDataConjunction(ctx: DataConjunctionContext): void {
        this._pass(ctx);
    }

    enterDataPrimary(ctx: DataPrimaryContext): void {
        this._pass(ctx);
    }

    enterDataAtomic(ctx: DataAtomicContext): void { // Used for lists of literals
        if (this._hasParentNode(ctx)) {
            const parent = this._getParentNode(ctx);
            if (ctx.literalList()) {
                const bnode = this._addBNode(`${RDFS}Datatype`);
                setPropertyId(parent.bnode, parent.prop, bnode['@id']);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}oneOf`, list: true, numChildren: ctx.literalList().literal().length, children: []};
            } else {
                this.map[this._getCtxHash(ctx)] = parent;
            }
        } else {
            if (ctx.literalList()) {
                const bnode = this._addBNode(`${RDFS}Datatype`);
                this.map[this._getCtxHash(ctx)] = {bnode, prop: `${OWL}oneOf`, list: true, numChildren: ctx.literalList().literal().length, children: []};
            }
        }
    }

    enterIndividualList(ctx: IndividualListContext): void {
        this._pass(ctx);
    }

    enterLiteralList(ctx: LiteralListContext): void {
        this._pass(ctx);
    }

    enterRestriction(ctx: RestrictionContext): void { // Used to create parent restriction bnodes
        const bnode = this._addBNode(`${OWL}Restriction`);
        if (this._hasParentNode(ctx)) {
            const parent = this._getParentNode(ctx);
            this._addIdToListNode(parent, bnode['@id']);
        }
        let prop;
        if (ctx.MAX_LABEL()) {
            prop = `${OWL}maxCardinality`;
        } else if (ctx.MIN_LABEL()) {
            prop = `${OWL}minCardinality`;
        } else if (ctx.EXACTLY_LABEL()) {
            prop = `${OWL}cardinality`;
        } else if (ctx.ONLY_LABEL()) {
            prop = `${OWL}allValuesFrom`;
        } else if (ctx.SOME_LABEL()) {
            prop = `${OWL}someValuesFrom`;
        } else if (ctx.VALUE_LABEL()) {
            prop = `${OWL}hasValue`;
        }
    
        this.map[this._getCtxHash(ctx)] = {bnode, prop};
    
    }

    enterLiteral(ctx: LiteralContext): void {
        this._pass(ctx);
    }
    
    exitObjectPropertyExpression(ctx: ObjectPropertyContext): void {
        this._setOnProperty(ctx);
    }

    exitDataPropertyExpression(ctx: DataPropertyExpressionContext): void {
        this._setOnProperty(ctx);
    }

    exitIndividual(ctx: IndividualContext): void {
        const parent = this._getParentNode(ctx);
        const iriObj = {'@id': this._getFullIRI(ctx)};
        this._addValueToBNode(parent, iriObj);
    }

    exitTypedLiteral(ctx: TypedLiteralContext): void {
        const parent = this._getParentNode(ctx);
        let type = ctx.dataType().text;
        if (type.substr(0, 'xsd:'.length) === 'xsd:') {
            type = type.replace('xsd:', XSD);
        } else {
            type = type.replace('<', '').replace('>', '');
        }
        const valueObj = {'@value': ctx.lexicalValue().text.replace(/"/g, ''), '@type': type};
        this._addValueToBNode(parent, valueObj);
    }

    exitStringLiteralNoLanguage(ctx: StringLiteralNoLanguageContext): void {
        const parent = this._getParentNode(ctx);
        const valueObj = {'@value': ctx.text.replace(/"/g, '')};
        this._addValueToBNode(parent, valueObj);
    }

    exitStringLiteralWithLanguage(ctx: StringLiteralWithLanguageContext): void {
        const parent = this._getParentNode(ctx);
        const valueObj = {'@value': ctx.children[0].text.replace(/"/g, ''), '@language': ctx.children[1].text.replace('@', '')};
        this._addValueToBNode(parent, valueObj);
    }

    exitIntegerLiteral(ctx: IntegerLiteralContext): void {
        const parent = this._getParentNode(ctx);
        const valueObj = {'@value': ctx.text, '@type': `${XSD}integer`};
        this._addValueToBNode(parent, valueObj);
    }

    exitDecimalLiteral(ctx: DecimalLiteralContext): void {
        const parent = this._getParentNode(ctx);
        const valueObj = {'@value': ctx.text, '@type': `${XSD}decimal`};
        this._addValueToBNode(parent, valueObj);
    }

    exitFloatingPointLiteral(ctx: FloatingPointLiteralContext): void {
        const parent = this._getParentNode(ctx);
        const valueObj = {'@value': ctx.text, '@type': `${XSD}float`};
        this._addValueToBNode(parent, valueObj);
    }

    exitNonNegativeInteger(ctx: NonNegativeIntegerContext): void {
        const parent = this._getParentNode(ctx);
        parent.bnode[parent.prop] = [{'@value': ctx.text, '@type': `${XSD}nonNegativeInteger`}];
    }

    private _createBNode(type) {
        return {'@id': getSkolemizedIRI(), '@type': [type]};
    }

    private _setOnProperty(ctx: ParserRuleContext) {
        const bnode = this.map[this._getCtxHash(ctx.parent)].bnode;
        setPropertyId(bnode, `${OWL}onProperty`, this._getFullIRI(ctx));
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
        const bnode = this._createBNode(type);
        this.arr.push(bnode);
        return bnode;
    }

    private _addIdToListNode(mapItem, iri) {
        this._addObjToListNode(mapItem, {'@id': iri});
    }

    private _addObjToListNode(mapItem, valueObj) {
        if (mapItem.numChildren > 1) { // If the parent node has more than one child
            // Create rdf:List bnode
            const listBnode = this._addBNode(`${RDF}List`);
            listBnode[`${RDF}first`] = [valueObj];
            if (mapItem.children.length === 0) { // If this is the first item in the list
                mapItem.bnode[mapItem.prop] = [{'@id': listBnode['@id']}]; // Add bnode of the list to the parent node with the specified property
            } else { // If this is not the first item in the list
                const previousListBnode = mapItem.children[mapItem.children.length - 1]; // Get the child bnode right before this
                previousListBnode[`${RDF}rest`] = [{'@id': listBnode['@id']}];  // Add link to the previous bnode
                if (mapItem.children.length === mapItem.numChildren - 1) { // If this is the last item in the list
                    listBnode[`${RDF}rest`] = [{'@list': []}];
                }
            }
            mapItem.children.push(listBnode); // Add generated bnode to children of parent node
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
        const localName = ctx.text;
        const iri = this.localNames[localName];
        if (!iri) {
            throw `line ${ctx.start.line}:${ctx.start.startIndex} - "${localName}" does not correspond to a known IRI`;
        }
        return iri;
    }

    private _getCtxHash(ctx: ParserRuleContext) {
        return this._hash(ctx.text, ctx.start);
    }

    private _hash(...args: any[]) {
        let h = 0, i = 0;
        if (args.length === 1) {
            for (i = 0; i < args[0].length; i++) {
                h = (h * 31 + args[0].charCodeAt(i)) & 0xffffffff;
            }
        } else {
            for (const i in args) {
                h ^= this._hash(args[i]);
            }
        }
    
        return h;
    }
}

export default BlankNodesListener;
