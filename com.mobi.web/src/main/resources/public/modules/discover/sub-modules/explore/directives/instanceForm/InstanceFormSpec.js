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
    var $compile, scope, $q, discoverStateSvc, prefixes, exploreSvc, util, allProperties, regex, exploreUtilsSvc, modalSvc, splitIri;

    beforeEach(function() {
        module('templates');
        module('instanceForm');
        mockDiscoverState();
        mockUtil();
        mockExplore();
        mockPrefixes();
        mockExploreUtils();
        mockModal();
        injectRegexConstant();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _prefixes_, _exploreService_, _utilService_, _REGEX_, _exploreUtilsService_, _modalService_, _splitIRIFilter_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            prefixes = _prefixes_;
            util = _utilService_;
            regex = _REGEX_;
            exploreUtilsSvc = _exploreUtilsService_;
            modalSvc = _modalService_;
            splitIri = _splitIRIFilter_;
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
        this.element = $compile(angular.element('<instance-form header="header" is-valid="isValid"></instance-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceForm');
        this.controller.properties = [{
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
        this.controller.changed = ['iri'];
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

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        discoverStateSvc = null;
        prefixes = null;
        exploreSvc = null;
        util = null;
        allProperties = null;
        regex = null;
        exploreUtilsSvc = null;
        modalSvc = null;
        splitIri = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('header should be one way bound', function() {
            this.element.isolateScope().header = 'new';
            scope.$digest();
            expect(scope.header).toBe('header');
        });
    });
    describe('controller bound variables', function() {
        it('isValid should be two way bound', function() {
            this.controller.isValid = true;
            scope.$digest();
            expect(scope.isValid).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-form')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a .col-8.offset-2', function() {
            expect(this.element.querySelectorAll('.col-8.offset-2').length).toBe(1);
        });
        it('with a h2', function() {
            expect(this.element.find('h2').length).toBe(1);
        });
        it('with a .instance-iri', function() {
            expect(this.element.querySelectorAll('.instance-iri').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(2);
        });
        it('with a .boolean-property', function() {
            expect(this.element.querySelectorAll('.boolean-property').length).toBe(2);

            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.boolean-property').length).toBe(0);
        });
        it('with a .data-property', function() {
            exploreUtilsSvc.isBoolean.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.data-property').length).toBe(2);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.data-property').length).toBe(0);
        });
        it('with a .object-property', function() {
            expect(this.element.querySelectorAll('.object-property').length).toBe(2);

            exploreUtilsSvc.isPropertyOfType.and.returnValue(false);
            scope.$digest();

            expect(this.element.querySelectorAll('.object-property').length).toBe(0);
        });
        it('with a .btn-container.clearfix', function() {
            expect(this.element.querySelectorAll('.btn-container.clearfix').length).toBe(1);
        });
        it('with a .btn.btn-link', function() {
            expect(this.element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('newInstanceProperty should show the newInstancePropertyOverlay', function() {
            this.controller.newInstanceProperty();
            expect(modalSvc.openModal).toHaveBeenCalledWith('newInstancePropertyOverlay', {properties: this.controller.properties, instance: this.controller.instance}, this.controller.addToChanged);
        });
        it('showIriConfirm should open a confirm modal for editing the IRI', function() {
            this.controller.showIriConfirm();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.showIriOverlay);
        });
        it('showIriOverlay should open the editIriOverlay', function() {
            this.controller.showIriOverlay();
            expect(splitIri).toHaveBeenCalledWith(this.controller.instance['@id']);
            expect(modalSvc.openModal).toHaveBeenCalledWith('editIriOverlay', {iriBegin: '', iriThen: '', iriEnd: ''}, this.controller.setIRI);
        });
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
                        this.controller.getOptions('propertyId')
                            .then(function(response) {
                                expect(response).toEqual([{
                                    instanceIRI: 'propertyId'
                                }, {
                                    instanceIRI: 'propertyId2'
                                }, {
                                    instanceIRI: 'propertyId3'
                                }]);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0, infer: true}, true);
                    });
                    it('with filtering', function() {
                        exploreUtilsSvc.contains.and.callFake(function(string, part) {
                            return _.includes(_.toLower(string), _.toLower(part));
                        });
                        this.controller.searchText.propertyId = '3';
                        this.controller.getOptions('propertyId')
                            .then(function(response) {
                                expect(response).toEqual([{instanceIRI: 'propertyId3'}]);
                            }, function() {
                                fail('Promise should have resolved');
                            });
                        scope.$apply();
                        expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0, infer: true}, true);
                    });
                });
                it('rejected', function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('error'));
                    this.controller.getOptions('propertyId')
                        .then(function(response) {
                            expect(response).toEqual([]);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, 'string', {offset: 0, infer: true}, true);
                    expect(util.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('does not have a range', function() {
                this.controller.getOptions('propertyId2')
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
                spyOn(this.controller, 'getMissingProperties').and.returnValue(['missing property']);
            });
            it('when it is new', function() {
                this.controller.addToChanged('new');
                expect(this.controller.changed).toEqual(['iri', 'new']);
                expect(this.controller.getMissingProperties).toHaveBeenCalled();
                expect(this.controller.missingProperties).toEqual(['missing property']);
            });
            it('when it is not new', function() {
                this.controller.addToChanged('iri');
                expect(this.controller.changed).toEqual(['iri']);
                expect(this.controller.getMissingProperties).toHaveBeenCalled();
                expect(this.controller.missingProperties).toEqual(['missing property']);
            });
        });
        it('isChanged should return the proper value', function() {
            expect(this.controller.isChanged('iri')).toBe(true);
            expect(this.controller.isChanged('new')).toBe(false);
        });
        it('setIRI should set the proper value', function() {
            this.controller.setIRI({iriBegin: 'begin', iriThen: '#', iriEnd: 'end'});
            expect(this.controller.instance['@id']).toBe('begin#end');
        });
        it('onSelect sets the correct variables', function() {
            this.controller.onSelect('text', 'iri', 0);
            expect(modalSvc.openModal).toHaveBeenCalledWith('propertyValueOverlay', {text: 'text', iri: 'iri', index: 0, properties: this.controller.reificationProperties}, this.controller.addToChanged, 'lg');
        });
        it('getMissingProperties retrieves the proper list of messages', function() {
            util.getBeautifulIRI.and.callFake(_.identity);
            this.controller.properties = [{
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
            this.controller.instance = {
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
            expect(this.controller.getMissingProperties()).toEqual(expected);
            _.forEach(['propertyId', 'propertyId2', 'propertyId3', 'propertyId4', 'propertyId5', 'propertyId6'], function(item) {
                expect(util.getBeautifulIRI).toHaveBeenCalledWith(item);
            });
            expect(this.controller.isValid).toBe(false);
        });
        describe('getRestrictionText should return the correct value for', function() {
            beforeEach(function() {
                this.controller.properties = [{
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
                expect(this.controller.getRestrictionText('propertyId')).toBe('[exactly 1]');
            });
            it('min restriction', function() {
                expect(this.controller.getRestrictionText('propertyId2')).toBe('[at least 1]');
            });
            it('max restriction', function() {
                expect(this.controller.getRestrictionText('propertyId3')).toBe('[at most 1]');
            });
            it('no restriction', function() {
                expect(this.controller.getRestrictionText('propertyId4')).toBe('');
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
            this.controller.cleanUpReification({'@value': 'value'}, 'predicate');
            expect(discoverStateSvc.explore.instance.entity).toEqual([{}]);
        });
        it('transformChip should add the chip iri and title to the objectMap and then transform the chip', function() {
            discoverStateSvc.explore.instance.objectMap = {};
            exploreUtilsSvc.createIdObj.and.returnValue({id: 'id'});
            expect(this.controller.transformChip({instanceIRI: 'iri', title: 'title'})).toEqual({id: 'id'});
            expect(discoverStateSvc.explore.instance.objectMap).toEqual({iri: 'title'});
            expect(exploreUtilsSvc.createIdObj).toHaveBeenCalledWith('iri');
        });
    });
    it('should call showIriConfirm when the IRI edit link is clicked', function() {
        spyOn(this.controller, 'showIriConfirm');
        var link = angular.element(this.element.querySelectorAll('.instance-iri a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showIriConfirm).toHaveBeenCalled();
    });
});