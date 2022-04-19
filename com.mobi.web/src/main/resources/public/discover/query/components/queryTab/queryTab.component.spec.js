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
    mockYasguiService,
    mockDiscoverState,
    mockSparqlManager,
    mockUtil,
    mockPrefixes,
    mockPolicyEnforcement
} from '../../../../../../../test/js/Shared';

describe('Query Tab component', function() {
    var $compile, scope,  $q, yasguiSvc, discoverStateService, sparqlManagerService, utilSvc, prefixes, policyEnforcementSvc;

    beforeEach(function() {
        angular.mock.module('query');
        mockComponent('discover', 'datasetFormGroup');
        mockYasguiService();
        mockDiscoverState();
        mockSparqlManager();
        mockUtil();
        mockPrefixes();
        mockPolicyEnforcement();

        inject(function(_$compile_, _$rootScope_, _$q_, _yasguiService_, _discoverStateService_, _sparqlManagerService_, _utilService_, _prefixes_, _policyEnforcementService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            yasguiSvc = _yasguiService_;
            discoverStateService = _discoverStateService_;
            sparqlManagerService = _sparqlManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            policyEnforcementSvc = _policyEnforcementService_;
        });

        this.element = $compile(angular.element('<query-tab></query-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('queryTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        yasguiSvc = null;
        discoverStateService = null;
        sparqlManagerService = null;
        utilSvc = null;
        prefixes = null;
        policyEnforcementSvc = null;
        this.element.remove();
        this.controller = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('QUERY-TAB');
        });
        ['.discover-query', '.bg-white', 'dataset-form-group'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        it('onSelect is called ', function() {
            this.controller.permissionCheck = jasmine.createSpy('permissionCheck');
            discoverStateService.query.submitDisabled = true;
            discoverStateService.query.datasetRecordId = '';
            sparqlManagerService.datasetRecordIRI = '';
            this.controller.onSelect('dataRecordIRI');
            expect(discoverStateService.query.submitDisabled).toEqual(false);
            expect(discoverStateService.query.datasetRecordId).toEqual('dataRecordIRI');
            expect(sparqlManagerService.datasetRecordIRI).toEqual('dataRecordIRI');
            expect(this.controller.permissionCheck).toHaveBeenCalled();
        });
        it('submitQuery is called and evaluateRequest returns permit', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
            discoverStateService.query.datasetRecordId = 'dataRecordIRI';
            this.controller.submitQuery();
            scope.$digest();
            expect(yasguiSvc.submitQuery).toHaveBeenCalled();
        });
        it('submitQuery is called and evaluateRequest returns deny', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
            discoverStateService.query.datasetRecordId = 'dataRecordIRI';
            this.controller.submitQuery();
            scope.$digest();
            expect(yasguiSvc.submitQuery).not.toHaveBeenCalled();
            expect(discoverStateService.query.submitDisabled).toEqual(true);
            expect(this.controller.util.createErrorToast).toHaveBeenCalled();
        });
        it('submitQuery is called without datasetRecordId being set and evaluateRequest', function() {
            discoverStateService.query.datasetRecordId = '';
            this.controller.submitQuery();
            expect(yasguiSvc.submitQuery).toHaveBeenCalled();
        });
        it('permissionCheck is called with datasetRecordIRI and evaluateRequest returns permit', function() {
            discoverStateService.query.submitDisabled = false;
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
            this.controller.permissionCheck('dataRecordIRI');
            scope.$digest();
            expect(discoverStateService.query.submitDisabled).toEqual(false);
        });
        it('permissionCheck is called with datasetRecordIRI and evaluateRequest returns deny', function() {
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
            this.controller.permissionCheck('dataRecordIRI');
            scope.$digest();
            expect(discoverStateService.query.submitDisabled).toEqual(true);
            expect(this.controller.util.createErrorToast).toHaveBeenCalled();
        });
        it('permissionCheck is called without datasetRecordIRI', function() {
            discoverStateService.query.submitDisabled = false;
            this.controller.permissionCheck('dataRecordIRI');
            expect(discoverStateService.query.submitDisabled).toEqual(false);
            expect(this.controller.util.createErrorToast).not.toHaveBeenCalled();
        });
        it('permissionCheck is called with system-repo url false', function() {
            discoverStateService.query.submitDisabled = false;
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
            this.controller.permissionCheck('http://mobi.com/system-repo');
            scope.$digest();
            expect(discoverStateService.query.submitDisabled).toEqual(false);
        });
        it('permissionCheck is called with system-repo url true', function() {
            discoverStateService.query.submitDisabled = false;
            policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
            this.controller.permissionCheck('http://mobi.com/system-repo');
            scope.$digest();
            expect(discoverStateService.query.submitDisabled).toEqual(true);
        });
    });
});
