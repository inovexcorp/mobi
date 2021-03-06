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

import {
    injectBranchesToDisplayFilter,
    injectTrustedFilter,
    injectHighlightFilter,
    mockUtil
} from '../../../../../../test/js/Shared';

describe('Branch Select component', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        angular.mock.module('shared');
        injectBranchesToDisplayFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.bindModel = undefined;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.branches = [];
        scope.required = true;
        scope.isDisabledWhen = false;
        this.element = $compile(angular.element('<branch-select bind-model="ngModel" change-event="changeEvent(value)" branches="branches" is-disabled-when="isDisabledWhen" required="required"></branch-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('branchSelect');
    });

    afterEach(function() {
        $compile = null;
        $timeout = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = {};
            scope.$digest();
            expect(scope.bindModel).toEqual(undefined);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
        it('branches should be one way bound', function() {
            this.controller.branches = [{}];
            scope.$digest();
            expect(scope.branches).toEqual([]);
        });
        it('required should be one way bound', function() {
            this.controller.required = false;
            scope.$digest();
            expect(scope.required).toEqual(true);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should call changeEvent', function() {
            this.controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalledWith(undefined);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('BRANCH-SELECT');
            expect(this.element.querySelectorAll('.branch-select').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        })
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
    });
});