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
            };
        beforeEach(function() {
            idx = 0;
            utilSvc.getIdForBlankNode.and.callFake(function() {
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
        describe('if given a class expression', function() {
            beforeEach(function() {
                expected = [{'@id': '_:genid0', '@type': [prefixes.owl + 'Class']}];
            });
            it('with unionOf', function() {
                expected[0][prefixes.owl + 'unionOf'] = [{'@list': [{'@id': localNameMap['ClassA']}, {'@id': localNameMap['ClassB']}]}];
                str = 'ClassA or ClassB';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with intersectionOf', function() {
                expected[0][prefixes.owl + 'intersectionOf'] = [{'@list': [{'@id': localNameMap['ClassA']}, {'@id': localNameMap['ClassB']}]}];
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
                expected[0][prefixes.owl + 'oneOf'] = [{'@list': [{'@id': localNameMap['ClassA']}, {'@id': localNameMap['ClassB']}]}];
                str = '{ClassA, ClassB}';
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
                expected[0][prefixes.owl + 'oneOf'] = [{'@list': [{'@value': 'A'}, {'@value': 'B'}]}];
                str = '{"A", "B"}';
                var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap, true);
                expect(result.jsonld).toEqual(expected);
                expect(result.errorMessage).toBe('');
            });
        });
        it('with nested blank nodes', function() {
            str = '(not ClassA) or ((PropD min 1) and (PropE exactly 10)) or (PropA some ClassB) or (PropC value IndvA) or (PropB only {"A", "B"})';
            expected = [
                {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class']
                },
                {
                    '@id': '_:genid1',
                    '@type': [prefixes.owl + 'Class']
                },
                {
                    '@id': '_:genid2',
                    '@type': [prefixes.owl + 'Class']
                },
                {
                    '@id': '_:genid3',
                    '@type': [prefixes.owl + 'Restriction']
                },
                {
                    '@id': '_:genid4',
                    '@type': [prefixes.owl + 'Restriction']
                },
                {
                    '@id': '_:genid5',
                    '@type': [prefixes.owl + 'Restriction']
                },
                {
                    '@id': '_:genid6',
                    '@type': [prefixes.owl + 'Restriction']
                },
                {
                    '@id': '_:genid7',
                    '@type': [prefixes.owl + 'Restriction']
                },
                {
                    '@id': '_:genid8',
                    '@type': [prefixes.rdfs + 'Datatype']
                }
            ];
            expected[0][prefixes.owl + 'unionOf'] = [{'@list': [
                { '@id': '_:genid1' },
                { '@id': '_:genid2' },
                { '@id': '_:genid5' },
                { '@id': '_:genid6' },
                { '@id': '_:genid7' }
            ]}];
            expected[1][prefixes.owl + 'complementOf'] = [{'@id': localNameMap['ClassA']}];
            expected[2][prefixes.owl + 'intersectionOf'] = [{'@list': [
                { '@id': '_:genid3' },
                { '@id': '_:genid4' }
            ]}];
            expected[3][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropD']}];
            expected[3][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
            expected[4][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropE']}];
            expected[4][prefixes.owl + 'cardinality'] = [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}];
            expected[5][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropA']}];
            expected[5][prefixes.owl + 'someValuesFrom'] = [{'@id': localNameMap['ClassB']}];
            expected[6][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropC']}];
            expected[6][prefixes.owl + 'hasValue'] = [{'@id': localNameMap['IndvA']}];
            expected[7][prefixes.owl + 'onProperty'] = [{'@id': localNameMap['PropB']}];
            expected[7][prefixes.owl + 'allValuesFrom'] = [{'@id': '_:genid8'}];
            expected[8][prefixes.owl + 'oneOf'] = [{'@list': [
                { '@value': 'A' },
                { '@value': 'B' },
            ]}];
            var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
            expect(result.jsonld).toEqual(expected);
            expect(result.errorMessage).toBe('');
        });
    });
    describe('should convert JSON-LD into Manchester syntax', function() {
        describe('if given a class expression', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class']
                };
                this.jsonld = [this.blankNode];
            });
            describe('with unionOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'unionOf'] = [{'@list': [
                        {'@id': 'ClassA'},
                        {'@id': 'ClassB'}
                    ]}];
                })
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> or </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('ClassA or ClassB');
                });
            });
            describe('with intersectionOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'intersectionOf'] = [{'@list': [
                        {'@id': 'ClassA'},
                        {'@id': 'ClassB'}
                    ]}];
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> and </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('ClassA and ClassB');
                });
            });
            describe('with complementOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('<span class="manchester-expr">not </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('not ClassA');
                });
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'oneOf'] = [{'@list': [
                        {'@id': 'ClassA'},
                        {'@id': 'ClassB'}
                    ]}];
                })
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('{ClassA, ClassB}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('{ClassA, ClassB}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Restriction']
                };
                this.blankNode[prefixes.owl + 'onProperty'] = [{'@id': 'PropA'}];
                this.jsonld = [this.blankNode];
            });
            describe('with someValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> some </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA some ClassA');
                });

            });
            describe('with allValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'allValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> only </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA only ClassA');
                });
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                        expect(result).toBe('PropA value "test"@en');
                    });
                    it('without a language or type', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@type': prefixes.xsd + 'string'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                        expect(result).toBe('PropA value "test"');
                    });
                    it('with a type', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': prefixes.xsd + 'boolean'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                        expect(result).toBe('PropA value "true"^^xsd:boolean');
                    });
                });
                it('and a resource', function() {
                    this.blankNode[prefixes.owl + 'hasValue'] = [{'@id': 'ClassA'}];
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA value ClassA');
                });
            });
            describe('with minCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA min 1');
                });
            });
            describe('with maxCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA max 1');
                });
            });
            describe('with cardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA exactly 1');
                });
            });
            describe('with minQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA min 1 ClassA');
                });
            });
            describe('with maxQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA max 1 ClassA');
                });
            });
            describe('with qualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA exactly 1 ClassA');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe(this.blankNode['@id']);

                delete this.blankNode[prefixes.owl + 'onProperty'];
                result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.rdfs + 'Datatype']
                };
                this.jsonld = [this.blankNode];
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'oneOf'] = [{'@list': [
                        {'@value': 'A'},
                        {'@value': 'B'}
                    ]}];
                })
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, true);
                    expect(result).toBe('{<span class="manchester-lit">"A"</span>, <span class="manchester-lit">"B"</span>}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('{"A", "B"}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('with nested blank nodes', function() {
            beforeEach(function() {
                this.jsonld = [
                    {
                        '@id': '_:genid0',
                        '@type': [prefixes.owl + 'Class']
                    },
                    {
                        '@id': '_:genid1',
                        '@type': [prefixes.owl + 'Class']
                    },
                    {
                        '@id': '_:genid2',
                        '@type': [prefixes.owl + 'Class']
                    },
                    {
                        '@id': '_:genid3',
                        '@type': [prefixes.owl + 'Restriction']
                    },
                    {
                        '@id': '_:genid4',
                        '@type': [prefixes.owl + 'Restriction']
                    },
                    {
                        '@id': '_:genid5',
                        '@type': [prefixes.owl + 'Restriction']
                    },
                    {
                        '@id': '_:genid6',
                        '@type': [prefixes.owl + 'Restriction']
                    },
                    {
                        '@id': '_:genid7',
                        '@type': [prefixes.owl + 'Restriction']
                    }
                ];
                this.jsonld[0][prefixes.owl + 'unionOf'] = [{'@list': [
                    {
                        '@id': '_:genid1'
                    },
                    {
                        '@id': '_:genid2'
                    },
                    {
                        '@id': '_:genid3'
                    },
                    {
                        '@id': '_:genid4'
                    }
                ]}];
                this.jsonld[1][prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                this.jsonld[2][prefixes.owl + 'intersectionOf'] = [{'@list': [
                    {
                        '@id': '_:genid6'
                    },
                    {
                        '@id': '_:genid7'
                    }
                ]}];
                this.jsonld[3][prefixes.owl + 'onProperty'] = [{'@id': 'PropA'}];
                this.jsonld[3][prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassB'}];
                this.jsonld[4][prefixes.owl + 'onProperty'] = [{'@id': 'PropB'}];
                this.jsonld[4][prefixes.owl + 'allValuesFrom'] = [{'@id': '_:genid5'}];
                this.jsonld[5][prefixes.owl + 'onProperty'] = [{'@id': 'PropC'}];
                this.jsonld[5][prefixes.owl + 'hasValue'] = [{'@id': 'ClassC'}];
                this.jsonld[6][prefixes.owl + 'onProperty'] = [{'@id': 'PropD'}];
                this.jsonld[6][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                this.jsonld[7][prefixes.owl + 'onProperty'] = [{'@id': 'PropE'}];
                this.jsonld[7][prefixes.owl + 'cardinality'] = [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}];
            });
            it('and HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld, true);
                expect(result).toBe('(<span class="manchester-expr">not </span>ClassA)<span class="manchester-expr"> or </span>'
                    + '((PropD<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>)'
                    + '<span class="manchester-expr"> and </span>(PropE<span class="manchester-rest"> exactly </span><span class="manchester-lit">10</span>))'
                    + '<span class="manchester-expr"> or </span>(PropA<span class="manchester-rest"> some </span>ClassB)'
                    + '<span class="manchester-expr"> or </span>(PropB<span class="manchester-rest"> only </span>'
                    + '(PropC<span class="manchester-rest"> value </span>ClassC))');
            });
            it('without HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld);
                expect(result).toBe('(not ClassA) or ((PropD min 1) and (PropE exactly 10)) '
                    + 'or (PropA some ClassB) or (PropB only (PropC value ClassC))');
            });
        });
    });
});
