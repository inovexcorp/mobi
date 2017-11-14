/*-
 * #%L
 * com.mobi.web
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
describe('Explore Utils Service', function() {
    var exploreUtilsSvc, scope, $q, utilSvc, prefixes, regex, utilSvc, datasetManagerSvc, ontologyManagerSvc, sparqlManagerSvc;

    beforeEach(function() {
        module('exploreUtils');
        mockPrefixes();
        injectRegexConstant();
        mockUtil();
        mockDatasetManager();
        mockOntologyManager();
        mockSparqlManager();

        inject(function(exploreUtilsService, _$rootScope_, _$q_, _prefixes_, _REGEX_, _utilService_, _datasetManagerService_, _ontologyManagerService_, _sparqlManagerService_) {
            exploreUtilsSvc = exploreUtilsService;
            scope = _$rootScope_;
            $q = _$q_;
            prefixes = _prefixes_;
            regex = _REGEX_;
            utilSvc = _utilService_;
            datasetManagerSvc = _datasetManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            sparqlManagerSvc = _sparqlManagerService_;
        });

        this.fewProperties = [{
            propertyIRI: 'propertyId',
            type: 'Data',
            range: ['string']
        }, {
            propertyIRI: 'propertyId2',
            type: 'Object'
        }, {
            propertyIRI: 'propertyId3',
            type: 'Data',
            range: [prefixes.xsd + 'boolean']
        }];

        this.allProperties = [{
            propertyIRI: 'id1',
            range: [prefixes.xsd + 'dateTime']
        }, {
            propertyIRI: 'id2',
            range: [prefixes.xsd + 'dateTimeStamp']
        }, {
            propertyIRI: 'id3',
            range: [prefixes.xsd + 'decimal']
        }, {
            propertyIRI: 'id4',
            range: [prefixes.xsd + 'double']
        }, {
            propertyIRI: 'id5',
            range: [prefixes.xsd + 'float']
        }, {
            propertyIRI: 'id6',
            range: [prefixes.xsd + 'int']
        }, {
            propertyIRI: 'id7',
            range: [prefixes.xsd + 'integer']
        }, {
            propertyIRI: 'id8',
            range: [prefixes.xsd + 'long']
        }, {
            propertyIRI: 'id9',
            range: [prefixes.xsd + 'short']
        }, {
            propertyIRI: 'id10',
            range: [prefixes.xsd + 'other']
        }];
    });

    afterEach(function() {
        exploreUtilsSvc = null;
        $q = null;
        utilSvc = null;
        prefixes = null;
        regex = null;
        utilSvc = null;
        datasetManagerSvc = null;
        ontologyManagerSvc = null;
        sparqlManagerSvc = null;
    });

    it('getInputType should return the correct input type', function() {
        utilSvc.getInputType.and.returnValue('type');
        spyOn(exploreUtilsSvc, 'getRange').and.returnValue('iri');
        expect(exploreUtilsSvc.getInputType('id', [])).toBe('type');
        expect(exploreUtilsSvc.getRange).toHaveBeenCalledWith('id', []);
        expect(utilSvc.getInputType).toHaveBeenCalledWith('iri');
    });
    it('getPattern should return the correct pattern', function() {
        utilSvc.getPattern.and.returnValue(/[a-zA-Z]/);
        spyOn(exploreUtilsSvc, 'getRange').and.returnValue('iri');
        expect(exploreUtilsSvc.getPattern('id', [])).toEqual(/[a-zA-Z]/);
        expect(exploreUtilsSvc.getRange).toHaveBeenCalledWith('id', []);
        expect(utilSvc.getPattern).toHaveBeenCalledWith('iri');
    });
    it('isPropertyOfType should return the proper boolean based on the properties list', function() {
        expect(exploreUtilsSvc.isPropertyOfType('propertyId', 'Data', this.fewProperties)).toBe(true);
        expect(exploreUtilsSvc.isPropertyOfType('propertyId', 'Object', this.fewProperties)).toBe(false);
        expect(exploreUtilsSvc.isPropertyOfType('missingId', 'Data', this.fewProperties)).toBe(false);
    });
    it('isBoolean should return the correct boolean', function() {
        expect(exploreUtilsSvc.isBoolean('propertyId', this.fewProperties)).toBe(false);
        expect(exploreUtilsSvc.isBoolean('propertyId3', this.fewProperties)).toBe(true);
    });
    it('createIdObj should return an appropriate object', function() {
        expect(exploreUtilsSvc.createIdObj('id')).toEqual({'@id': 'id'});
    });
    describe('createValueObj should create correct object for the provided string', function() {
        it('with a type', function() {
            expect(exploreUtilsSvc.createValueObj('value', 'propertyId', this.fewProperties)).toEqual({'@value': 'value', '@type': 'string'});
        });
        it('without a type', function() {
            expect(exploreUtilsSvc.createValueObj('value', 'propertyId2', this.fewProperties)).toEqual({'@value': 'value'});
        });
    });
    describe('getRange should return the correct range if propertyIRI is', function() {
        it('found', function() {
            expect(exploreUtilsSvc.getRange('id1', this.allProperties)).toEqual(prefixes.xsd + 'dateTime');
        });
        it('not found', function() {
            expect(exploreUtilsSvc.getRange('missing-id', this.allProperties)).toEqual('');
        });
    });
    describe('contains should return the correct value when the lowered string is', function() {
        it('contained', function() {
            expect(exploreUtilsSvc.contains('WORD', 'w')).toBe(true);
        });
        it('not contained', function() {
            expect(exploreUtilsSvc.contains('MISSING', 'w')).toBe(false);
        });
    });
    describe('getClasses should retrieve all classes from ontologies in a dataset', function() {
        beforeEach(function() {
            this.datasetId = 'dataset';
            var record = {'@id': this.datasetId, '@type': []};
            record[prefixes.dataset + 'ontology'] = [{'@id': 'ontology1'}];
            datasetManagerSvc.datasetRecords = [[record, {'id': 'ontology1'}]];
            utilSvc.getPropertyId.and.callFake(function(obj, propId) {
                if (propId === prefixes.dataset + 'linksToRecord') {
                    return 'recordId';
                } else if (propId === prefixes.dataset + 'linksToBranch') {
                    return 'branchId';
                } else if (propId === prefixes.dataset + 'linksToCommit') {
                    return 'commitId';
                } else {
                    return '';
                }
            });
        });
        it('unless the dataset could not be found', function() {
            exploreUtilsSvc.getClasses('')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Dataset could not be found');
                });
            scope.$apply();
        });
        it('unless an error occurs', function() {
            ontologyManagerSvc.getOntologyClasses.and.returnValue($q.reject('Error Message'));
            exploreUtilsSvc.getClasses(this.datasetId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('The Dataset ontologies could not be found');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        });
        it('unless no classes are retrieved', function() {
            ontologyManagerSvc.getOntologyClasses.and.returnValue($q.when([]));
            exploreUtilsSvc.getClasses(this.datasetId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('The Dataset classes could not be retrieved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        });
        it('successfully', function() {
            utilSvc.getPropertyValue.and.returnValue(true);
            ontologyManagerSvc.getEntityName.and.returnValue('title');
            ontologyManagerSvc.getOntologyClasses.and.returnValue($q.when([{'@id': 'classId'}]));
            exploreUtilsSvc.getClasses(this.datasetId)
                .then(function(response) {
                    expect(response).toContain({id: 'classId', title: 'title', deprecated: true});
                }, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(ontologyManagerSvc.getOntologyClasses).toHaveBeenCalledWith('recordId', 'branchId', 'commitId');
        });
    });
    describe('getNewProperties should return a list of properties that are not set on the entity', function() {
        beforeEach(function() {
            this.entity = {
                '@id': 'id',
                '@type': ['type'],
                'prop1': [{
                    '@id': 'http://mobi.com/id'
                }],
                'prop2': [{
                    '@value': 'value1'
                }, {
                    '@value': 'value2'
                }]
            };
        });
        it('without filtering', function() {
            expect(exploreUtilsSvc.getNewProperties(this.fewProperties, this.entity, '')).toEqual(['propertyId', 'propertyId2', 'propertyId3']);
        });
        it('with filtering', function() {
            expect(exploreUtilsSvc.getNewProperties(this.fewProperties, this.entity, 'iD3')).toEqual(['propertyId3']);
        });
    });
    it('removeEmptyProperties should remove properties that are empty arrays', function() {
        var object = {
            '@id': 'id',
            prop: []
        };
        var expected = {'@id': 'id'};
        expect(exploreUtilsSvc.removeEmptyProperties(object)).toEqual(expected);
    });
    it('removeEmptyPropertiesFromArray should call the proper method for each item in the array', function() {
        spyOn(exploreUtilsSvc, 'removeEmptyProperties').and.returnValue({prop: 'new'});
        var array = [{
            '@id': 'id'
        }, {
            '@id': '_:b0'
        }];
        expect(exploreUtilsSvc.removeEmptyPropertiesFromArray(array)).toEqual([{prop: 'new'}, {prop: 'new'}]);
        _.forEach(array, function(item) {
            expect(exploreUtilsSvc.removeEmptyProperties).toHaveBeenCalledWith(item);
        });
    });
    it('getReification should find a Statement object for the identified statement', function() {
        var sub = 'subject', pred = 'predicate', value = {'@value': 'value'};
        var array = [
            {'@type': [prefixes.rdf + 'Statement']},
            {'@type': [prefixes.rdf + 'Statement']},
            {'@type': [prefixes.rdf + 'Statement']},
            {'@type': [prefixes.rdf + 'Statement']}
        ];
        array[0][prefixes.rdf + 'subject'] = [{'@id': sub}];
        array[2][prefixes.rdf + 'subject'] = [{'@id': sub}];
        array[3][prefixes.rdf + 'subject'] = [{'@id': sub}];
        array[0][prefixes.rdf + 'predicate'] = [{'@id': pred}];
        array[1][prefixes.rdf + 'predicate'] = [{'@id': pred}];
        array[3][prefixes.rdf + 'predicate'] = [{'@id': pred}];
        array[0][prefixes.rdf + 'object'] = [value];
        array[1][prefixes.rdf + 'object'] = [value];
        array[2][prefixes.rdf + 'object'] = [value];
        expect(exploreUtilsSvc.getReification(array, sub, pred, value)).toEqual(array[0]);
        expect(exploreUtilsSvc.getReification(array, '', pred, value)).toBeUndefined();
        expect(exploreUtilsSvc.getReification(array, sub, '', value)).toBeUndefined();
        expect(exploreUtilsSvc.getReification(array, sub, pred, {})).toBeUndefined();
    });
});
