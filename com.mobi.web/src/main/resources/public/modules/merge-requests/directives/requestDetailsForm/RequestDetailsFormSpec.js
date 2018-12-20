/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Request Details Form directive', function() {
    var $compile, scope, catalogManagerSvc, mergeRequestsStateSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('requestDetailsForm');
        mockMergeRequestsState();
        mockUtil();
        mockPrefixes();
        mockUserManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _mergeRequestsStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            utilSvc = _utilService_;
        });

        utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
        this.element = $compile(angular.element('<request-details-form></request-details-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('requestDetailsForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mergeRequestsStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    it('should initialize with the correct value for title', function() {
        expect(mergeRequestsStateSvc.requestConfig.title).toEqual('title');
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('request-details-form')).toEqual(true);
            expect(this.element.querySelectorAll('.details-form-container').length).toEqual(1);
            expect(this.element.querySelectorAll('.summary-line').length).toEqual(1);
        });
        it('with a commit-difference-tabset', function() {
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);
        });
        it('with a text-input', function() {
            expect(this.element.find('text-input').length).toEqual(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
        it('with a checkbox', function() {
            expect(this.element.find('checkbox').length).toEqual(1);
        });
    });
});
