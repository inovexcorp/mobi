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
describe('Instance Block directive', function() {
    var $compile, scope, $q, discoverStateSvc, exploreSvc, utilSvc, uuid, splitIRI;

    beforeEach(function() {
        module('templates');
        module('instanceBlock');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        injectSplitIRIFilter();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _exploreService_, _utilService_, _uuid_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            uuid = _uuid_;
            splitIRI = _splitIRIFilter_;
        });

        this.element = $compile(angular.element('<instance-block></instance-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('instanceBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        discoverStateSvc = null;
        exploreSvc = null;
        utilSvc = null;
        uuid = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('instance-block')).toBe(true);
        });
        ['block', 'block-header', 'block-content', 'breadcrumbs', 'button', 'instance-cards', 'block-footer', 'paging'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        describe('setPage should call the correct methods when getClassInstanceDetails', function() {
            beforeEach(function() {
                this.page = 10;
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', currentPage: this.page});
            });
            it('resolves', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.when({}));
                this.controller.setPage(this.page);
                scope.$apply();
                expect(discoverStateSvc.explore.instanceDetails.currentPage).toEqual(10);
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (this.page - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({});
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: this.page}));
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('rejects', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('Error'));
                this.controller.setPage(10);
                scope.$apply();
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({currentPage: this.page}));
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (this.page - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error');
            });
        });
        it('create should set the correct variables', function() {
            discoverStateSvc.explore.creating = false;
            discoverStateSvc.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI'}];
            discoverStateSvc.explore.classId = 'classId';
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            this.controller.create();
            expect(discoverStateSvc.explore.creating).toBe(true);
            expect(splitIRI).toHaveBeenCalledWith('instanceIRI');
            expect(uuid.v4).toHaveBeenCalled();
            expect(discoverStateSvc.explore.instance.entity[0]['@id']).toContain('begin/');
            expect(discoverStateSvc.explore.instance.entity[0]['@type']).toEqual(['classId']);
            expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('New Instance');
            expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/');
        });
        it('getClassName should return the correct value', function() {
            discoverStateSvc.explore.breadcrumbs = ['not-this', 'class'];
            expect(this.controller.getClassName()).toBe('class');
        });
        it('button should say [Deprecated] if the class is deprecated', function() {
            expect(angular.element(this.element.find('button')[0]).text().trim()).not.toContain('[Deprecated]');
            discoverStateSvc.explore.classDeprecated = true;
            scope.$apply();
            expect(angular.element(this.element.find('button')[0]).text().trim()).toContain('[Deprecated]');
        });
    });
});