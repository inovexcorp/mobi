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
describe('Class Block Header directive', function() {
    var $compile, scope, exploreSvc, discoverStateSvc, $q, util, exploreUtils, splitIRI;

    beforeEach(function() {
        module('templates');
        module('classBlockHeader');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        mockExploreUtils();
        injectSplitIRIFilter();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _exploreService_, _discoverStateService_, _$q_, _utilService_, _exploreUtilsService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            exploreSvc = _exploreService_;
            discoverStateSvc = _discoverStateService_;
            $q = _$q_;
            util = _utilService_;
            exploreUtils = _exploreUtilsService_;
            splitIRI = _splitIRIFilter_;
        });

        this.element = $compile(angular.element('<class-block-header></class-block-header>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('classBlockHeader');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        exploreSvc = null;
        discoverStateSvc = null;
        $q = null;
        util = null;
        exploreUtils = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('FORM');
            expect(this.element.hasClass('class-block-header')).toBe(true);
        });
        it('with a .form-group', function() {
            expect(this.element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(this.element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn.btn-primary', function() {
            expect(this.element.querySelectorAll('.btn.btn-primary').length).toBe(1);
        });
        it('with a .fa.fa-refresh', function() {
            expect(this.element.querySelectorAll('.fa.fa-refresh').length).toBe(1);
        });
        it('with a .btn.btn-link', function() {
            expect(this.element.querySelectorAll('.btn.btn-link').length).toBe(1);
        });
        it('with a .fa.fa-plus', function() {
            expect(this.element.querySelectorAll('.fa.fa-plus').length).toBe(1);
        });
        it('depending on whether a dataset is selected', function() {
            var refreshButton = angular.element(this.element.querySelectorAll('.btn.btn-primary')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.btn.btn-link')[0]);
            expect(refreshButton.attr('disabled')).toBeTruthy();
            expect(createButton.attr('disabled')).toBeTruthy();

            discoverStateSvc.explore.recordId = 'dataset';
            scope.$digest();
            expect(refreshButton.attr('disabled')).toBeFalsy();
            expect(createButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether an instance is beign created', function() {
            expect(this.element.find('new-instance-class-overlay').length).toEqual(0);

            this.controller.showNewInstanceOverlay = true;
            scope.$digest();
            expect(this.element.find('new-instance-class-overlay').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('showCancel should set the correct variables', function() {
            this.controller.showCancel();
            expect(this.controller.datasetClasses).toEqual([]);
            expect(this.controller.showNewInstanceOverlay).toEqual(false);
        });
        describe('showCreate calls the proper methods when getClasses', function() {
            beforeEach(function() {
                discoverStateSvc.explore.recordId = 'recordId';
            });
            it('resolves', function() {
                exploreUtils.getClasses.and.returnValue($q.when([{}]));
                this.controller.showCreate();
                scope.$apply();
                expect(this.controller.datasetClasses).toEqual([{}]);
                expect(this.controller.showNewInstanceOverlay).toEqual(true);
            });
            it('rejects', function() {
                exploreUtils.getClasses.and.returnValue($q.reject('Error message'));
                this.controller.showCreate();
                scope.$apply();
                expect(util.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(this.controller.datasetClasses).toEqual([]);
            });
        });
        describe('onSelect calls the proper methods when getClassDetails', function() {
            beforeEach(function() {
                discoverStateSvc.explore.recordId = 'recordId';
                discoverStateSvc.explore.classDetails = [{}];
            });
            it('resolves', function() {
                exploreSvc.getClassDetails.and.returnValue($q.when([{prop: 'details'}]));
                this.controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([{prop: 'details'}]);
            });
            it('rejects', function() {
                exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                this.controller.onSelect();
                scope.$apply();
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('recordId');
                expect(discoverStateSvc.explore.classDetails).toEqual([]);
                expect(util.createErrorToast).toHaveBeenCalledWith('error');
            });
        });
        describe('create set the correct state when getClassInstanceDetails', function() {
            beforeEach(function() {
                this.clazz = {
                    id: 'class',
                    title: 'Class',
                    deprecated: true
                };
            });
            it('unless an error occurs', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('Error message'));
                this.controller.create(this.clazz);
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.clazz.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                expect(util.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when([]));
                    splitIRI.and.returnValue({begin: 'begin/', then: 'then/', end: 'end'});
                });
                it('if instances already exist', function() {
                    exploreSvc.createPagedResultsObject.and.returnValue({data: [{instanceIRI: 'instance'}]});
                    this.controller.create(this.clazz);
                    scope.$apply();
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.clazz.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.creating).toEqual(true);
                    expect(discoverStateSvc.explore.classId).toEqual(this.clazz.id);
                    expect(discoverStateSvc.explore.classDeprecated).toEqual(this.clazz.deprecated);
                    expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([{instanceIRI: 'instance'}]);
                    expect(splitIRI).toHaveBeenCalledWith('instance');
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{'@id': 'begin/then/', '@type': [this.clazz.id]}]);
                    expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/then/');
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', this.clazz.title, 'New Instance']);
                });
                it('if there are no instances', function() {
                    exploreSvc.createPagedResultsObject.and.returnValue({data: []});
                    this.controller.create(this.clazz);
                    scope.$apply();
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.clazz.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.creating).toEqual(true);
                    expect(discoverStateSvc.explore.classId).toEqual(this.clazz.id);
                    expect(discoverStateSvc.explore.classDeprecated).toEqual(this.clazz.deprecated);
                    expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([]);
                    expect(splitIRI).toHaveBeenCalledWith(this.clazz.id);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{'@id': 'http://mobi.com/data/end/', '@type': [this.clazz.id]}]);
                    expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('http://mobi.com/data/end/');
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', this.clazz.title, 'New Instance']);
                });
            });
        });
    });
});