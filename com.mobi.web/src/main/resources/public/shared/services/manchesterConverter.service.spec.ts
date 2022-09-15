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
import { MockPipe, MockProvider } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { get, includes, map } from 'lodash';

import { OntologyManagerService } from './ontologyManager.service';
import { DiscoverStateService } from './discoverState.service';
import { UtilService } from './util.service';
import { ManchesterConverterService } from './manchesterConverter.service';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';
import { OWL, RDF, RDFS, XSD } from '../../prefixes';
import { SplitIRI } from '../models/splitIRI.interface';

describe('Manchester Converter service', function() {
    let utilStub: jasmine.SpyObj<UtilService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let service: ManchesterConverterService;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                ManchesterConverterService,
                MockProvider(OntologyManagerService),
                MockProvider(DiscoverStateService),
                MockProvider(UtilService),
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(ManchesterConverterService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get(UtilService);
        splitIRIStub = TestBed.get(SplitIRIPipe);
        // Mock calls
        ontologyManagerStub.isBlankNodeId.and.callFake(id => includes(id, '_:genid'));
        ontologyManagerStub.isClass.and.callFake(obj => includes(obj['@type'], OWL + 'Class'));
        ontologyManagerStub.isDatatype.and.callFake(obj => includes(obj['@type'], RDF + 'Datatype'));
        ontologyManagerStub.isRestriction.and.callFake(obj => includes(obj['@type'], OWL + 'Restriction'));

        splitIRIStub.transform.and.callFake(str => {
            return {
                begin: '',
                then: '',
                end: str
            } as SplitIRI;
        });
        utilStub.getPropertyId.and.callFake((obj, prop) => get(obj[prop], '[0][\'@id\']', ''));
    });

    afterEach(function() {
        service = null;
        ontologyManagerStub = null;
        splitIRIStub = null;
        utilStub = null;
    });

    describe('should handle customer use cases', function() {
        beforeEach(function() {
            let idx = 0;
            utilStub.getSkolemizedIRI.and.callFake(function() {
                const id = '_:genid' + idx;
                idx++;
                return id;
            });
            utilStub.setPropertyId.and.callFake(function(obj, prop, value) {
                obj[prop] = [{'@id': value}];
            });
        });
        it('such as (BFO_0000015 or ProcessAggregate) and (BFO_0000057 some BFO_0000040) and (BFO_0000066 some BFO_0000006) and (BFO_0000199 some BFO_0000008)', function() {
            const str = '(BFO_0000015 or ProcessAggregate) and (BFO_0000057 some BFO_0000040) and (BFO_0000066 some BFO_0000006) and (BFO_0000199 some BFO_0000008)';
            const localNameMap = {
                'BFO_0000015': 'http://purl.obolibrary.org/obo/BFO_0000015',
                'ProcessAggregate': 'http://www.ontologyrepository.com/CommonCoreOntologies/ProcessAggregate',
                'BFO_0000057': 'http://purl.obolibrary.org/obo/BFO_0000057',
                'BFO_0000040': 'http://purl.obolibrary.org/obo/BFO_0000040',
                'BFO_0000066': 'http://purl.obolibrary.org/obo/BFO_0000066',
                'BFO_0000006': 'http://purl.obolibrary.org/obo/BFO_0000006',
                'BFO_0000199': 'http://purl.obolibrary.org/obo/BFO_0000199',
                'BFO_0000008': 'http://purl.obolibrary.org/obo/BFO_0000008'
            };
            const expected = [
                {
                    '@id': '_:genid0',
                    '@type': [
                        'Class'
                    ],
                    [`${OWL}intersectionOf`]: [
                        {
                            '@id': '_:genid2'
                        }
                    ]
                },
                {
                    '@id': '_:genid1',
                    '@type': [
                        'Class'
                    ],
                    [`${OWL}unionOf`]: [
                        {
                            '@id': '_:genid3'
                        }
                    ]
                },
                {
                    '@id': '_:genid2',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': '_:genid1'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@id': '_:genid6'
                        }
                    ]
                },
                {
                    '@id': '_:genid3',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000015'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@id': '_:genid4'
                        }
                    ]
                },
                {
                    '@id': '_:genid4',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': 'http://www.ontologyrepository.com/CommonCoreOntologies/ProcessAggregate'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@list': []
                        }
                    ]
                },
                {
                    '@id': '_:genid5',
                    '@type': [
                        'Restriction'
                    ],
                    [`${OWL}onProperty`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000057'
                        }
                    ],
                    [`${OWL}someValuesFrom`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000040'
                        }
                    ]
                },
                {
                    '@id': '_:genid6',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': '_:genid5'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@id': '_:genid8'
                        }
                    ]
                },
                {
                    '@id': '_:genid7',
                    '@type': [
                        'Restriction'
                    ],
                    [`${OWL}onProperty`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000066'
                        }
                    ],
                    [`${OWL}someValuesFrom`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000006'
                        }
                    ]
                },
                {
                    '@id': '_:genid8',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': '_:genid7'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@id': '_:genid10'
                        }
                    ]
                },
                {
                    '@id': '_:genid9',
                    '@type': [
                        'Restriction'
                    ],
                    [`${OWL}onProperty`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000199'
                        }
                    ],
                    [`${OWL}someValuesFrom`]: [
                        {
                            '@id': 'http://purl.obolibrary.org/obo/BFO_0000008'
                        }
                    ]
                },
                {
                    '@id': '_:genid10',
                    '@type': [
                        'rdf:List'
                    ],
                    [`${RDF}first`]: [
                        {
                            '@id': '_:genid9'
                        }
                    ],
                    [`${RDF}rest`]: [
                        {
                            '@list': []
                        }
                    ]
                }
            ];
            expected.forEach(item => {
                item['@type'] =  item['@type'].map(type => {
                    if ( type === 'rdf:List') {
                        return RDF + 'List';
                    }
                    return OWL + type;
                });
            });
            const result = service.manchesterToJsonld(str, localNameMap);
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
            let idx = 0;
            utilStub.getSkolemizedIRI.and.callFake(function() {
                let id = '_:genid' + idx;
                idx++;
                return id;
            });
            utilStub.setPropertyId.and.callFake(function(obj, prop, value) {
                obj[prop] = [{'@id': value}];
            });
        });
        it('unless the string is invalid', function() {
            let str = '1 test 2';
            let result = service.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toBeTruthy();
        });
        it('unless an invalid local name is used', function() {
            let str = 'test min 0';
            let result = service.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toBeUndefined();
            expect(result.errorMessage).toContain('"test" does not correspond to a known IRI');
        });
        describe('if given a class expression', function() {
            beforeEach(function() {
                this.expected = [{'@id': '_:genid0', '@type': [OWL + 'Class']}];
            });
            it('with unionOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': this.localNameMap['ClassA'] }],
                    [RDF + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [RDF + 'List'],
                    [RDF+ 'first']: [{ '@id': this.localNameMap['ClassB'] }],
                    [RDF+ 'rest']: [{ '@list': [] }]
                });
                this.expected[0][OWL + 'unionOf'] = [{ '@id': '_:genid1' }];
                let str = 'ClassA or ClassB';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with intersectionOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': this.localNameMap['ClassA'] }],
                    [RDF + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': this.localNameMap['ClassB'] }],
                    [RDF+ 'rest']: [{ '@list': [] }]
                });
                this.expected[0][OWL + 'intersectionOf'] = [{ '@id': '_:genid1' }];
                let str = 'ClassA and ClassB';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with complementOf', function() {
                this.expected[0][OWL+ 'complementOf'] = [{'@id': this.localNameMap['ClassA']}];
                let str = 'not ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with oneOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': this.localNameMap['IndvA'] }],
                    [RDF + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': this.localNameMap['IndvB'] }],
                    [RDF + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][OWL + 'oneOf'] = [{ '@id': '_:genid1' }];
                let str = '{IndvA, IndvB}';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                this.expected = [{
                    '@id': '_:genid0',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropA']}]
                }];
            });
            it('with someValuesFrom', function() {
                this.expected[0][OWL + 'someValuesFrom'] = [{'@id': this.localNameMap['ClassA']}];
                let str = 'PropA some ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with someValuesFrom', function() {
                this.expected[0][OWL + 'allValuesFrom'] = [{'@id': this.localNameMap['ClassA']}];
                let str = 'PropA only ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        this.expected[0][OWL + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        let str = 'PropA value "test"@en';
                        let result = service.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('without a language or type', function() {
                        this.expected[0][OWL + 'hasValue'] = [{'@value': 'test'}];
                        let str = 'PropA value "test"';
                        let result = service.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a prefixed type', function() {
                        this.expected[0][OWL + 'hasValue'] = [{'@value': 'true', '@type': XSD + 'boolean'}];
                        let str = 'PropA value "true"^^xsd:boolean';
                        let result = service.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                    it('with a unprefixed type', function() {
                        this.expected[0][OWL + 'hasValue'] = [{'@value': 'true', '@type': 'http://test.com/datatype'}];
                        let str = 'PropA value "true"^^<http://test.com/datatype>';
                        let result = service.manchesterToJsonld(str, this.localNameMap);
                        expect(result.jsonld).toEqual(this.expected);
                        expect(result.errorMessage).toEqual('');
                    });
                });
                it('and a resource', function() {
                    this.expected[0][OWL + 'hasValue'] = [{'@id': this.localNameMap['ClassA']}];
                    let str = 'PropA value ClassA';
                    let result = service.manchesterToJsonld(str, this.localNameMap);
                    expect(result.jsonld).toEqual(this.expected);
                    expect(result.errorMessage).toEqual('');
                });
            });
            it('with minCardinality', function() {
                this.expected[0][OWL + 'minCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA min 1';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                this.expected[0][OWL + 'maxCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA max 1';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                this.expected[0][OWL + 'cardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA exactly 1';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with minCardinality', function() {
                this.expected[0][OWL + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][OWL + 'minCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA min 1 ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with maxCardinality', function() {
                this.expected[0][OWL + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][OWL + 'maxCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA max 1 ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
            it('with cardinality', function() {
                this.expected[0][OWL + 'onClass'] = [{'@id': this.localNameMap['ClassA']}];
                this.expected[0][OWL + 'cardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                let str = 'PropA exactly 1 ClassA';
                let result = service.manchesterToJsonld(str, this.localNameMap);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toEqual('');
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                this.expected = [{'@id': '_:genid0', '@type': [RDFS + 'Datatype']}];
            });
            it('with oneOf', function() {
                this.expected.push({
                    '@id': '_:genid1',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@value': 'A' }],
                    [RDF + 'rest']: [{ '@id': '_:genid2' }]
                });
                this.expected.push({
                    '@id': '_:genid2',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@value': 'B' }],
                    [RDF + 'rest']: [{ '@list': [] }]
                });
                this.expected[0][OWL + 'oneOf'] = [{ '@id': '_:genid1' }];
                let str = '{"A", "B"}';
                let result = service.manchesterToJsonld(str, this.localNameMap, true);
                expect(result.jsonld).toEqual(this.expected);
                expect(result.errorMessage).toBe('');
            });
        });
        it('with nested blank nodes', function() {
            let str = '(not ClassA) or ((PropD min 1) and (PropE exactly 10)) or (PropA some ClassB) or (PropC value IndvA) or (PropB only {"A", "B"})';
            this.expected = [
                {
                    '@id': '_:genid0',
                    '@type': [OWL + 'Class'],
                    [OWL + 'unionOf']: [{ '@id': '_:genid2' }]
                },
                {
                    '@id': '_:genid1',
                    '@type': [OWL + 'Class'],
                    [OWL + 'complementOf']: [{'@id': this.localNameMap['ClassA']}]
                },
                {
                    '@id': '_:genid2',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid1' }],
                    [RDF + 'rest']: [{ '@id': '_:genid4' }]
                },
                {
                    '@id': '_:genid3',
                    '@type': [OWL + 'Class'],
                    [OWL + 'intersectionOf']: [{ '@id': '_:genid6' }]
                },
                {
                    '@id': '_:genid4',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid3' }],
                    [RDF + 'rest']: [{ '@id': '_:genid10' }]
                },
                {
                    '@id': '_:genid5',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropD']}],
                    [OWL + 'minCardinality']: [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}]
                },
                {
                    '@id': '_:genid6',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid5' }],
                    [RDF + 'rest']: [{ '@id': '_:genid8'}]
                },
                {
                    '@id': '_:genid7',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropE']}],
                    [OWL + 'cardinality']: [{'@value': '10', '@type': XSD + 'nonNegativeInteger'}]
                },
                {
                    '@id': '_:genid8',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid7' }],
                    [RDF + 'rest']: [{ '@list': [] }]
                },
                {
                    '@id': '_:genid9',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropA']}],
                    [OWL + 'someValuesFrom']: [{'@id': this.localNameMap['ClassB']}]
                },
                {
                    '@id': '_:genid10',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid9' }],
                    [RDF + 'rest']: [{ '@id': '_:genid12' }]
                },
                {
                    '@id': '_:genid11',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropC']}],
                    [OWL + 'hasValue']: [{'@id': this.localNameMap['IndvA']}]
                },
                {
                    '@id': '_:genid12',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid11' }],
                    [RDF + 'rest']: [{ '@id': '_:genid14'}]
                },
                {
                    '@id': '_:genid13',
                    '@type': [OWL + 'Restriction'],
                    [OWL + 'onProperty']: [{'@id': this.localNameMap['PropB']}],
                    [OWL + 'allValuesFrom']: [{ '@id': '_:genid15' }]
                },
                {
                    '@id': '_:genid14',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': '_:genid13' }],
                    [RDF + 'rest']: [{ '@list': [] }]
                },
                {
                    '@id': '_:genid15',
                    '@type': [RDFS + 'Datatype'],
                    [OWL + 'oneOf']: [{ '@id': '_:genid16' }],
                },
                {
                    '@id': '_:genid16',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@value': 'A' }],
                    [RDF + 'rest']: [{ '@id': '_:genid17' }]
                },
                {
                    '@id': '_:genid17',
                    '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@value': 'B' }],
                    [RDF + 'rest']: [{ '@list': [] }]
                }
            ];
            let result = service.manchesterToJsonld(str, this.localNameMap);
            expect(result.jsonld).toEqual(this.expected);
            expect(result.errorMessage).toBe('');
        });
    });
    describe('should convert JSON-LD into Manchester syntax', function() {
        it('if given a list expression with a blank @list', function () {
            let bnodes = [
                {
                    '@id': '_:genid0',
                    '@type': [OWL + 'Class'],
                    [OWL + 'unionOf']: [{'@id': '_:genid1'}]
                },
                {
                    '@id': '_:genid1', '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': 'ClassA' }],
                    [RDF + 'rest']: [{'@id': '_:genid2'}]
                },
                {
                    '@id': '_:genid2', '@type': [RDF + 'List'],
                    [RDF + 'first']: [{ '@id': 'ClassB' }],
                    [RDF + 'rest']: [{ '@list': [] }]
                }
            ];
            let index = {
                '_:genid0': { position: 0 },
                '_:genid1': { position: 1 },
                '_:genid2': { position: 2 }
            };
            let result = service.jsonldToManchester(bnodes[0]['@id'], bnodes, index);
            expect(result).toBe('ClassA or ClassB');
        })
        describe('if given a class expression', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [OWL + 'Class']
                };
                this.jsonld = [this.blankNode];
                this.index = { '_:genid0': { position: 0 } };
            });
            describe('with unionOf', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'unionOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{ '@id': 'ClassA' }],
                        [RDF + 'rest']: [{ '@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> or </span>ClassB');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('ClassA or ClassB');
                });
            });
            describe('with intersectionOf', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'intersectionOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': 'ClassA'}],
                        [RDF + 'rest']: [{'@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('ClassA<span class="manchester-expr"> and </span>ClassB');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('ClassA and ClassB');
                });
            });
            describe('with complementOf', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'complementOf'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('<span class="manchester-expr">not </span>ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('not ClassA');
                });
            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'oneOf'] = [{'@id': '_:genid1'}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': 'ClassA'}],
                        [RDF + 'rest']: [{'@list': [{'@id': 'ClassB'}] }]
                    });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('{ClassA, ClassB}');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('{ClassA, ClassB}');
                });
            });
            it('unless it is invalid', function() {
                let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('if given a restriction', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [OWL + 'Restriction']
                };
                this.blankNode[OWL + 'onProperty'] = [{'@id': 'PropA'}];
                this.jsonld = [this.blankNode];
                this.index = { '_:genid0': { position: 0 } };
            });
            describe('with someValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'someValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> some </span>ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA some ClassA');
                });

            });
            describe('with allValuesFrom', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'allValuesFrom'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> only </span>ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA only ClassA');
                });
            });
            describe('with hasValue', function() {
                describe('and a literal', function() {
                    it('with a language', function() {
                        this.blankNode[OWL + 'hasValue'] = [{'@value': 'test', '@language': 'en'}];
                        let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "test"@en');
                    });
                    it('without a language or type', function() {
                        this.blankNode[OWL + 'hasValue'] = [{'@value': 'test', '@type': XSD + 'string'}];
                        let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "test"');
                    });
                    it('with a type', function() {
                        this.blankNode[OWL + 'hasValue'] = [{'@value': 'true', '@type': XSD + 'boolean'}];
                        let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                        expect(result).toBe('PropA value "true"^^xsd:boolean');
                    });
                });
                it('and a resource', function() {
                    this.blankNode[OWL + 'hasValue'] = [{'@id': 'ClassA'}];
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA value ClassA');
                });
            });
            describe('with minCardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'minCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA min 1');
                });
            });
            describe('with maxCardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'maxCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA max 1');
                });
            });
            describe('with cardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'cardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span>');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA exactly 1');
                });
            });
            describe('with minQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'minCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                    this.blankNode[OWL + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> min </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA min 1 ClassA');
                });
            });
            describe('with maxQualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'maxCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                    this.blankNode[OWL + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> max </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA max 1 ClassA');
                });
            });
            describe('with qualifiedCardinality', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'cardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                    this.blankNode[OWL + 'onClass'] = [{'@id': 'ClassA'}];
                });
                it('with HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('PropA<span class="manchester-rest"> exactly </span><span class="manchester-lit">1</span> ClassA');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('PropA exactly 1 ClassA');
                });
            });
            it('with onClass being a blank node', function() {
                this.jsonld = [
                    this.blankNode,
                    {
                        '@id': '_:genid1',
                        '@type': [OWL + 'Class'],
                        [OWL + 'unionOf']: [{'@id': '_:genid2'}]
                    },
                    {
                        '@id': '_:genid2', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': 'ClassA'}],
                        [RDF + 'rest']: [{'@list': [{'@id': 'ClassB'}]}]
                    }
                ];

                this.index['_:genid1'] = { position: 1 } ;
                this.index['_:genid2'] = { position: 2 } ;

                this.blankNode[OWL + 'minCardinality'] = [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}];
                this.blankNode[OWL + 'onClass'] = [{'@id': '_:genid1'}];
                let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                expect(result).toBe('PropA min 1 (ClassA or ClassB)');
            });
        });
        describe('if given a datatype', function() {
            beforeEach(function() {
                this.blankNode = {
                    '@id': '_:genid0',
                    '@type': [RDF + 'Datatype']
                };
                this.jsonld = [this.blankNode];
                this.index = { '_:genid0': { position: 0 } };

            });
            describe('with oneOf', function() {
                beforeEach(function() {
                    this.blankNode[OWL + 'oneOf'] = [{'@id': '_:genid1', '@type': [RDF + 'Datatype']}];
                    this.jsonld.push({
                        '@id': '_:genid1', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@value': 'A'}],
                        [RDF + 'rest']: [{'@list': [{'@value': 'B'}]

                        }]
                     });
                    this.index['_:genid1'] = {position: 1};
                });
                it('and HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index, true);
                    expect(result).toBe('{<span class="manchester-lit">"A"</span>, <span class="manchester-lit">"B"</span>}');
                });
                it('without HTML', function() {
                    let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                    expect(result).toBe('{"A", "B"}');
                });
            });
            it('unless it is invalid', function() {
                let result = service.jsonldToManchester(this.blankNode['@id'], this.jsonld, this.index);
                expect(result).toBe(this.blankNode['@id']);
            });
        });
        describe('with nested blank nodes', function() {
            beforeEach(function() {
                this.index = {
                    '_:genid0': { position: 0, node: {
                        '@id': '_:genid0', '@type': [OWL + 'Class'],
                        [OWL + 'unionOf']: [{'@id': '_:genid1'}]
                    } }, // unionOf
                    '_:genid1': {position: 1, node: {
                        '@id': '_:genid1', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': '_:genid2'}],
                        [RDF + 'rest']: [{'@id': '_:genid3'}]
                    } }, // unionOf - 1
                    '_:genid2': {position: 2, node: {
                        '@id': '_:genid2', '@type': [OWL + 'Class'],
                        [OWL + 'complementOf']: [{'@id': 'ClassA'}]
                    } }, // complementOf
                    '_:genid3': {position: 3, node: {
                        '@id': '_:genid3', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': '_:genid4'}],
                        [RDF + 'rest']: [{'@id': '_:genid9'}]
                    } }, // unionOf - 2
                    '_:genid4': {position: 4, node: {
                        '@id': '_:genid4', '@type': [OWL + 'Class'],
                        [OWL + 'intersectionOf']: [{'@id': '_:genid5'}]
                    } }, // intersectionOf
                    '_:genid5': {position: 5, node: {
                        '@id': '_:genid5', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': '_:genid6'}],
                        [RDF + 'rest']: [{'@list': [{'@id': '_:genid8'}]}]
                    } }, // intersectionOf - 1
                    '_:genid6': {position: 6, node: {
                        '@id': '_:genid6', '@type': [OWL + 'Restriction'],
                        [OWL + 'onProperty']: [{'@id': 'PropD'}],
                        [OWL + 'minCardinality']: [{'@value': '1', '@type': XSD + 'nonNegativeInteger'}]
                    } }, // minCardinality
                    '_:genid8': {position: 7, node: {
                        '@id': '_:genid8', '@type': [OWL + 'Restriction'],
                        [OWL + 'onProperty']: [{'@id': 'PropE'}],
                        [OWL + 'cardinality']: [{'@value': '10', '@type': XSD + 'nonNegativeInteger'}]
                    } }, // cardinality
                    '_:genid9': {position: 8, node: {
                        '@id': '_:genid9', '@type': [RDF + 'List'],
                        [RDF + 'first']: [{'@id': '_:genid10'}],
                        [RDF + 'rest']: [{'@list': [{'@id': '_:genid12'}]}]
                    } }, // unionOf - 3
                    '_:genid10': {position: 9, node: {
                        '@id': '_:genid10', '@type': [OWL + 'Restriction'],
                        [OWL + 'onProperty']: [{'@id': 'PropA'}],
                        [OWL + 'someValuesFrom']: [{'@id': 'ClassB'}]
                    } }, // someValuesFrom
                    '_:genid12': {position: 10, node: {
                        '@id': '_:genid12', '@type': [OWL + 'Restriction'],
                        [OWL + 'onProperty']: [{'@id': 'PropB'}],
                        [OWL + 'allValuesFrom']: [{'@id': '_:genid13'}]
                    } }, // allValuesFrom
                    '_:genid13': {position: 11, node: {
                        '@id': '_:genid13', '@type': [OWL + 'Restriction'],
                        [OWL + 'onProperty']: [{'@id': 'PropC'}],
                        [OWL + 'hasValue']: [{'@id': 'ClassC'}]
                    } } // hasValue
                };
                this.jsonld = map(this.index, 'node');

            });
            it('and HTML', function() {
                let result = service.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld, this.index, true);
                expect(result).toBe('(<span class="manchester-expr">not </span>ClassA)<span class="manchester-expr"> or </span>'
                    + '((PropD<span class="manchester-rest"> min </span><span class="manchester-lit">1</span>)'
                    + '<span class="manchester-expr"> and </span>(PropE<span class="manchester-rest"> exactly </span><span class="manchester-lit">10</span>))'
                    + '<span class="manchester-expr"> or </span>(PropA<span class="manchester-rest"> some </span>ClassB)'
                    + '<span class="manchester-expr"> or </span>(PropB<span class="manchester-rest"> only </span>'
                    + '(PropC<span class="manchester-rest"> value </span>ClassC))');
            });
            it('without HTML', function() {
                let result = service.jsonldToManchester(this.jsonld[0]['@id'], this.jsonld, this.index);
                expect(result).toBe('(not ClassA) or ((PropD min 1) and (PropE exactly 10)) '
                    + 'or (PropA some ClassB) or (PropB only (PropC value ClassC))');
            });
        });
    });
});
