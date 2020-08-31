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
import { iteratee } from 'lodash';
import {
    mockPrefixes,
    mockUtil,
    mockOntologyManager,
    injectSplitIRIFilter,
} from '../../../../../test/js/Shared';

describe('Manchester Converter service', function() {
    var manchesterConverterSvc, ontologyManagerSvc, prefixes, utilSvc, splitIRIFilter;

    beforeEach(function() {
        angular.mock.module('shared');
        mockPrefixes();
        mockOntologyManager();
        mockUtil();
        injectSplitIRIFilter();
        
        inject(function(manchesterConverterService, _ontologyManagerService_, _prefixes_, _utilService_, _splitIRIFilter_) {
            manchesterConverterSvc = manchesterConverterService;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            splitIRIFilter = _splitIRIFilter_;
        });

        ontologyManagerSvc.isBlankNodeId.and.callFake(id => _.includes(id, '_:genid'));
        ontologyManagerSvc.isClass.and.callFake(obj => _.includes(obj['@type'], prefixes.owl + 'Class'));
        ontologyManagerSvc.isDatatype.and.callFake(obj => _.includes(obj['@type'], prefixes.rdfs + 'Datatype'));
        ontologyManagerSvc.isRestriction.and.callFake(obj => _.includes(obj['@type'], prefixes.owl + 'Restriction'));
        splitIRIFilter.and.callFake(str => ({end: str}));
        utilSvc.getPropertyId.and.callFake((obj, prop) => _.get(obj[prop], "[0]['@id']", ''));
    });

    afterEach(function() {
        manchesterConverterSvc = null;
        ontologyManagerSvc = null;
        prefixes = null;
        splitIRIFilter = null;
    });

    describe('should handle customer use cases', function() {
        beforeEach(function() {
            var idx = 0;
            utilSvc.getSkolemizedIRI.and.callFake(function() {
                var id = '_:genid' + idx;
                idx++;
                return id;
            });
            utilSvc.setPropertyId.and.callFake(function(obj, prop, value) {
                obj[prop] = [{'@id': value}];
            });
        });
        it('such as (BFO_0000015 or ProcessAggregate) and (BFO_0000057 some BFO_0000040) and (BFO_0000066 some BFO_0000006) and (BFO_0000199 some BFO_0000008)', function() {
            let str = '(BFO_0000015 or ProcessAggregate) and (BFO_0000057 some BFO_0000040) and (BFO_0000066 some BFO_0000006) and (BFO_0000199 some BFO_0000008)';
            let localNameMap = {
                'BFO_0000015': 'http://purl.obolibrary.org/obo/BFO_0000015',
                'ProcessAggregate': 'http://www.ontologyrepository.com/CommonCoreOntologies/ProcessAggregate',
                'BFO_0000057': 'http://purl.obolibrary.org/obo/BFO_0000057',
                'BFO_0000040': 'http://purl.obolibrary.org/obo/BFO_0000040',
                'BFO_0000066': 'http://purl.obolibrary.org/obo/BFO_0000066',
                'BFO_0000006': 'http://purl.obolibrary.org/obo/BFO_0000006',
                'BFO_0000199': 'http://purl.obolibrary.org/obo/BFO_0000199',
                'BFO_0000008': 'http://purl.obolibrary.org/obo/BFO_0000008'
            };
            let expected = [
                {
                    "@id": "_:genid0",
                    "@type": [
                        "Class"
                    ],
                    "intersectionOf": [
                        {
                            "@id": "_:genid2"
                        }
                    ]
                },
                {
                    "@id": "_:genid1",
                    "@type": [
                        "Class"
                    ],
                    "unionOf": [
                        {
                            "@id": "_:genid3"
                        }
                    ]
                },
                {
                    "@id": "_:genid2",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "_:genid1"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@id": "_:genid6"
                        }
                    ]
                },
                {
                    "@id": "_:genid3",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000015"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@id": "_:genid4"
                        }
                    ]
                },
                {
                    "@id": "_:genid4",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "http://www.ontologyrepository.com/CommonCoreOntologies/ProcessAggregate"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@list": []
                        }
                    ]
                },
                {
                    "@id": "_:genid5",
                    "@type": [
                        "Restriction"
                    ],
                    "onProperty": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000057"
                        }
                    ],
                    "someValuesFrom": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000040"
                        }
                    ]
                },
                {
                    "@id": "_:genid6",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "_:genid5"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@id": "_:genid8"
                        }
                    ]
                },
                {
                    "@id": "_:genid7",
                    "@type": [
                        "Restriction"
                    ],
                    "onProperty": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000066"
                        }
                    ],
                    "someValuesFrom": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000006"
                        }
                    ]
                },
                {
                    "@id": "_:genid8",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "_:genid7"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@id": "_:genid10"
                        }
                    ]
                },
                {
                    "@id": "_:genid9",
                    "@type": [
                        "Restriction"
                    ],
                    "onProperty": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000199"
                        }
                    ],
                    "someValuesFrom": [
                        {
                            "@id": "http://purl.obolibrary.org/obo/BFO_0000008"
                        }
                    ]
                },
                {
                    "@id": "_:genid10",
                    "@type": [
                        "rdf:List"
                    ],
                    "rdf:first": [
                        {
                            "@id": "_:genid9"
                        }
                    ],
                    "rdf:rest": [
                        {
                            "@list": []
                        }
                    ]
                }
            ];
            var result = manchesterConverterSvc.manchesterToJsonld(str, localNameMap);
            expect(result.jsonld).toEqual(expected);
        });
    });
    describe('should convert a Manchester syntax string into JSON-LD', function() {
        beforeEach(function() {
            this.localNameMap = {
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
            var idx = 0;
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
            var str = '1 test 2';
            var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toBeTruthy();
        });
        it('unless an invalid local name is used', function() {
            var str = 'test min 0';
            var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toContain('"test" does not correspond to a known IRI');
        });
        describe('if given a class expression', function() {
            beforeEach(function() {
                this.expected = [{'@id': '_:genid0', '@type': [prefixes.owl + 'Class']}];
            });
            it('with unionOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['ClassA'] }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['ClassB'] }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][prefixes.owl + 'unionOf'] = [{ '@id': '_:genid1' }];
                var str = 'ClassA or ClassB';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with intersectionOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['ClassA'] }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['ClassB'] }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][prefixes.owl + 'intersectionOf'] = [{ '@id': '_:genid1' }];
                var str = 'ClassA and ClassB';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with complementOf', function() {
                this.expected[0][prefixes.owl + 'complementOf'] = [{'@id': this.localNameMap['ClassA']}];
                var str = 'not ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with oneOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['IndvA'] }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': this.localNameMap['IndvB'] }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][prefixes.owl + 'oneOf'] = [{ '@id': '_:genid1' }];
                var str = '{IndvA, IndvB}';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                this.expected = [{
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropA']}]
                }];
            });
            it('with someValuesFrom', function() {
                this.expected[0][prefixes.owl + 'someValuesFrom'] = [{'@id': this.localNameMap['ClassA']}];
                var str = 'PropA some ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with someValuesFrom', function() {
                this.expected[0][prefixes.owl + 'allValuesFrom'] = [{'@id': this.localNameMap['ClassA']}];
                var str = 'PropA only ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        this.expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        var str = 'PropA value "test"@en';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('without a language or type', function() {
                        this.expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'test'}];
                        var str = 'PropA value "test"';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a prefixed type', function() {
                        this.expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': prefixes.xsd + 'boolean'}];
                        var str = 'PropA value "true"^^xsd:boolean';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a unprefixed type', function() {
                        this.expected[0][prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': 'http://test.com/datatype'}];
                        var str = 'PropA value "true"^^<http://test.com/datatype>';
                        var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                });
                it('and a resource', function() {
                    this.expected[0][prefixes.owl + 'hasValue'] = [{'@id': this.localNameMap['ClassA']}];
                    var str = 'PropA value ClassA';
                    var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                    expect(result.jsonld).toEqual(this.expected);
                    expect(result.errorMessage).toEqual('');
                });
            });
            it('with minCardinality', function() {
                this.expected[0][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA min 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                this.expected[0][prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA max 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                this.expected[0][prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA exactly 1';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with minCardinality', function() {
                this.expected[0][prefixes.owl + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA min 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                this.expected[0][prefixes.owl + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA max 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                this.expected[0][prefixes.owl + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                var str = 'PropA exactly 1 ClassA';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                this.expected = [{'@id': '_:genid0', '@type': [prefixes.rdfs + 'Datatype']}];
            });
            it('with oneOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@value': 'A' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@value': 'B' }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][prefixes.owl + 'oneOf'] = [{ '@id': '_:genid1' }];
                var str = '{"A", "B"}';
                var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap, true);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toBe('');
            });
        });
        it('with nested blank nodes', function() {
            var str = '(not ClassA) or ((PropD min 1) and (PropE exactly 10)) or (PropA some ClassB) or (PropC value IndvA) or (PropB only {"A", "B"})';
            this.expected = [
                {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class'],
                    [prefixes.owl + 'unionOf']: [{ '@id': '_:genid2' }]
                },
                {
                    '@id': '_:genid1',
                    '@type': [prefixes.owl + 'Class'],
                    [prefixes.owl + 'complementOf']: [{'@id': this.localNameMap['ClassA']}]
                },
                {
                    '@id': '_:genid2',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid1' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid4' }]
                },
                {
                    '@id': '_:genid3',
                    '@type': [prefixes.owl + 'Class'],
                    [prefixes.owl + 'intersectionOf']: [{ '@id': '_:genid6' }]
                },
                {
                    '@id': '_:genid4',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid3' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid10' }]
                },
                {
                    '@id': '_:genid5',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropD']}],
                    [prefixes.owl + 'minCardinality']: [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}]
                },
                {
                    '@id': '_:genid6',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid5' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid8'}]
                },
                {
                    '@id': '_:genid7',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropE']}],
                    [prefixes.owl + 'cardinality']: [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}]
                },
                {
                    '@id': '_:genid8',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid7' }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                },
                {
                    '@id': '_:genid9',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropA']}],
                    [prefixes.owl + 'someValuesFrom']: [{'@id': this.localNameMap['ClassB']}]
                },
                {
                    '@id': '_:genid10',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid9' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid12' }]
                },
                {
                    '@id': '_:genid11',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropC']}],
                    [prefixes.owl + 'hasValue']: [{'@id': this.localNameMap['IndvA']}]
                },
                {
                    '@id': '_:genid12',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid11' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid14'}]
                },
                {
                    '@id': '_:genid13',
                    '@type': [prefixes.owl + 'Restriction'],
                    [prefixes.owl + 'onProperty']: [{'@id': this.localNameMap['PropB']}],
                    [prefixes.owl + 'allValuesFrom']: [{ '@id': '_:genid15' }]
                },
                {
                    '@id': '_:genid14',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': '_:genid13' }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                },
                {
                    '@id': '_:genid15',
                    '@type': [prefixes.rdfs + 'Datatype'],
                    [prefixes.owl + 'oneOf']: [{ '@id': '_:genid16' }],
                },
                {
                    '@id': '_:genid16',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@value': 'A' }],
                    [prefixes.rdf + 'rest']: [{ '@id': '_:genid17' }]
                },
                {
                    '@id': '_:genid17',
                    '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@value': 'B' }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                }
            ];
            var result = manchesterConverterSvc.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toEqual(this.expected);
            expect(result.errorMessage).toBe('');
        });
    });
    describe('should convert JSON-LD into Manchester syntax', function() {
        it('if given a list expression with a blank @list', function () {
            var bnodes = [
                {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class'],
                    [prefixes.owl + 'unionOf']: [{'@id': '_:genid1'}]
                },
                {
                    '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': 'ClassA' }],
                    [prefixes.rdf + 'rest']: [{'@id': '_:genid2'}]
                },
                {
                    '@id': '_:genid2', '@type': [prefixes.rdf + 'List'],
                    [prefixes.rdf + 'first']: [{ '@id': 'ClassB' }],
                    [prefixes.rdf + 'rest']: [{ '@list': [] }]
                }
            ];
            var index = {
                '_:genid0': { position: 0 },
                '_:genid1': { position: 1 },
                '_:genid2': { position: 2 }
            };
            var result = manchesterConverterSvc.jsonldToManchester(bnodes[0]['@id'], bnodes, index);
            expect(result).toBe('ClassA or ClassB');
        })
        describe('if given a class expression', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.owl + 'Class']
                };
                this.jsonld = [this.blankNode];
                this.index = { '_:genid0': { position: 0 } };
            });
            describe('with unionOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'unionOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{ '@id': 'ClassA' }],
                        [prefixes.rdf + 'rest']: [{ '@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> or </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('ClassA or ClassB');
                });
            });
            describe('with intersectionOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'intersectionOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': 'ClassA'}],
                        [prefixes.rdf + 'rest']: [{'@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> and </span>ClassB');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('ClassA and ClassB');
                });
            });
            describe('with complementOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('<span class="manchester-expr">not </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('not ClassA');
                });
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'oneOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': 'ClassA'}],
                        [prefixes.rdf + 'rest']: [{'@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('{ClassA, ClassB}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('{ClassA, ClassB}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
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
                this.index = { '_:genid0': { position: 0 } };
            });
            describe('with someValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> some </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA some ClassA');
                });

            });
            describe('with allValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'allValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> only </span>ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA only ClassA');
                });
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "test"@en');
                    });
                    it('without a language or type', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test', '@type': prefixes.xsd + 'string'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "test"');
                    });
                    it('with a type', function() {
                        this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'true', '@type': prefixes.xsd + 'boolean'}];
                        var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "true"^^xsd:boolean');
                    });
                });
                it('and a resource', function() {
                    this.blankNode[prefixes.owl + 'hasValue'] = [{'@id': 'ClassA'}];
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA value ClassA');
                });
            });
            describe('with minCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA min 1');
                });
            });
            describe('with maxCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA max 1');
                });
            });
            describe('with cardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA exactly 1');
                });
            });
            describe('with minQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA min 1 ClassA');
                });
            });
            describe('with maxQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA max 1 ClassA');
                });
            });
            describe('with qualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}];
                    this.blankNode[prefixes.owl + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA exactly 1 ClassA');
                });
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [prefixes.rdfs + 'Datatype']
                };
                this.jsonld = [this.blankNode];
                this.index = { '_:genid0': { position: 0 } };
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[prefixes.owl + 'oneOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@value': 'A'}],
                        [prefixes.rdf + 'rest']: [{'@list': [{'@value': 'B'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('{<span class="manchester-lit">"A"</span>, <span class="manchester-lit">"B"</span>}');
                });
                it('without HTML', function() {
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('{"A", "B"}');
                });
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('with nested blank nodes', function() {
            beforeEach(function() {
                this.index = {
                    '_:genid0': { position: 0, node: {
                        '@id': '_:genid0', '@type': [prefixes.owl + 'Class'],
                        [prefixes.owl + 'unionOf']: [{'@id': '_:genid1'}]
                    } }, // unionOf
                    '_:genid1': {position: 1, node: {
                        '@id': '_:genid1', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': '_:genid2'}],
                        [prefixes.rdf + 'rest']: [{'@id': '_:genid3'}]
                    } }, // unionOf - 1
                    '_:genid2': {position: 2, node: {
                        '@id': '_:genid2', '@type': [prefixes.owl + 'Class'],
                        [prefixes.owl + 'complementOf']: [{'@id': 'ClassA'}]
                    } }, // complementOf
                    '_:genid3': {position: 3, node: {
                        '@id': '_:genid3', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': '_:genid4'}],
                        [prefixes.rdf + 'rest']: [{'@id': '_:genid9'}]
                    } }, // unionOf - 2
                    '_:genid4': {position: 4, node: {
                        '@id': '_:genid4', '@type': [prefixes.owl + 'Class'],
                        [prefixes.owl + 'intersectionOf']: [{'@id': '_:genid5'}]
                    } }, // intersectionOf
                    '_:genid5': {position: 5, node: {
                        '@id': '_:genid5', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': '_:genid6'}],
                        [prefixes.rdf + 'rest']: [{'@list': [{'@id': '_:genid8'}]}]
                    } }, // intersectionOf - 1
                    '_:genid6': {position: 6, node: {
                        '@id': '_:genid6', '@type': [prefixes.owl + 'Restriction'],
                        [prefixes.owl + 'onProperty']: [{'@id': 'PropD'}],
                        [prefixes.owl + 'minCardinality']: [{'@value': '1', '@type': prefixes.xsd + 'nonNegativeInteger'}]
                    } }, // minCardinality
                    '_:genid8': {position: 7, node: {
                        '@id': '_:genid8', '@type': [prefixes.owl + 'Restriction'],
                        [prefixes.owl + 'onProperty']: [{'@id': 'PropE'}],
                        [prefixes.owl + 'cardinality']: [{'@value': '10', '@type': prefixes.xsd + 'nonNegativeInteger'}]
                    } }, // cardinality
                    '_:genid9': {position: 8, node: {
                        '@id': '_:genid9', '@type': [prefixes.rdf + 'List'],
                        [prefixes.rdf + 'first']: [{'@id': '_:genid10'}],
                        [prefixes.rdf + 'rest']: [{'@list': [{'@id': '_:genid12'}]}]
                    } }, // unionOf - 3
                    '_:genid10': {position: 9, node: {
                        '@id': '_:genid10', '@type': [prefixes.owl + 'Restriction'],
                        [prefixes.owl + 'onProperty']: [{'@id': 'PropA'}],
                        [prefixes.owl + 'someValuesFrom']: [{'@id': 'ClassB'}]
                    } }, // someValuesFrom
                    '_:genid12': {position: 10, node: {
                        '@id': '_:genid12', '@type': [prefixes.owl + 'Restriction'],
                        [prefixes.owl + 'onProperty']: [{'@id': 'PropB'}],
                        [prefixes.owl + 'allValuesFrom']: [{'@id': '_:genid13'}]
                    } }, // allValuesFrom
                    '_:genid13': {position: 11, node: {
                        '@id': '_:genid13', '@type': [prefixes.owl + 'Restriction'],
                        [prefixes.owl + 'onProperty']: [{'@id': 'PropC'}],
                        [prefixes.owl + 'hasValue']: [{'@id': 'ClassC'}]
                    } } // hasValue
                };
                this.jsonld = _.map(this.index, 'node');

            });
            it('and HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld, this.index, true);
                expect(result).toBe('(<span class="manchester-expr">not </span>ClassA)<span class="manchester-expr"> or </span>'
                    + '((PropD<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>)'
                    + '<span class="manchester-expr"> and </span>(PropE<span class="manchester-rest"> exactly </span><span class="manchester-lit">10</span>))'
                    + '<span class="manchester-expr"> or </span>(PropA<span class="manchester-rest"> some </span>ClassB)'
                    + '<span class="manchester-expr"> or </span>(PropB<span class="manchester-rest"> only </span>'
                    + '(PropC<span class="manchester-rest"> value </span>ClassC))');
            });
            it('without HTML', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld, this.index);
                expect(result).toBe('(not ClassA) or ((PropD min 1) and (PropE exactly 10)) '
                    + 'or (PropA some ClassB) or (PropB only (PropC value ClassC))');
            });
        });
    });
});
