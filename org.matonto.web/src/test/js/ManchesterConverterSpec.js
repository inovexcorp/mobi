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
    var manchesterConverterSvc, ontologyManagerSvc, prefixes, splitIRIFilter;

    beforeEach(function() {
        module('manchesterConverter');
        mockPrefixes();
        mockOntologyManager();
        injectSplitIRIFilter();

        inject(function(manchesterConverterService, _ontologyManagerService_, _prefixes_, _splitIRIFilter_) {
            manchesterConverterSvc = manchesterConverterService;
            ontologyManagerSvc = _ontologyManagerService_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
        });

        ontologyManagerSvc.isBlankNodeId.and.callFake(function(id) {
            return _.includes(id, '_:genid');
        });
        ontologyManagerSvc.isClass.and.callFake(function(obj) {
            return _.includes(obj['@type'], prefixes.owl + 'Class');
        });
        ontologyManagerSvc.isRestriction.and.callFake(function(obj) {
            return _.includes(obj['@type'], prefixes.owl + 'Restriction');
        });
        splitIRIFilter.and.callFake(function(str) {
            return {end: str};
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
            it('with unionOf', function() {
                this.blankNode[prefixes.owl + 'unionOf'] = [{'@list': [
                    {
                        '@id': 'ClassA'
                    },
                    {
                        '@id': 'ClassB'
                    }
                ]}];
                expect(manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld)).toBe('ClassA or ClassB');
            });
            it('with intersectionOf', function() {
                this.blankNode[prefixes.owl + 'intersectionOf'] = [{'@list': [
                    {
                        '@id': 'ClassA'
                    },
                    {
                        '@id': 'ClassB'
                    }
                ]}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('ClassA and ClassB');
            });
            it('with complementOf', function() {
                this.blankNode[prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('not ClassA');
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('');
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
            it('with someValuesFrom', function() {
                this.blankNode[prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassA'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('PropA some ClassA');
            });
            it('with allValuesFrom', function() {
                this.blankNode[prefixes.owl + 'allValuesFrom'] = [{'@id': 'ClassA'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('PropA only ClassA');
            });
            describe('with hasValue', function() {
                it('and a literal', function() {
                    this.blankNode[prefixes.owl + 'hasValue'] = [{'@value': 'test'}];
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA value "test"');
                });
                it('and a resource', function() {
                    this.blankNode[prefixes.owl + 'hasValue'] = [{'@id': 'ClassA'}];
                    var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                    expect(result).toBe('PropA value ClassA');
                });
            });
            it('with minCardinality', function() {
                this.blankNode[prefixes.owl + 'minCardinality'] = [{'@value': '1'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('PropA min 1');
            });
            it('with maxCardinality', function() {
                this.blankNode[prefixes.owl + 'maxCardinality'] = [{'@value': '1'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('PropA max 1');
            });
            it('with cardinality', function() {
                this.blankNode[prefixes.owl + 'cardinality'] = [{'@value': '1'}];
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('PropA exactly 1');
            });
            it('unless it is invalid', function() {
                var result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('');

                delete this.blankNode[prefixes.owl + 'onProperty'];
                result = manchesterConverterSvc.jsonldToManchester(this.blankNode['@id'], this.jsonld);
                expect(result).toBe('');
            });
        });
        it('with nested blank nodes', function() {
            var jsonld = [
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
            jsonld[0][prefixes.owl + 'unionOf'] = [{'@list': [
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
            jsonld[1][prefixes.owl + 'complementOf'] = [{'@id': 'ClassA'}];
            jsonld[2][prefixes.owl + 'intersectionOf'] = [{'@list': [
                {
                    '@id': '_:genid6'
                },
                {
                    '@id': '_:genid7'
                }
            ]}];
            jsonld[3][prefixes.owl + 'onProperty'] = [{'@id': 'PropA'}];
            jsonld[3][prefixes.owl + 'someValuesFrom'] = [{'@id': 'ClassB'}];
            jsonld[4][prefixes.owl + 'onProperty'] = [{'@id': 'PropB'}];
            jsonld[4][prefixes.owl + 'allValuesFrom'] = [{'@id': '_:genid5'}];
            jsonld[5][prefixes.owl + 'onProperty'] = [{'@id': 'PropC'}];
            jsonld[5][prefixes.owl + 'hasValue'] = [{'@id': 'ClassC'}];
            jsonld[6][prefixes.owl + 'onProperty'] = [{'@id': 'PropD'}];
            jsonld[6][prefixes.owl + 'minCardinality'] = [{'@value': '1'}];
            jsonld[7][prefixes.owl + 'onProperty'] = [{'@id': 'PropE'}];
            jsonld[7][prefixes.owl + 'cardinality'] = [{'@value': '10'}];
            var result = manchesterConverterSvc.jsonldToManchester(jsonld[0]['@id'], jsonld);
            expect(result).toBe('(not ClassA) or ((PropD min 1) and (PropE exactly 10)) or (PropA some ClassB) or (PropB only (PropC value ClassC))');
        });
    });
});
