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
describe('Instance Form directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, prefixes, exploreSvc, $q, util, allProperties, regex, exploreUtilsSvc;

    beforeEach(function() {
        module('templates');
        module('instanceForm');
        mockDiscoverState();
        mockUtil();
        mockExplore();
        mockPrefixes();
        injectRegexConstant();
        mockExploreUtils();

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _prefixes_, _exploreService_, _utilService_, _REGEX_, _exploreUtilsService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            prefixes = _prefixes_;
            util = _utilService_;
            regex = _REGEX_;
            exploreUtilsSvc = _exploreUtilsService_;
        });

        discoverStateSvc.getInstance.and.returnValue({
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
        });
        scope.header = 'header';
        scope.isValid = false;
        element = $compile(angular.element('<instance-form header="header" is-valid="isValid"></instance-form>'))(scope);
        scope.$digest();
        controller = element.controller('instanceForm');
        controller.properties = [{
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
        controller.changed = ['iri'];
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

    describe('in isolated scope', function() {
        it('header should be one way bound', function() {
            element.isolateScope().header = 'new';
            scope.$digest();
            expect(scope.header).toBe('header');
        });
    });
    describe('controller bound variables', function() {
        it('isValid should be two way bound', function() {
            controller.isValid = true;
            scope.$digest();
            expect(scope.isValid).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-form')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a .col-xs-8.col-xs-offset-2', function() {
            expect(element.querySelectorAll('.col-xs-8.col-xs-offset-2').length).toBe(1);
        });
        it('with a h2', function() {
            expect(element.find('h2').length).toBe(1);
        });
        it('with a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('with a .boolean-property', function() {
            expect(element.querySelectorAll('.boolean-property').length).toBe(2);
            
            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();
            
            expect(element.querySelectorAll('.boolean-property').length).toBe(0);
        });
        it('with a .data-property', function() {
            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();
            
            expect(element.querySelectorAll('.data-property').length).toBe(2);
            
            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();
            
            expect(element.querySelectorAll('.data-property').length).toBe(0);
        });
        it('with a .object-property', function() {
            expect(element.querySelectorAll('.object-property').length).toBe(2);
            
            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();
            
            expect(element.querySelectorAll('.object-property').length).toBe(0);
        });
        it('with a .btn-container.clearfix', function() {
            expect(element.querySelectorAll('.btn-container.clearfix').length).toBe(1);
        });
        it('with a .btn.btn-link', function() {
            expect(element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
        it('with a new-instance-property-overlay', function() {
            expect(element.find('new-instance-property-overlay').length).toBe(0);
            
            controller.showOverlay = true;
            scope.$digest();
            
            expect(element.find('new-instance-property-overlay').length).toBe(1);
        });
        it('with a property-value-overlay', function() {
            expect(element.find('property-value-overlay').length).toBe(0);
            
            controller.showPropertyValueOverlay = true;
            scope.$digest();
            
            expect(element.find('property-value-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('getOptions should result in the correct list when the propertyIRI', function() {
            describe('has a range and getClassInstanceDetails is', function() {
                beforeEach(function() {
                    exploreUtilsSvc.getRange.and.returnValue('string');
                });
                describe('resolved', function() {
                    beforeEach(function() {
                        exploreSvc.getClassInstanceDetails.and.returnValue($q.when({
                            data: [{
                                instanceIRI: 'propertyId'
                            }, {
                                instanceIRI: 'propertyId2'
                            }, {
                                instanceIRI: 'propertyId3'
                            }]
                        }));
                    });
                    it('without filtering', function() {
                        controller.getOptions('propertyId')
                            .then(function(response) {
                                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0}, true);
                                expect(response).toEqual(['propertyId', 'propertyId2', 'propertyId3']);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                    it('with filtering', function() {
                        exploreUtilsSvc.contains.and.callFake(function(string, part) {
                            return _.includes(_.toLower(string), _.toLower(part));
                        });
                        controller.searchText.propertyId = '3';
                        controller.getOptions('propertyId')
                            .then(function(response) {
                                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0}, true);
                                expect(response).toEqual(['propertyId3']);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                    });
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    controller.getOptions('propertyId')
                        .then(function(response) {
                            expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0}, true);
                            expect(util.createErrorToast).toHaveBeenCalledWith('error');
                            expect(response).toEqual([]);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                });
            });
            it('does not have a range', function() {
                controller.getOptions('propertyId2')
                    .then(function(response) {
                        expect(response).toEqual([]);
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
            });
        });
        describe('addToChanged adds the provided iri to the changed array', function() {
            beforeEach(function() {
                spyOn(controller, 'getMissingProperties').and.returnValue(['missing property']);
            });
            it('when it is new', function() {
                controller.addToChanged('new');
                expect(controller.changed).toEqual(['iri', 'new']);
                expect(controller.getMissingProperties).toHaveBeenCalled();
                expect(controller.missingProperties).toEqual(['missing property']);
            });
            it('when it is not new', function() {
                controller.addToChanged('iri');
                expect(controller.changed).toEqual(['iri']);
                expect(controller.getMissingProperties).toHaveBeenCalled();
                expect(controller.missingProperties).toEqual(['missing property']);
            });
        });
        it('isChanged should return the proper value', function() {
            expect(controller.isChanged('iri')).toBe(true);
            expect(controller.isChanged('new')).toBe(false);
        });
        it('setIRI should set the proper value', function() {
            controller.setIRI('begin', '#', 'end');
            expect(controller.instance['@id']).toBe('begin#end');
        });
        it('addNewProperty should set variables correctly', function() {
            spyOn(controller, 'addToChanged');
            controller.showOverlay = true;
            controller.addNewProperty('newProperty');
            expect(_.has(controller.instance, 'newProperty')).toBe(true);
            expect(controller.addToChanged).toHaveBeenCalledWith('newProperty');
            expect(controller.showOverlay).toBe(false);
        });
        it('onSelect sets the correct variables', function() {
            controller.showPropertyValueOverlay = false;
            controller.onSelect('text');
            controller.fullText = 'text';
            controller.showPropertyValueOverlay = true;
        });
        it('getMissingProperties retrieves the proper list of messages', function() {
            util.getBeautifulIRI.and.callFake(_.identity);
            controller.properties = [{
                propertyIRI: 'propertyId',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'DATA_EXACT_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId2',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'DATA_MIN_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId3',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'DATA_MAX_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId4',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'OBJECT_EXACT_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId5',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'OBJECT_MIN_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId6',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'OBJECT_MAX_CARDINALITY'
                }]
            }, {
                propertyIRI: 'propertyId7',
                restrictions: [{
                    cardinality: 1,
                    classExpressionType: 'DATA_EXACT_CARDINALITY'
                }]
            }];
            controller.instance = {
                '@id': 'id',
                propertyId7: [{'@value': 'just the one'}],
                propertyId3: [{'@value': 'one'}, {'@value': 'two'}],
                propertyId6: [{'@value': 'one'}, {'@value': 'two'}]
            };
            var expected = [
                'Must have exactly 1 value(s) for propertyId',
                'Must have at least 1 value(s) for propertyId2',
                'Must have at most 1 value(s) for propertyId3',
                'Must have exactly 1 value(s) for propertyId4',
                'Must have at least 1 value(s) for propertyId5',
                'Must have at most 1 value(s) for propertyId6'
            ];
            expect(controller.getMissingProperties()).toEqual(expected);
            _.forEach(['propertyId', 'propertyId2', 'propertyId3', 'propertyId4', 'propertyId5', 'propertyId6'], function(item) {
                expect(util.getBeautifulIRI).toHaveBeenCalledWith(item);
            });
            expect(controller.isValid).toBe(false);
        });
        describe('getRestrictionText should return the correct value for', function() {
            beforeEach(function() {
                controller.properties = [{
                    propertyIRI: 'propertyId',
                    restrictions: [{
                        cardinality: 1,
                        classExpressionType: 'DATA_EXACT_CARDINALITY'
                    }]
                }, {
                    propertyIRI: 'propertyId2',
                    restrictions: [{
                        cardinality: 1,
                        classExpressionType: 'DATA_MIN_CARDINALITY'
                    }]
                }, {
                    propertyIRI: 'propertyId3',
                    restrictions: [{
                        cardinality: 1,
                        classExpressionType: 'DATA_MAX_CARDINALITY'
                    }]
                }, {
                    propertyIRI: 'propertyId4'
                }];
            });
            it('exact restriction', function() {
                expect(controller.getRestrictionText('propertyId')).toBe('[exactly 1]');
            });
            it('min restriction', function() {
                expect(controller.getRestrictionText('propertyId2')).toBe('[at least 1]');
            });
            it('max restriction', function() {
                expect(controller.getRestrictionText('propertyId3')).toBe('[at most 1]');
            });
            it('no restriction', function() {
                expect(controller.getRestrictionText('propertyId4')).toBe('');
            });
        });
        it('cleanUpReification should remove the reification triple from the entity', function() {
            var entity = {
                '@id': '_:b0',
                '@type': ['statement']
            };
            entity[prefixes.rdf + 'predicate'] = [{'@id': 'predicate'}];
            entity[prefixes.rdf + 'object'] = [{'@value': 'value'}];
            discoverStateSvc.explore.instance.entity = [{}, entity];
            controller.cleanUpReification({'@value': 'value'}, 'predicate');
            expect(discoverStateSvc.explore.instance.entity).toEqual([{}]);
        });
    });
});