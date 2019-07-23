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
describe('Merge Requests Page component', function() {
    var $compile, scope, $q, mergeRequestsStateSvc;

    beforeEach(function() {
        module('templates');
        module('merge-requests');
        mockComponent('merge-requests', 'mergeRequestList');
        mockComponent('merge-requests', 'mergeRequestView');
        mockComponent('merge-requests', 'createRequest');
        mockMergeRequestsState();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
        });

        this.element = $compile(angular.element('<merge-requests-page></merge-requests-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-REQUESTS-PAGE');
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('if no request is selected and one is not being created', function() {
            expect(this.element.find('merge-request-list').length).toBe(1);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is selected', function() {
            mergeRequestsStateSvc.selected = {};
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(1);
            expect(this.element.find('create-request').length).toBe(0);
        });
        it('if a request is being created', function() {
            mergeRequestsStateSvc.createRequest = true;
            scope.$digest();
            expect(this.element.find('merge-request-list').length).toBe(0);
            expect(this.element.find('merge-request-view').length).toBe(0);
            expect(this.element.find('create-request').length).toBe(1);
        });
    });
});