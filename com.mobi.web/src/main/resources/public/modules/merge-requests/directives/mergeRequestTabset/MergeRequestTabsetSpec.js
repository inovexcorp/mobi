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
describe('Merge Request Tabset component', function() {
    var $compile, scope, $q, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestTabset');
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        scope.request = {difference: {additions: [], deletions: []}};
        this.element = $compile(angular.element('<merge-request-tabset request="request" parent-id="parentId"></merge-request-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('request should be two way bound', function() {
            this.controller.request = {};
            scope.$digest();
            expect(scope.request).toEqual({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MERGE-REQUEST-TABSET');
            expect(this.element.querySelectorAll('.merge-request-tabset').length).toEqual(1);
        });
        _.forEach(['material-tabset', 'merge-request-discussion', 'commit-history-table', 'commit-changes-display'], tag => {
            it('with a ' + tag, function() {
                expect(this.element.find(tag).length).toEqual(1);
            });
        });
        it('with material-tabs', function() {
            expect(this.element.find('material-tab').length).toEqual(3);
        });
        it('depending on whether the request has any changes', function() {
            expect(this.element.find('info-message').length).toEqual(1);

            this.controller.request.difference.additions = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
        });
    });
});