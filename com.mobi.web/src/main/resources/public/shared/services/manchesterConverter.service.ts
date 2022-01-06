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
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker'
import { MOSLexer } from '../../vendor/antlr4/dist/MOSLexer';
import { MOSParser } from '../../vendor/antlr4/dist/MOSParser';
import { MOSListener } from '../../vendor/antlr4/dist/MOSListener';
import BlankNodesListener from '../../vendor/antlr4/BlankNodesListener';
import BlankNodesErrorListener from '../../vendor/antlr4/BlankNodesErrorListener';
import {on} from "cluster";

manchesterConverterService.$inject = ['$filter', 'ontologyManagerService', 'prefixes', 'utilService'];

/**
 * @ngdoc service
 * @name shared.service:manchesterConverterService
 * @requires $filter
 * @requires shared.service:prefixes
 * @requires shared.service:ontologyManagerService
 *
 * @description
 * `manchesterConverterService` is a service that provides utility functions for converting JSON-LD
 * blank nodes into Manchester Syntax and vice versa.
 */
// function manchesterConverterService($filter, ontologyManagerService, prefixes, utilService, antlr) {
function manchesterConverterService($filter, ontologyManagerService, prefixes, utilService) {
    var self = this;
    var om = ontologyManagerService;
    var util = utilService;
    var expressionClassName = 'manchester-expr';
    var restrictionClassName = 'manchester-rest';
    var literalClassName = 'manchester-lit';
    var expressionKeywords = {
        [prefixes.owl + 'unionOf']: ' or ', // A or B
        [prefixes.owl + 'intersectionOf']: ' and ', // A and B
        [prefixes.owl + 'complementOf']: 'not ', // not A
        [prefixes.owl + 'oneOf']: ', ' // {a1 a2 ... an}.
    };
        // a - the object property on which the restriction applies.
        // b - the restriction on the property values.
        // n - the cardinality of the restriction.
    var restrictionKeywords = {
        [prefixes.owl + 'someValuesFrom']: ' some ', // a some b
        [prefixes.owl + 'allValuesFrom']: ' only ', // a only b
        [prefixes.owl + 'hasValue']: ' value ', // a value b
        [prefixes.owl + 'minCardinality']: ' min ', // a min n
        [prefixes.owl + 'maxCardinality']: ' max ', // a max n
        [prefixes.owl + 'cardinality']: ' exactly ', // a exactly n
        [prefixes.owl + 'minQualifiedCardinality']: ' min ', // a min n b
        [prefixes.owl + 'maxQualifiedCardinality']: ' max ', // a max n b
        [prefixes.owl + 'qualifiedCardinality']: ' exactly ' // a exactly n b
    };
    var datatypeKeywords = {
        [prefixes.owl + 'oneOf']: ', ' // {a1 a2 ... an}.
    }

    /**
     * @ngdoc method
     * @name getKeywords
     * @methodOf shared.service:manchesterConverterService
     *
     * @description
     * Returns the full list of supported Manchester Syntax keywords.
     *
     * @return {string[]} An array of strings contains the Manchester Syntax keywords that are supported.
     */
    self.getKeywords = function() {
        return concat(filter(map(values(expressionKeywords), trim), identity), map(values(expressionKeywords), trim));
    }
    /**
     * @ngdoc method
     * @name manchesterToJsonld
     * @methodOf shared.service:manchesterConverterService
     *
     * @description
     * Converts a Manchester Syntax string into an array of blank nodes using an ANTLR4 grammer parser and
     * the provided map of local names to full IRIs. If the subject of the axiom for the represented blank
     * node is a data property, it must be indicated by the last argument. Currently supports class
     * expressions with "unionOf", "intersectionOf", and "complementOf", restrictions with "someValuesFrom",
     * "allValuesFrom", "hasValue", "minCardinality", "maxCardinality", "cardinality",
     * "minQualifiedCardinality", "maxQualifiedCardinality", and "qualifiedCardinality", and datatypes with
     * "oneOf".
     *
     * @return {Object} An object with a key containing any error message thrown and a key for the resuling
     * array of blank nodes.
     */
    self.manchesterToJsonld = function(str, localNameMap, dataProp = false) {
        var result = {errorMessage: '', jsonld: []};
        var chars = new ANTLRInputStream(str);
        var lexer = new MOSLexer(chars);
        var tokens  = new CommonTokenStream(lexer);
        var parser = new MOSParser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(new BlankNodesErrorListener(result));
        var blankNodes: MOSListener = new BlankNodesListener(result.jsonld, localNameMap, prefixes, util);
        var start = dataProp ? parser.dataRange() : parser.description();
        try {
            ParseTreeWalker.DEFAULT.walk(blankNodes, start);
        } catch (ex) {
            result.errorMessage = get(ex, 'message', ex);
            result.jsonld = undefined;
        }
        return result;
    }
    /**
     * @ngdoc method
     * @name jsonldToManchester
     * @methodOf shared.service:manchesterConverterService
     *
     * @description
     * Converts a blank node identified by the passed id and included in the passed JSON-LD array into a
     * Manchester Syntax string. Includes the Manchester Syntax string for nested blank nodes as well.
     * Currently supports class expressions with "unionOf", "intersectionOf", and "complementOf",
     * restrictions with "someValuesFrom", "allValuesFrom", "hasValue", "minCardinality", "maxCardinality",
     * "cardinality", "minQualifiedCardinality", "maxQualifiedCardinality", and "qualifiedCardinality", and
     * datatypes with "oneOf". Can optionally surround keywords and literals with HTML tags for formatting
     * displays.
     *
     * @param {string} id The IRI of the blank node to begin with
     * @param {Object[]} jsonld A JSON-LD array of all blank node in question and any supporting blanks
     * nodes needed for the display
     * @param {Object} index An index of entity ids to objects containing the array position of that entity
     * in the jsonld array
     * @param {boolean} html Whether or not the resulting string should include HTML tags for formatting
     * @return {string} A string containing the converted blank node with optional HTML tags for formatting
     */
    self.jsonldToManchester = function(id, jsonld, index, html = false) {
        return render(id, jsonld, index, html);
    }

    function render(id, jsonld, index, html, listKeyword = '') {
        var entity = jsonld[index[id].position];
        var result = '';
        if (om.isClass(entity)) {
            result = renderClass(entity, jsonld, index, html);
        } else if (om.isRestriction(entity)) {
            result = renderRestriction(entity, jsonld, index, html);
        } else if (om.isDatatype(entity)) {
            result = renderDatatype(entity, jsonld, index, html);
        }
        return result === '' ? id : result;
    }
    function renderClass(entity, jsonld, index, html) {
        var result = '';
        var prop = intersection(Object.keys(entity), Object.keys(expressionKeywords));
        if (prop.length === 1) {
            var item = head(entity[prop[0]]);
            var keyword = expressionKeywords[prop[0]];
            if (html && prop[0] !== prefixes.owl + 'oneOf') {
                keyword = surround(keyword, expressionClassName);
            }
            if (includes([prefixes.owl + 'unionOf', prefixes.owl + 'intersectionOf', prefixes.owl + 'oneOf'], prop[0])) {
                if (has(item, '@list')) {
                    for (var i = 0; i < item['@list'].length; i++) {
                        i == 0 ? result += getValue(item['@list'][i], jsonld, index, html) : result += keyword + getValue(item['@list'][i], jsonld, index, html);
                    }
                } else {
                    result += renderList(item['@id'], jsonld, index, html, keyword);
                }
            } else {
                result += keyword + getValue(item, jsonld, index, html);
            }
            if (prop[0] === prefixes.owl + 'oneOf') {
                result = '{' + result + '}';
            }
        }
        return result;
    }
    function renderRestriction(entity, jsonld, index, html) {
        var result = '';
        var onProperty = util.getPropertyId(entity, prefixes.owl + 'onProperty');
        var onClass = util.getPropertyId(entity, prefixes.owl + 'onClass');
        if (onProperty) {
            var propertyRestriction = $filter('splitIRI')(onProperty).end;
            var classRestriction = onClass ? $filter('splitIRI')(onClass).end : undefined;
            if (om.isBlankNodeId(onClass)) {
                var bNodeEntity = find(jsonld, {'@id': onClass});
                if (bNodeEntity) {
                    var bNodeClassStr = renderClass(bNodeEntity, jsonld, index, html);
                    classRestriction = bNodeClassStr ? '(' + bNodeClassStr + ')': classRestriction;
                }
            }
            var prop = intersection(Object.keys(entity), Object.keys(restrictionKeywords));
            if (prop.length === 1) {
                var item = head(entity[prop[0]]);
                var keyword = html ? surround(restrictionKeywords[prop[0]], restrictionClassName) : restrictionKeywords[prop[0]];
                if (has(item, '@list')) {
                    var itemListObject = item['@list'][0];
                    result += propertyRestriction + keyword + getValue(itemListObject, jsonld, index, html) + (classRestriction ? ' ' + classRestriction : '');
                } else {
                    result += propertyRestriction + keyword + getValue(item, jsonld, index, html) + (classRestriction ? ' ' + classRestriction : '');
                }
            }
        }
        return result;
    }
    function renderDatatype(entity, jsonld, index, html) {
        var result = '';
        var prop = intersection(Object.keys(entity), Object.keys(datatypeKeywords));
        if (prop.length === 1 && prop[0] === prefixes.owl + 'oneOf') {
            var item = head(entity[prop[0]]);
            var separator = datatypeKeywords[prop[0]];
            if (has(item, '@list')) {
                result += getValue(item['@list'][0], jsonld, index, html, separator);
            } else {
                result += renderList(item['@id'], jsonld, index, html, separator);
            }
            result = '{' + result + '}';
        }
        return result;
    }
    function getValue(item, jsonld, index, html, listKeyword = '') {
        if (has(item, '@value')) {
            var literal, lang = '';
            if (has(item, '@language')) {
                literal = '"' + item['@value'] + '"';
                lang = '@' + item['@language'];
            } else {
                switch (get(item, '@type', prefixes.xsd + 'string')) {
                    case prefixes.xsd + 'decimal':
                    case prefixes.xsd + 'double':
                    case prefixes.xsd + 'float':
                    case prefixes.xsd + 'int':
                    case prefixes.xsd + 'integer':
                    case prefixes.xsd + 'long':
                    case prefixes.xsd + 'nonNegativeInteger':
                        literal = item['@value'];
                        break;
                    case prefixes.xsd + 'string':
                        literal = '"' + item['@value'] + '"';
                        break;
                    case prefixes.xsd + 'language':
                    case prefixes.xsd + 'anyURI':
                    case prefixes.xsd + 'dateTime':
                    case prefixes.rdfs + 'Literal':
                    case prefixes.xsd + 'boolean':
                    case prefixes.xsd + 'byte':
                        literal = '"' + item['@value'] + '"^^xsd:' + get(item, '@type').replace(prefixes.xsd, '');
                        break;
                    default:
                        literal = '"' + item['@value'] + '"^^<' + get(item, '@type') + '>';
                }
            }
            return (html ? surround(literal, literalClassName) : literal) + lang;
        } else {
            var value = get(item, '@id');
            if (!om.isBlankNodeId(value)) {
                return $filter('splitIRI')(value).end;
            }
            return listKeyword ? render(value, jsonld, index, html, listKeyword) : '(' + render(value, jsonld, index, html) + ')';
        }
    }
    function surround(str, className): string {
        if (str.trim() !== '') {
            return '<span class="' + className + '">' + str + '</span>';
        }
        return str;
    }
    function renderList(startId, jsonld, index, html, listKeyword) {
        var result = '';
        var id = startId;
        var end = false;
        while (!end) {
            var entity = jsonld[index[id].position];
            var first = head(entity[prefixes.rdf + 'first']);
            var rest = head(entity[prefixes.rdf + 'rest']);
            result += getValue(first, jsonld, index, html);
            if (has(rest, '@list')) {
                if (rest['@list'][0]) {
                    result += listKeyword;
                    result += getValue(rest['@list'][0], jsonld, index, html);
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

export default manchesterConverterService;
