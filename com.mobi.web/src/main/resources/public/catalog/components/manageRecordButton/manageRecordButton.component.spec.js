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
    mockPolicyEnforcement,
    mockPolicyManager,
} from '../../../../../../test/js/Shared';

describe('Manage Record Button component', function() {
    let $compile, $q, scope, policyEnforcementSvc, policyManagerSvc;

    beforeEach(function() {
        angular.mock.module('catalog');
        mockPolicyEnforcement();
        mockPolicyManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _policyEnforcementService_, _policyManagerService_) {
            $compile = _$compile_;
            $q = _$q_;
            scope = _$rootScope_;
            policyEnforcementSvc = _policyEnforcementService_;
            policyManagerSvc = _policyManagerService_;
        });
        scope.record = {
            '@id': 'recordId'
        };
        scope.flat = '';
        scope.stopProp = '';
        this.element = $compile(angular.element('<manage-record-button record="record" flat="flat" stop-prop="stopProp"></manage-record-button>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('manageRecordButton');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        policyEnforcementSvc = null;
        policyManagerSvc = null;
        this.element.remove();
    });
    describe('should initialize', function() {
        describe('showButton', function() {
            describe('to true', function() {
                it('when it is an ontology record and the user can view', function() {
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                    this.controller.$onInit();
                    scope.$apply();
                    expect(this.controller.showButton).toEqual(true);
                });
            });
            describe('to false', function() {
                it('when record is undefined', function() {
                    scope.record = undefined;
                    expect(this.controller.showButton).toEqual(false);
                });
                it('when it is an ontology record and the user cannot view', function() {
                    policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
                    this.controller.$onInit();
                    scope.$apply();
                    expect(this.controller.showButton).toEqual(false);
                });
            });
        });
    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            var copy = angular.copy(scope.record);
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).toEqual(copy);
        });
        it('flat is one way bound', function() {
            this.controller.flat = undefined;
            scope.$digest();
            expect(scope.flat).toEqual('');
        });
        it('stopProp is one way bound', function() {
            this.controller.stopProp = undefined;
            scope.$digest();
            expect(scope.stopProp).toEqual('');
        });
    });
    describe('controller methods', function() {
        describe('update set showButton variable', function() {
            it('to true when policyEnforcementService is permit', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.permit));
                this.controller.$onInit();
                scope.$apply();
                expect(this.controller.showButton).toEqual(true);
            });
            it('to false when policyEnforcementService is deny', function() {
                policyEnforcementSvc.evaluateRequest.and.returnValue($q.when(policyEnforcementSvc.deny));
                this.controller.$onInit();
                scope.$apply();
                expect(this.controller.showButton).toEqual(false);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('MANAGE-RECORD-BUTTON');
        });
        it('button type depending on whether isFlat(false) is set', function() {
            this.controller.showButton = true;
            this.controller.isFlat = false;
            scope.$digest();
            const raisedButton = angular.element(this.element.querySelectorAll('.btn-primary'));
            const flatButton = angular.element(this.element.querySelectorAll('.btn-flat-primary'));
            expect(raisedButton.length).toEqual(1);
            expect(flatButton.length).toEqual(0);
        });
        it('button type depending on whether isFlat(true) is set', function() {
            this.controller.showButton = true;
            this.controller.isFlat = true;
            scope.$digest();
            const raisedButton = angular.element(this.element.querySelectorAll('.btn-primary'));
            const flatButton = angular.element(this.element.querySelectorAll('.btn-flat-primary'));
            expect(raisedButton.length).toEqual(0);
            expect(flatButton.length).toEqual(1);
        });
        it('depending on showButton being true or false', function() {
            this.controller.showButton = true;
            scope.$digest();
            let button = angular.element(this.element.querySelectorAll('.manage-record-button .btn'));
            expect(button.length).toEqual(1);

            this.controller.showButton = false;
            scope.$digest();
            button = angular.element(this.element.querySelectorAll('.manage-record-button .btn'));
            expect(button.length).toEqual(0);
        });
        it('should call manageRecord when clicked', function() {
            spyOn(this.controller, 'manageRecord');
            this.controller.showButton = true;
            scope.$digest();

            const button = angular.element(this.element.querySelectorAll('.manage-record-button .btn'));
            button.triggerHandler('click');
            expect(this.controller.manageRecord).toHaveBeenCalled();
        });
    });
});
