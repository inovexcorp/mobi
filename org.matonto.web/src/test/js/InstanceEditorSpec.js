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
describe('Instance Editor directive', function() {
    var $compile, scope, element, discoverStateSvc, controller, prefixes, exploreSvc, $q, util, allProperties, regex;

    beforeEach(function() {
        module('templates');
        module('instanceEditor');
        mockDiscoverState();
        mockUtil();
        mockExplore();
        mockPrefixes();
        injectRegexConstant();

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _prefixes_, _exploreService_, _utilService_, _REGEX_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            prefixes = _prefixes_;
            util = _utilService_;
            regex = _REGEX_;
        });

        discoverStateSvc.explore.instance.entity = {
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
        element = $compile(angular.element('<instance-editor></instance-editor>'))(scope);
        scope.$digest();
        controller = element.controller('instanceEditor');
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

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-editor')).toBe(true);
        });
        it('for a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('for a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('for a breadcrumbs', function() {
            expect(element.find('breadcrumbs').length).toBe(1);
        });
        it('for block-header .links', function() {
            expect(element.querySelectorAll('block-header .link').length).toBe(2);
        });
        it('for a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('for a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(1);
        });
        it('for a .col-xs-8.col-xs-offset-2', function() {
            expect(element.querySelectorAll('.col-xs-8.col-xs-offset-2').length).toBe(1);
        });
        it('for a h2', function() {
            expect(element.find('h2').length).toBe(1);
        });
        it('for a static-iri', function() {
            expect(element.find('static-iri').length).toBe(1);
        });
        it('for a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('for a custom-label', function() {
            expect(element.find('custom-label').length).toBe(2);
        });
        it('for a .boolean-property', function() {
            expect(element.querySelectorAll('.boolean-property').length).toBe(0);
            
            spyOn(controller, 'isBoolean').and.returnValue(true);
            scope.$digest();
            
            expect(element.querySelectorAll('.boolean-property').length).toBe(2);
        });
        it('for a .data-property', function() {
            expect(element.querySelectorAll('.data-property').length).toBe(0);
            
            spyOn(controller, 'isPropertyOfType').and.returnValue(true);
            scope.$digest();
            
            expect(element.querySelectorAll('.data-property').length).toBe(2);
        });
        it('for a .object-property', function() {
            expect(element.querySelectorAll('.object-property').length).toBe(0);
            
            spyOn(controller, 'isPropertyOfType').and.returnValue(true);
            scope.$digest();
            
            expect(element.querySelectorAll('.object-property').length).toBe(2);
        });
        it('for a .btn-container.clearfix', function() {
            expect(element.querySelectorAll('.btn-container.clearfix').length).toBe(1);
        });
        it('for a .btn.btn-link', function() {
            expect(element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
        it('for a new-instance-property-overlay', function() {
            expect(element.find('new-instance-property-overlay').length).toBe(0);
            
            controller.showOverlay = true;
            scope.$digest();
            
            expect(element.find('new-instance-property-overlay').length).toBe(1);
        });
        it('for a confirmation-overlay', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);
            
            controller.showText = true;
            scope.$digest();
            
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('getOptions should result in the correct list when the propertyIRI', function() {
            describe('has a range and getClassInstanceDetails is', function() {
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
        it('isPropertyOfType should return the proper boolean based on the properties list', function() {
            expect(controller.isPropertyOfType('propertyId', 'Data')).toBe(true);
            expect(controller.isPropertyOfType('propertyId', 'Object')).toBe(false);
            expect(controller.isPropertyOfType('missingId', 'Data')).toBe(false);
        });
        it('createIdObj should return an appropriate object', function() {
            expect(controller.createIdObj('id')).toEqual({'@id': 'id'});
        });
        describe('createValueObj should create correct object for the provided string', function() {
            it('with a type', function() {
                expect(controller.createValueObj('value', 'propertyId')).toEqual({'@value': 'value', '@type': 'string'});
            });
            it('without a type', function() {
                expect(controller.createValueObj('value', 'propertyId2')).toEqual({'@value': 'value'});
            });
        });
        it('addToChanged adds the provided iri to the changed array', function() {
            controller.addToChanged('new');
            expect(controller.changed).toEqual(['iri', 'new']);
            controller.addToChanged('iri');
            expect(controller.changed).toEqual(['iri', 'new']);
        });
        it('isChanged should return the proper value', function() {
            expect(controller.isChanged('iri')).toBe(true);
            expect(controller.isChanged('new')).toBe(false);
        });
        describe('save should call the correct functions when updateInstance is', function() {
            describe('resolved and getClassInstanceDetails is', function() {
                var instanceIRI;
                beforeEach(function() {
                    instanceIRI = discoverStateSvc.explore.instance.metadata.instanceIRI;
                    exploreSvc.updateInstance.and.returnValue($q.when());
                });
                it('resolved', function() {
                    var data = [{
                        instanceIRI: 'id'
                    }, {
                        instanceIRI: 'id2'
                    }];
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when({data: data}));
                    controller.save();
                    scope.$apply();
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual(data);
                    expect(discoverStateSvc.explore.instance.metadata).toEqual({instanceIRI: 'id'});
                    expect(discoverStateSvc.explore.editing).toEqual(false);
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    controller.save();
                    scope.$apply();
                    expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, instanceIRI, discoverStateSvc.explore.instance.entity);
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {offset: discoverStateSvc.explore.instanceDetails.currentPage * discoverStateSvc.explore.instanceDetails.limit, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('rejected', function() {
                exploreSvc.updateInstance.and.returnValue($q.reject('error'));
                controller.save();
                scope.$apply();
                expect(exploreSvc.updateInstance).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.instance.metadata.instanceIRI, discoverStateSvc.explore.instance.entity);
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        it('setIRI should set the proper value', function() {
            controller.setIRI('begin', '#', 'end');
            expect(discoverStateSvc.explore.instance.entity['@id']).toBe('begin#end');
        });
        it('isBoolean should return the correct boolean', function() {
            expect(controller.isBoolean('propertyId')).toBe(false);
            expect(controller.isBoolean('propertyId3')).toBe(true);
        });
        it('getInputType should return the correct input type', function() {
            controller.properties = allProperties;
            _.forEach(['id1', 'id2'], function(id) {
                expect(controller.getInputType(id)).toBe('date');
            });
            _.forEach(['id3', 'id4', 'id5', 'id6', 'id7', 'id8', 'id9'], function(id) {
                expect(controller.getInputType(id)).toBe('number');
            });
            expect(controller.getInputType('id10')).toBe('text');
        });
        it('getPattern should return the correct pattern', function() {
            controller.properties = allProperties;
            _.forEach(['id1', 'id2'], function(id) {
                expect(controller.getPattern(id)).toBe(regex.DATETIME);
            });
            _.forEach(['id3', 'id4', 'id5'], function(id) {
                expect(controller.getPattern(id)).toBe(regex.DECIMAL);
            });
            _.forEach(['id6', 'id7', 'id8', 'id9'], function(id) {
                expect(controller.getPattern(id)).toBe(regex.INTEGER);
            });
            expect(controller.getPattern('id10')).toBe(regex.ANYTHING);
        });
        describe('getNewProperties should return a list of properties that are not set on the entity', function() {
            it('without filtering', function() {
                expect(controller.getNewProperties('')).toEqual(['propertyId', 'propertyId2', 'propertyId3']);
            });
            it('with filtering', function() {
                expect(controller.getNewProperties('3')).toEqual(['propertyId3']);
            });
        });
        it('addNewProperty should set variables correctly', function() {
            spyOn(controller, 'addToChanged');
            controller.showOverlay = true;
            controller.addNewProperty('newProperty');
            expect(_.has(discoverStateSvc.explore.instance.entity, 'newProperty')).toBe(true);
            expect(controller.addToChanged).toHaveBeenCalledWith('newProperty');
            expect(controller.showOverlay).toBe(false);
        });
        it('cancel sets the correct variables', function() {
            controller.original = {'@id': 'original'};
            discoverStateSvc.explore.instance.entity = {'@id': 'entity'};
            controller.cancel();
            expect(discoverStateSvc.explore.instance.entity).toEqual(controller.original);
            expect(discoverStateSvc.explore.editing).toBe(false);
        });
        describe('onSelect sets the correct variables when variable has', function() {
            beforeEach(function() {
                controller.showText = false;
            });
            it('@id', function() {
                controller.onSelect({'@id': 'id'});
                controller.fullText = 'id';
                controller.showText = true;
            });
            it('@value', function() {
                controller.onSelect({'@value': 'value'});
                controller.fullText = 'value';
                controller.showText = true;
            });
        });
    });
});