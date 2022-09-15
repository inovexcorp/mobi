/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { concat, map, values, trim, filter, find, identity, get, intersection, head, includes, has,  } from 'lodash';
import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
import { Injectable } from '@angular/core';

import { MOSLexer } from '../../vendor/antlr4/dist/MOSLexer';
import { MOSParser } from '../../vendor/antlr4/dist/MOSParser';
import { MOSListener } from '../../vendor/antlr4/dist/MOSListener';
import BlankNodesListener from '../../vendor/antlr4/BlankNodesListener';
import BlankNodesErrorListener from '../../vendor/antlr4/BlankNodesErrorListener';
import { OntologyManagerService } from './ontologyManager.service';
import { UtilService } from './util.service';
import { OWL, RDF, RDFS, XSD } from '../../prefixes';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';
import { JSONLDObject } from '../models/JSONLDObject.interface';

/**
 * @class shared.ManchesterConverterService
 *
 * A service that provides utility functions for converting JSON-LD blank nodes into Manchester Syntax and vice versa.
 */
@Injectable()
export class ManchesterConverterService {
    expressionClassName = 'manchester-expr';
    restrictionClassName = 'manchester-rest';
    literalClassName = 'manchester-lit';
    expressionKeywords = {
        [OWL + 'unionOf']: ' or ', // A or B
        [OWL + 'intersectionOf']: ' and ', // A and B
        [OWL + 'complementOf']: 'not ', // not A
        [OWL + 'oneOf']: ', ' // {a1 a2 ... an}.
    };
    // a - the object property on which the restriction applies.
    // b - the restriction on the property values.
    // n - the cardinality of the restriction.
    restrictionKeywords = {
        [OWL + 'someValuesFrom']: ' some ', // a some b
        [OWL + 'allValuesFrom']: ' only ', // a only b
        [OWL + 'hasValue']: ' value ', // a value b
        [OWL + 'minCardinality']: ' min ', // a min n
        [OWL + 'maxCardinality']: ' max ', // a max n
        [OWL + 'cardinality']: ' exactly ', // a exactly n
        [OWL + 'minQualifiedCardinality']: ' min ', // a min n b
        [OWL + 'maxQualifiedCardinality']: ' max ', // a max n b
        [OWL + 'qualifiedCardinality']: ' exactly ' // a exactly n b
    };
    datatypeKeywords = {
        [OWL + 'oneOf']: ', ' // {a1 a2 ... an}.
    };

    constructor(private om: OntologyManagerService, private util: UtilService, private splitIRI: SplitIRIPipe) {}

    /**
     * Returns the full list of supported Manchester Syntax keywords.
     *
     * @return {string[]} An array of strings contains the Manchester Syntax keywords that are supported.
     */
    getKeywords(): string[] {
        return concat(filter(map(values(this.expressionKeywords), trim), identity), map(values(this.expressionKeywords), trim));
    }
    /**
     * Converts a Manchester Syntax string into an array of blank nodes using an ANTLR4 grammer parser and
     * the provided map of local names to full IRIs. If the subject of the axiom for the represented blank
     * node is a data property, it must be indicated by the last argument. Currently supports class
     * expressions with "unionOf", "intersectionOf", and "complementOf", restrictions with "someValuesFrom",
     * "allValuesFrom", "hasValue", "minCardinality", "maxCardinality", "cardinality",
     * "minQualifiedCardinality", "maxQualifiedCardinality", and "qualifiedCardinality", and datatypes with
     * "oneOf".
     *
     * @param {string} str The Manchester Syntax string to convert
     * @param {{[key: string]: string}} localNameMap A map of local names to their full IRIs
     * @param {boolean} [dataProp=false] Whether this Manchester Syntax String is for a data property
     * @return {JSONLDObject[]} An object with a key containing any error message thrown and a key for the resulting
     * array of blank nodes.
     */
    manchesterToJsonld(str: string, localNameMap: {[key: string]: string}, dataProp = false): {errorMessage: string, jsonld: JSONLDObject[]} {
        const result = {errorMessage: '', jsonld: []};
        const chars = new ANTLRInputStream(str);
        const lexer = new MOSLexer(chars);
        const tokens  = new CommonTokenStream(lexer);
        const parser = new MOSParser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(new BlankNodesErrorListener(result));
        const blankNodes: MOSListener = new BlankNodesListener(result.jsonld, localNameMap, this.util);
        const start = dataProp ? parser.dataRange() : parser.description();
        try {
            ParseTreeWalker.DEFAULT.walk(blankNodes, start);
        } catch (ex) {
            result.errorMessage = get(ex, 'message', ex);
            result.jsonld = undefined;
        }
        return result;
    }
    /**
     * Converts a blank node identified by the passed id and included in the passed JSON-LD array into a
     * Manchester Syntax string. Includes the Manchester Syntax string for nested blank nodes as well.
     * Currently supports class expressions with "unionOf", "intersectionOf", and "complementOf",
     * restrictions with "someValuesFrom", "allValuesFrom", "hasValue", "minCardinality", "maxCardinality",
     * "cardinality", "minQualifiedCardinality", "maxQualifiedCardinality", and "qualifiedCardinality", and
     * datatypes with "oneOf". Can optionally surround keywords and literals with HTML tags for formatting
     * displays.
     *
     * @param {string} id The IRI of the blank node to begin with
     * @param {JSONLDObject[]} jsonld A JSON-LD array of all blank node in question and any supporting blanks
     * nodes needed for the display
     * @param {Object} index An index of entity ids to objects containing the array position of that entity
     * in the jsonld array
     * @param {boolean} html Whether or not the resulting string should include HTML tags for formatting
     * @return {string} A string containing the converted blank node with optional HTML tags for formatting
     */
    jsonldToManchester(id: string, jsonld: JSONLDObject[], index: {[key: string]: {position: number}}, html = false): string {
        return this._render(id, jsonld, index, html);
    }

    private _render(id, jsonld, index, html, listKeyword = '') {
        const entity = jsonld[index[id].position];
        let result = '';
        if (this.om.isClass(entity)) {
            result = this._renderClass(entity, jsonld, index, html);
        } else if (this.om.isRestriction(entity)) {
            result = this._renderRestriction(entity, jsonld, index, html);
        } else if (this.om.isDatatype(entity)) {
            result = this._renderDatatype(entity, jsonld, index, html);
        }
        return result === '' ? id : result;
    }
    private _renderClass(entity, jsonld, index, html) {
        let result = '';
        const prop = intersection(Object.keys(entity), Object.keys(this.expressionKeywords));
        if (prop.length === 1) {
            const item = head(entity[prop[0]]);
            let keyword = this.expressionKeywords[prop[0]];
            if (html && prop[0] !== OWL + 'oneOf') {
                keyword = this._surround(keyword, this.expressionClassName);
            }
            if (includes([OWL + 'unionOf', OWL + 'intersectionOf', OWL + 'oneOf'], prop[0])) {
                if (has(item, '@list')) {
                    for (let i = 0; i < item['@list'].length; i++) {
                        i === 0 ? result += this._getValue(item['@list'][i], jsonld, index, html) : result += keyword + this._getValue(item['@list'][i], jsonld, index, html);
                    }
                } else {
                    result += this._renderList(item['@id'], jsonld, index, html, keyword);
                }
            } else {
                result += keyword + this._getValue(item, jsonld, index, html);
            }
            if (prop[0] === OWL + 'oneOf') {
                result = '{' + result + '}';
            }
        }
        return result;
    }
    private _renderRestriction(entity, jsonld, index, html) {
        let result = '';
        const onProperty = this.util.getPropertyId(entity, OWL + 'onProperty');
        const onClass = this.util.getPropertyId(entity, OWL + 'onClass');
        if (onProperty) {
            const propertyRestriction = this.splitIRI.transform(onProperty).end;
            let classRestriction = onClass ? this.splitIRI.transform(onClass).end : undefined;
            if (this.om.isBlankNodeId(onClass)) {
                const bNodeEntity = find(jsonld, {'@id': onClass});
                if (bNodeEntity) {
                    const bNodeClassStr = this._renderClass(bNodeEntity, jsonld, index, html);
                    classRestriction = bNodeClassStr ? '(' + bNodeClassStr + ')': classRestriction;
                }
            }
            const prop = intersection(Object.keys(entity), Object.keys(this.restrictionKeywords));
            if (prop.length === 1) {
                const item = head(entity[prop[0]]);
                const keyword = html ? this._surround(this.restrictionKeywords[prop[0]], this.restrictionClassName) : this.restrictionKeywords[prop[0]];
                if (has(item, '@list')) {
                    const itemListObject = item['@list'][0];
                    result += propertyRestriction + keyword + this._getValue(itemListObject, jsonld, index, html) + (classRestriction ? ' ' + classRestriction : '');
                } else {
                    result += propertyRestriction + keyword + this._getValue(item, jsonld, index, html) + (classRestriction ? ' ' + classRestriction : '');
                }
            }
        }
        return result;
    }
    private _renderDatatype(entity, jsonld, index, html) {
        let result = '';
        const prop = intersection(Object.keys(entity), Object.keys(this.datatypeKeywords));
        if (prop.length === 1 && prop[0] === OWL + 'oneOf') {
            const item = head(entity[prop[0]]);
            const separator = this.datatypeKeywords[prop[0]];
            if (has(item, '@list')) {
                result += this._getValue(item['@list'][0], jsonld, index, html, separator);
            } else {
                result += this._renderList(item['@id'], jsonld, index, html, separator);
            }
            result = '{' + result + '}';
        }
        return result;
    }
    private _getValue(item, jsonld, index, html, listKeyword = '') {
        if (has(item, '@value')) {
            let literal, lang = '';
            if (has(item, '@language')) {
                literal = '"' + item['@value'] + '"';
                lang = '@' + item['@language'];
            } else {
                switch (get(item, '@type', XSD + 'string')) {
                    case XSD + 'decimal':
                    case XSD + 'double':
                    case XSD + 'float':
                    case XSD + 'int':
                    case XSD + 'integer':
                    case XSD + 'long':
                    case XSD + 'nonNegativeInteger':
                        literal = item['@value'];
                        break;
                    case XSD + 'string':
                        literal = '"' + item['@value'] + '"';
                        break;
                    case XSD + 'language':
                    case XSD + 'anyURI':
                    case XSD + 'dateTime':
                    case RDFS + 'Literal':
                    case XSD + 'boolean':
                    case XSD + 'byte':
                        literal = '"' + item['@value'] + '"^^xsd:' + get(item, '@type').replace(XSD, '');
                        break;
                    default:
                        literal = '"' + item['@value'] + '"^^<' + get(item, '@type') + '>';
                }
            }
            return (html ? this._surround(literal, this.literalClassName) : literal) + lang;
        } else {
            const value = get(item, '@id');
            if (!this.om.isBlankNodeId(value)) {
                return this.splitIRI.transform(value).end;
            }
            return listKeyword ? this._render(value, jsonld, index, html, listKeyword) : '(' + this._render(value, jsonld, index, html) + ')';
        }
    }
    private _surround(str, className): string {
        if (str.trim() !== '') {
            return '<span class="' + className + '">' + str + '</span>';
        }
        return str;
    }
    private _renderList(startId, jsonld, index, html, listKeyword) {
        let result = '';
        let id = startId;
        let end = false;
        while (!end) {
            const entity = jsonld[index[id].position];
            const first = head(entity[RDF + 'first']);
            const rest = head(entity[RDF + 'rest']);
            result += this._getValue(first, jsonld, index, html);
            if (has(rest, '@list')) {
                if (rest['@list'][0]) {
                    result += listKeyword;
                    result += this._getValue(rest['@list'][0], jsonld, index, html);
                }
                end = true;
            } else {
                result += listKeyword;
                id = rest['@id'];
            }
        }
        return result;
    }
}