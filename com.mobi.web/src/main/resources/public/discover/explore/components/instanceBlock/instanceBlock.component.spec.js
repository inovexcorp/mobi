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
import { 
    mockComponent,
    mockDiscoverState,
    mockExplore,
    mockUtil,
    injectSplitIRIFilter,
    mockPrefixes,
    mockPolicyEnforcement
} from '../../../../../../../test/js/Shared';

describe('Instance Block component', function() {
    var $compile, scope, $q, discoverStateSvc, exploreSvc, utilSvc, uuid, splitIRI,  prefixes, policyEnforcementSvc;

    beforeEach(function() {
        angular.mock.module('explore');
        mockComponent('explore', 'instanceCards');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        injectSplitIRIFilter();
        mockPrefixes();
        mockPolicyEnforcement();

        angular.mock.module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _discoverStateService_, _exploreService_, _utilService_, _uuid_, _splitIRIFilter_, _prefixes_, _policyEnforcementService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            utilSvc = _utilService_;
            uuid = _uuid_;
            splitIRI = _splitIRIFilter_;
            prefixes = _prefixes_;
            policyEnforcementSvc = _policyEnforcementService_;
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
        prefixes = null;
        policyEnforcementSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('INSTANCE-BLOCK');
        });
        ['block', 'block-header', 'block-content', 'breadcrumbs', 'button', 'instance-cards', 'block-footer', 'paging'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        describe('setPage should call the correct methods and set variables', function() {
            beforeEach(function() {
                this.page = 10;
                exploreSvc.createPagedResultsObject.and.returnValue({prop: 'paged', currentPage: this.page});
            });
            it('when user has read permission to dataset record', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                exploreSvc.getClassInstanceDetails.and.returnValue($q.when({}));
                this.controller.setPage(this.page);
                scope.$apply();
                expect(discoverStateSvc.explore.instanceDetails.currentPage).toEqual(10);
                expect(discoverStateSvc.explore.hasPermissionError).toEqual(false);
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (this.page - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).toHaveBeenCalledWith({});
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({prop: 'paged', currentPage: this.page}));
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('when user has read permission to dataset record and getClassInstanceDetails has error', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('Error'));
                this.controller.setPage(10);
                scope.$apply();
                expect(discoverStateSvc.explore.instanceDetails).toEqual(jasmine.objectContaining({currentPage: this.page}));
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, discoverStateSvc.explore.classId, {limit: discoverStateSvc.explore.instanceDetails.limit, offset: (this.page - 1) * discoverStateSvc.explore.instanceDetails.limit});
                expect(exploreSvc.createPagedResultsObject).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error');
            });
            it('when user does not have read permission to dataset record', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
                this.controller.setPage(10);
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).not.toHaveBeenCalled();
                expect(exploreSvc.createPagedResultsObject).not.toHaveBeenCalled();
                expect(discoverStateSvc.explore.hasPermissionError).toEqual(true);
                expect(discoverStateSvc.explore.instanceDetails.data).toEqual([]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('You don\'t have permission to read dataset');
            });
        });
        it('create method should set the correct variables when user has have modify permission', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
            discoverStateSvc.explore.creating = false;
            discoverStateSvc.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI'}];
            discoverStateSvc.explore.classId = 'classId';
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            this.controller.create();
            scope.$digest();
            expect(discoverStateSvc.explore.creating).toBe(true);
            expect(splitIRI).toHaveBeenCalledWith('instanceIRI');
            expect(uuid.v4).toHaveBeenCalled();
            expect(discoverStateSvc.explore.instance.entity[0]['@id']).toContain('begin/');
            expect(discoverStateSvc.explore.instance.entity[0]['@type']).toEqual(['classId']);
            expect(_.last(discoverStateSvc.explore.breadcrumbs)).toBe('New Instance');
            expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/');
        });
        it('create method when user does not have modify permission', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
            discoverStateSvc.explore.creating = false;
            discoverStateSvc.explore.instanceDetails.data = [{instanceIRI: 'instanceIRI'}];
            discoverStateSvc.explore.classId = 'classId';
            splitIRI.and.returnValue({begin: 'begin', then: '/', end: 'end'});
            this.controller.create();
            scope.$digest();
            expect(discoverStateSvc.explore.creating).toBe(false);
            expect(splitIRI).not.toHaveBeenCalledWith('instanceIRI');
            expect(uuid.v4).not.toHaveBeenCalled();
            expect(utilSvc.createErrorToast).toHaveBeenCalled();
            expect(discoverStateSvc.explore.instance.metadata.instanceIRI).not.toEqual('begin/');
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
