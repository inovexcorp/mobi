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
describe('Explore Utils Service', function() {
    var exploreUtilsSvc, utilSvc, allProperties, fewProperties, prefixes, regex;

    beforeEach(function() {
        module('exploreUtils');
        mockPrefixes();
        injectRegexConstant();

        inject(function(exploreUtilsService, _prefixes_, _REGEX_) {
            exploreUtilsSvc = exploreUtilsService;
            prefixes = _prefixes_;
            regex = _REGEX_;
        });

        fewProperties = [{
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

        allProperties = [{
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

    it('getInputType should return the correct input type', function() {
        _.forEach(['id1', 'id2'], function(id) {
            expect(exploreUtilsSvc.getInputType(id, allProperties)).toBe('date');
        });
        _.forEach(['id3', 'id4', 'id5', 'id6', 'id7', 'id8', 'id9'], function(id) {
            expect(exploreUtilsSvc.getInputType(id, allProperties)).toBe('number');
        });
        expect(exploreUtilsSvc.getInputType('id10', allProperties)).toBe('text');
    });
    it('getPattern should return the correct pattern', function() {
        _.forEach(['id1', 'id2'], function(id) {
            expect(exploreUtilsSvc.getPattern(id, allProperties)).toBe(regex.DATETIME);
        });
        _.forEach(['id3', 'id4', 'id5'], function(id) {
            expect(exploreUtilsSvc.getPattern(id, allProperties)).toBe(regex.DECIMAL);
        });
        _.forEach(['id6', 'id7', 'id8', 'id9'], function(id) {
            expect(exploreUtilsSvc.getPattern(id, allProperties)).toBe(regex.INTEGER);
        });
        expect(exploreUtilsSvc.getPattern('id10', allProperties)).toBe(regex.ANYTHING);
    });
    it('isPropertyOfType should return the proper boolean based on the properties list', function() {
        expect(exploreUtilsSvc.isPropertyOfType('propertyId', 'Data', fewProperties)).toBe(true);
        expect(exploreUtilsSvc.isPropertyOfType('propertyId', 'Object', fewProperties)).toBe(false);
        expect(exploreUtilsSvc.isPropertyOfType('missingId', 'Data', fewProperties)).toBe(false);
    });
    it('isBoolean should return the correct boolean', function() {
        expect(exploreUtilsSvc.isBoolean('propertyId', fewProperties)).toBe(false);
        expect(exploreUtilsSvc.isBoolean('propertyId3', fewProperties)).toBe(true);
    });
    it('createIdObj should return an appropriate object', function() {
        expect(exploreUtilsSvc.createIdObj('id')).toEqual({'@id': 'id'});
    });
    describe('createValueObj should create correct object for the provided string', function() {
        it('with a type', function() {
            expect(exploreUtilsSvc.createValueObj('value', 'propertyId', fewProperties)).toEqual({'@value': 'value', '@type': 'string'});
        });
        it('without a type', function() {
            expect(exploreUtilsSvc.createValueObj('value', 'propertyId2', fewProperties)).toEqual({'@value': 'value'});
        });
    });
    describe('getRange should return the correct range if propertyIRI is', function() {
        it('found', function() {
            expect(exploreUtilsSvc.getRange('id1', allProperties)).toEqual(prefixes.xsd + 'dateTime');
        });
        it('not found', function() {
            expect(exploreUtilsSvc.getRange('missing-id', allProperties)).toEqual('');
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
    describe('getNewProperties should return a list of properties that are not set on the entity', function() {
        var entity = {
            '@id': 'id',
            '@type': ['type'],
            'prop1': [{
                '@id': 'http://matonto.org/id'
            }],
            'prop2': [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        };
        it('without filtering', function() {
            expect(exploreUtilsSvc.getNewProperties(fewProperties, entity, '')).toEqual(['propertyId', 'propertyId2', 'propertyId3']);
        });
        it('with filtering', function() {
            expect(exploreUtilsSvc.getNewProperties(fewProperties, entity, '3')).toEqual(['propertyId3']);
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
