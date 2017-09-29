/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Manchester Converter service', function() {
    var manchesterConverterSvc, ontologyManagerSvc, prefixes, splitIRIFilter, antlr;

    beforeEach(function() {
        module('manchesterConverter');
        mockPrefixes();
        mockOntologyManager();
        mockUtil();
        injectSplitIRIFilter();
        module(function($provide) {
            $provide.constant('antlr', {
                antlr4: window.antlr.antlr4,
                MOSLexer: window.antlr.MOSLexer,
                MOSParser: window.antlr.MOSParser,
                BlankNodesListener: window.antlr.BlankNodesListener,
                BlankNodesErrorListener: window.antlr.BlankNodesErrorListener
            });
        });

        inject(function(manchesterConverterService, _ontologyManagerService_, _prefixes_, _utilService_, _splitIRIFilter_, _antlr_) {
            manchesterConverterSvc = manchesterConverterService;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            splitIRIFilter = _splitIRIFilter_;
            antlr = _antlr_;
        });

        ontologyManagerSvc.isBlankNodeId.and.callFake(function(id) {
            return _.includes(id, '_:genid');
        });
        ontologyManagerSvc.isClass.and.callFake(function(obj) {
            return _.includes(obj['@type'], prefixes.owl + 'Class');
        });
        ontologyManagerSvc.isDatatype.and.callFake(function(obj) {
            return _.includes(obj['@type'], prefixes.rdfs + 'Datatype');
        });
        ontologyManagerSvc.isRestriction.and.callFake(function(obj) {
            return _.includes(obj['@type'], prefixes.owl + 'Restriction');
        });
        splitIRIFilter.and.callFake(function(str) {
            return {end: str};
        });
        utilSvc.getPropertyId.and.callFake(function(obj, prop) {
            return _.get(obj[prop], "[0]['@id']", '');
        });
    });

    describe('should convert a Manchester syntax string into JSON-LD', function() {
        var str, idx, expected,
            localNameMap = {
                'ClassA': 'http://test.com/ClassA',
                'ClassB': 'http://test.com/ClassB',
                'PropA': 'http://test.com/PropA',
                'PropB': 'http://test.com/PropB',
                'PropC': 'http://test.com/PropC',
                'PropD': 'http://test.com/PropD',
                'PropE': 'http://test.com/PropE',
                'IndvA': 'http://test.com/IndvA',
                'IndvB': 'http://test.com/IndvB',
            };
        beforeEach(function() {
            idx = 0;
            utilSvc.getSkolemizedIRI.and.callFake(function() {
                var id = '_:genid' + idx;
                idx++;
                return id;
            });
            utilSvc.setPropertyId.and.callFake(function(obj, prop, value) {
                obj[prop] = [{'@id': value}];
            });
        });
        it('unless the string is invalid', function() {
            str = '1 test 2';
            var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toBeTruthy();
        });
        it('unless an invalid local name is used', function() {
            str = 'test min 0';
            var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toContain('"test" does not correspond to a known IRI');
        });
        describe('if given a class expression', function() {
            beforeEach(function() {
                expected = [{'@id': '_:genid0', '@type': [prefixes.owl + 'Class']}];
            });
            it('with unionOf', function() {
                expected.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] } );
                expected.push({ '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] } );
                expected[0][prefixes.owl + 'unionOf'] = [{ '@id': '_:genid1' }];
                expected[1][prefixes.rdf + 'first'] = [{ '@id': localNameMap['ClassA'] }];
                expected[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                expected[2][prefixes.rdf + 'first'] = [{ '@id': localNameMap['ClassB'] }];
                expected[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                str = 'ClassA or ClassB';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with intersectionOf', function() {
                expected.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] } );
                expected.push({ '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] } );
                expected[0][prefixes.owl + 'intersectionOf'] = [{ '@id': '_:genid1' }];
                expected[1][prefixes.rdf + 'first'] = [{ '@id': localNameMap['ClassA'] }];
                expected[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                expected[2][prefixes.rdf + 'first'] = [{ '@id': localNameMap['ClassB'] }];
                expected[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                str = 'ClassA and ClassB';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with complementOf', function() {
                expected[0][prefixes.owl + 'complementOf'] = [{'@id': localNameMap['ClassA']}];
                str = 'not ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with oneOf', function() {
                expected.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] } );
                expected.push({ '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] } );
                expected[0][prefixes.owl + 'oneOf'] = [{ '@id': '_:genid1' }];
                expected[1][prefixes.rdf + 'first'] = [{ '@id': localNameMap['IndvA'] }];
                expected[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                expected[2][prefixes.rdf + 'first'] = [{ '@id': localNameMap['IndvB'] }];
                expected[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                str = '{IndvA, IndvB}';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                expected = [{'@id': '_:genid0', '@type': [prefixes.owl + 'Restriction']}];
                expected[0][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropA']}];
            });
            it('with someValuesFrom', function() {
                expected[0][prefixes.owl + 'someValuesFrom'] = [{'@id': localNameMap['ClassA']}];
                str = 'PropA some ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with someValuesFrom', function() {
                expected[0][prefixes.owl + 'allValuesFrom'] = [{'@id': localNameMap['ClassA']}];
                str = 'PropA only ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        str = 'PropA value "test"@en';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                        expect(result.jsonld).toEqual(expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('without a language or type', function() {
                        expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'test'}];
                        str = 'PropA value "test"';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                        expect(result.jsonld).toEqual(expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a prefixed type', function() {
                        expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': prefixes.xsd + 'boolean'}];
                        str = 'PropA value "true"^^xsd:boolean';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                        expect(result.jsonld).toEqual(expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a unprefixed type', function() {
                        expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': 'http://test.com/datatype'}];
                        str = 'PropA value "true"^^<http://test.com/datatype>';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                        expect(result.jsonld).toEqual(expected);
                        expect(result.errorMessage).toEqual('');
                    });
                });
                it('and a resource', function() {
                    expected[0][prefixes.owl + 'hasValue'] = [{'@id': localNameMap['ClassA']}];
                    str = 'PropA value ClassA';
                    var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                    expect(result.jsonld).toEqual(expected);
                    expect(result.errorMessage).toEqual('');
                });
            });
            it('with minCardinality', function() {
                expected[0][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA min 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                expected[0][prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA max 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                expected[0][prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA exactly 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with minCardinality', function() {
                expected[0][prefixes.owl + 'onClass'] = [{'@id': localNameMap['ClassA']}];
                expected[0][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA min 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                expected[0][prefixes.owl + 'onClass'] = [{'@id': localNameMap['ClassA']}];
                expected[0][prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA max 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                expected[0][prefixes.owl + 'onClass'] = [{'@id': localNameMap['ClassA']}];
                expected[0][prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                str = 'PropA exactly 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                expected = [{'@id': '_:genid0', '@type': [prefixes.rdfs + 'Datatype']}];
            });
            it('with oneOf', function() {
                expected.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] } );
                expected.push({ '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] } );
                expected[0][prefixes.owl + 'oneOf'] = [{ '@id': '_:genid1' }];
                expected[1][prefixes.rdf + 'first'] = [{ '@value': 'A' }];
                expected[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                expected[2][prefixes.rdf + 'first'] = [{ '@value': 'B' }];
                expected[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                str = '{"A", "B"}';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap, true);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toBe('');
            });
        });
        it('with nested blank nodes', function() {
            str = '(not ClassA) or ((PropD min 1) and (PropE exactly 10)) or (PropA some ClassB) or (PropC value IndvA) or (PropB only {"A", "B"})';
            expected = [
                { //unionOf
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class']
                },
                { //complementOf
                    '@id': '_:genid1',
                    '@type': [prefixes.owl + 'Class']
                },
                { //unionOf - 1
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List']
                },
                { //intersectionOf
                    '@id': '_:genid3',
                    '@type': [prefixes.owl + 'Class']
                },
                { //unionOf - 2
                    '@id': '_:genid4',
                    '@type': [prefixes.rdf + 'List']
                },
                { //minCardinality
                    '@id': '_:genid5',
                    '@type': [prefixes.owl + 'Restriction']
                },
                { //intersectionOf - 1
                    '@id': '_:genid6',
                    '@type': [prefixes.rdf + 'List']
                },
                { //cardinality
                    '@id': '_:genid7',
                    '@type': [prefixes.owl + 'Restriction']
                },
                { //intersectionOf - 2
                    '@id': '_:genid8',
                    '@type': [prefixes.rdf + 'List']
                },
                { //someValuesFrom
                    '@id': '_:genid9',
                    '@type': [prefixes.owl + 'Restriction']
                },
                { //unionOf - 3
                    '@id': '_:genid10',
                    '@type': [prefixes.rdf + 'List']
                },
                { //hasValue
                    '@id': '_:genid11',
                    '@type': [prefixes.owl + 'Restriction']
                },
                { //unionOf - 4
                    '@id': '_:genid12',
                    '@type': [prefixes.rdf + 'List']
                },
                { //allValuesFrom
                    '@id': '_:genid13',
                    '@type': [prefixes.owl + 'Restriction']
                },
                { //unionOf - 5
                    '@id': '_:genid14',
                    '@type': [prefixes.rdf + 'List']
                },
                { //oneOf
                    '@id': '_:genid15',
                    '@type': [prefixes.rdfs + 'Datatype']
                },
                { //oneOf - 1
                    '@id': '_:genid16',
                    '@type': [prefixes.rdf + 'List']
                },
                { //oneOf - 2
                    '@id': '_:genid17',
                    '@type': [prefixes.rdf + 'List']
                }
            ];
            expected[0][prefixes.owl + 'unionOf'] = [{ '@id': '_:genid2' }];
            expected[1][prefixes.owl + 'complementOf'] = [{'@id': localNameMap['ClassA']}];
            expected[2][prefixes.rdf + 'first'] = [{ '@id': '_:genid1' }];
            expected[2][prefixes.rdf + 'rest'] = [{ '@id': '_:genid4' }];
            expected[3][prefixes.owl + 'intersectionOf'] = [{ '@id': '_:genid6' }];
            expected[4][prefixes.rdf + 'first'] = [{ '@id': '_:genid3' }];
            expected[4][prefixes.rdf + 'rest'] = [{ '@id': '_:genid10' }];
            expected[5][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropD']}];
            expected[5][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
            expected[6][prefixes.rdf + 'first'] = [{ '@id': '_:genid5' }];
            expected[6][prefixes.rdf + 'rest'] = [{ '@id': '_:genid8' }];
            expected[7][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropE']}];
            expected[7][prefixes.owl + 'cardinality'] = [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}];
            expected[8][prefixes.rdf + 'first'] = [{ '@id': '_:genid7' }];
            expected[8][prefixes.rdf + 'rest'] = [{ '@list': [] }];
            expected[9][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropA']}];
            expected[9][prefixes.owl + 'someValuesFrom'] = [{'@id': localNameMap['ClassB']}];
            expected[10][prefixes.rdf + 'first'] = [{ '@id': '_:genid9' }];
            expected[10][prefixes.rdf + 'rest'] = [{ '@id': '_:genid12' }];
            expected[11][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropC']}];
            expected[11][prefixes.owl + 'hasValue'] = [{'@id': localNameMap['IndvA']}];
            expected[12][prefixes.rdf + 'first'] = [{ '@id': '_:genid11' }];
            expected[12][prefixes.rdf + 'rest'] = [{ '@id': '_:genid14' }];
            expected[13][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropB']}];
            expected[13][prefixes.owl + 'allValuesFrom'] = [{ '@id': '_:genid15' }];
            expected[14][prefixes.rdf + 'first'] = [{ '@id': '_:genid13' }];
            expected[14][prefixes.rdf + 'rest'] = [{ '@list': [] }];
            expected[15][prefixes.owl + 'oneOf'] = [{ '@id': '_:genid16' }];
            expected[16][prefixes.rdf + 'first'] = [{ '@value': 'A' }];
            expected[16][prefixes.rdf + 'rest'] = [{ '@id': '_:genid17' }];
            expected[17][prefixes.rdf + 'first'] = [{ '@value': 'B' }];
            expected[17][prefixes.rdf + 'rest'] = [{ '@list': [] }];
            var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
            expect(result.jsonld).toEqual(expected);
            expect(result.errorMessage).toBe('');
        });
    });
    describe('should convert JSON-LD into Manchester syntax', function() {
        var blankNode, jsonld, index;
        describe('if given a class expression', function() {
            beforeEach(function() {
                blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class']
                };
                jsonld = [blankNode];
                index = { '_:genid0': { position: 0 } };
            });
            describe('with unionOf', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'unionOf'] = [{'@id': '_:genid1'}];
                    jsonld.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] }, { '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] });
                    jsonld[1][prefixes.rdf + 'first'] = [{ '@id': 'ClassA' }];
                    jsonld[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                    jsonld[2][prefixes.rdf + 'first'] = [{ '@id': 'ClassB' }];
                    jsonld[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                    index['_:genid1'] = {position: 1};
                    index['_:genid2'] = {position: 2};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> or </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('ClassA or ClassB');
                });
            });
            describe('with intersectionOf', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'intersectionOf'] = [{'@id': '_:genid1'}];
                    jsonld.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] }, { '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] });
                    jsonld[1][prefixes.rdf + 'first'] = [{ '@id': 'ClassA' }];
                    jsonld[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                    jsonld[2][prefixes.rdf + 'first'] = [{ '@id': 'ClassB' }];
                    jsonld[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                    index['_:genid1'] = {position: 1};
                    index['_:genid2'] = {position: 2};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> and </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('ClassA and ClassB');
                });
            });
            describe('with complementOf', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('<span class="manchester-expr">not </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('not ClassA');
                });
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'oneOf'] = [{'@id': '_:genid1'}];
                    jsonld.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] }, { '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] });
                    jsonld[1][prefixes.rdf + 'first'] = [{ '@id': 'ClassA' }];
                    jsonld[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                    jsonld[2][prefixes.rdf + 'first'] = [{ '@id': 'ClassB' }];
                    jsonld[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                    index['_:genid1'] = {position: 1};
                    index['_:genid2'] = {position: 2};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('{ClassA, ClassB}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('{ClassA, ClassB}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                expect(result).toBe(blankNode['@id']);
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Restriction']
                };
                blankNode[prefixes.owl + 'onProperty'] = [{'@id': 'PropA'}];
                jsonld = [blankNode];
                index = { '_:genid0': { position: 0 } };
            });
            describe('with someValuesFrom', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> some </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA some ClassA');
                });

            });
            describe('with allValuesFrom', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'allValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> only </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA only ClassA');
                });
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                        expect(result).toBe('PropA value "test"@en');
                    });
                    it('without a language or type', function() {
                        blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@type': prefixes.xsd + 'string'}];
                        var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                        expect(result).toBe('PropA value "test"');
                    });
                    it('with a type', function() {
                        blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': prefixes.xsd + 'boolean'}];
                        var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                        expect(result).toBe('PropA value "true"^^xsd:boolean');
                    });
                });
                it('and a resource', function() {
                    blankNode[prefixes.owl + 'hasValue'] = [{'@id': 'ClassA'}];
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA value ClassA');
                });
            });
            describe('with minCardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA min 1');
                });
            });
            describe('with maxCardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA max 1');
                });
            });
            describe('with cardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA exactly 1');
                });
            });
            describe('with minQualifiedCardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA min 1 ClassA');
                });
            });
            describe('with maxQualifiedCardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA max 1 ClassA');
                });
            });
            describe('with qualifiedCardinality', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('PropA exactly 1 ClassA');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                expect(result).toBe(blankNode['@id']);

                delete blankNode[prefixes.owl + 'onProperty'];
                result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                expect(result).toBe(blankNode['@id']);
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.rdfs + 'Datatype']
                };
                jsonld = [blankNode];
                index = { '_:genid0': { position: 0 } };
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    blankNode[prefixes.owl + 'oneOf'] = [{'@id': '_:genid1'}];
                    jsonld.push({ '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] }, { '@id': '_:genid2', '@type': [prefixes.rdf + 'List'] });
                    jsonld[1][prefixes.rdf + 'first'] = [{ '@value': 'A' }];
                    jsonld[1][prefixes.rdf + 'rest'] = [{ '@id': '_:genid2' }];
                    jsonld[2][prefixes.rdf + 'first'] = [{ '@value': 'B' }];
                    jsonld[2][prefixes.rdf + 'rest'] = [{ '@list': [] }];
                    index['_:genid1'] = { position: 1 };
                    index['_:genid2'] = { position: 2 };
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index, true);
                    expect(result).toBe('{<span class="manchester-lit">"A"</span>, <span class="manchester-lit">"B"</span>}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                    expect(result).toBe('{"A", "B"}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(blankNode['@id'], jsonld, index);
                expect(result).toBe(blankNode['@id']);
            });
        });
        describe('with nested blank nodes', function() {
            beforeEach(function() {
                index = {
                    '_:genid0': { position: 0, node: { '@id': '_:genid0', '@type': [prefixes.owl + 'Class'] } }, // unionOf
                    '_:genid1': {position: 1, node: { '@id': '_:genid1', '@type': [prefixes.rdf + 'List'] } }, // unionOf - 1
                    '_:genid2': {position: 2, node: { '@id': '_:genid2', '@type': [prefixes.owl + 'Class'] } }, // complementOf
                    '_:genid3': {position: 3, node: { '@id': '_:genid3', '@type': [prefixes.rdf + 'List'] } }, // unionOf - 2
                    '_:genid4': {position: 4, node: { '@id': '_:genid4', '@type': [prefixes.owl + 'Class'] } }, // intersectionOf
                    '_:genid5': {position: 5, node: { '@id': '_:genid5', '@type': [prefixes.rdf + 'List'] } }, // intersectionOf - 1
                    '_:genid6': {position: 6, node: { '@id': '_:genid6', '@type': [prefixes.owl + 'Restriction'] } }, // minCardinality
                    '_:genid7': {position: 7, node: { '@id': '_:genid7', '@type': [prefixes.rdf + 'List'] } }, // intersectionOf - 2
                    '_:genid8': {position: 8, node: { '@id': '_:genid8', '@type': [prefixes.owl + 'Restriction'] } }, // cardinality
                    '_:genid9': {position: 9, node: { '@id': '_:genid9', '@type': [prefixes.rdf + 'List'] } }, // unionOf - 3
                    '_:genid10': {position: 10, node: { '@id': '_:genid10', '@type': [prefixes.owl + 'Restriction'] } }, // someValuesFrom
                    '_:genid11': {position: 11, node: { '@id': '_:genid11', '@type': [prefixes.rdf + 'List'] } }, // unionOf - 4
                    '_:genid12': {position: 12, node: { '@id': '_:genid12', '@type': [prefixes.owl + 'Restriction'] } }, // allValuesFrom
                    '_:genid13': {position: 13, node: { '@id': '_:genid13', '@type': [prefixes.owl + 'Restriction'] } } // hasValue
                };
                index['_:genid0'].node[prefixes.owl + 'unionOf'] = [{'@id': '_:genid1'}];
                index['_:genid1'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid2'}];
                index['_:genid1'].node[prefixes.rdf + 'rest'] = [{'@id': '_:genid3'}];
                index['_:genid2'].node[prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                index['_:genid3'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid4'}];
                index['_:genid3'].node[prefixes.rdf + 'rest'] = [{'@id': '_:genid9'}];
                index['_:genid4'].node[prefixes.owl + 'intersectionOf'] = [{'@id': '_:genid5'}];
                index['_:genid5'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid6'}];
                index['_:genid5'].node[prefixes.rdf + 'rest'] = [{'@id': '_:genid7'}];
                index['_:genid6'].node[prefixes.owl + 'onProperty'] = [{'@id': 'PropD'}];
                index['_:genid6'].node[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                index['_:genid7'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid8'}];
                index['_:genid7'].node[prefixes.rdf + 'rest'] = [{'@list': []}];
                index['_:genid8'].node[prefixes.owl + 'onProperty'] = [{'@id': 'PropE'}];
                index['_:genid8'].node[prefixes.owl + 'cardinality'] = [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                index['_:genid9'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid10'}];
                index['_:genid9'].node[prefixes.rdf + 'rest'] = [{'@id': '_:genid11'}];
                index['_:genid10'].node[prefixes.owl + 'onProperty'] = [{'@id': 'PropA'}];
                index['_:genid10'].node[prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassB'}];
                index['_:genid11'].node[prefixes.rdf + 'first'] = [{'@id': '_:genid12'}];
                index['_:genid11'].node[prefixes.rdf + 'rest'] = [{'@list': []}];
                index['_:genid12'].node[prefixes.owl + 'onProperty'] = [{'@id': 'PropB'}];
                index['_:genid12'].node[prefixes.owl + 'allValuesFrom'] = [{'@id': '_:genid13'}];
                index['_:genid13'].node[prefixes.owl + 'onProperty'] = [{'@id': 'PropC'}];
                index['_:genid13'].node[prefixes.owl + 'hasValue'] = [{'@id': 'ClassC'}];
                jsonld = _.map(index, 'node');
            });
            it('and HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(jsonld[0]['@id'], jsonld, index, true);
                expect(result).toBe('(<span class="manchester-expr">not </span>ClassA)<span class="manchester-expr"> or </span>'
                    + '((PropD<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>)'
                    + '<span class="manchester-expr"> and </span>(PropE<span class="manchester-rest"> exactly </span><span class="manchester-lit">10</span>))'
                    + '<span class="manchester-expr"> or </span>(PropA<span class="manchester-rest"> some </span>ClassB)'
                    + '<span class="manchester-expr"> or </span>(PropB<span class="manchester-rest"> only </span>'
                    + '(PropC<span class="manchester-rest"> value </span>ClassC))');
            });
            it('without HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(jsonld[0]['@id'], jsonld, index);
                expect(result).toBe('(not ClassA) or ((PropD min 1) and (PropE exactly 10)) '
                    + 'or (PropA some ClassB) or (PropB only (PropC value ClassC))');
            });
        });
    });
});
