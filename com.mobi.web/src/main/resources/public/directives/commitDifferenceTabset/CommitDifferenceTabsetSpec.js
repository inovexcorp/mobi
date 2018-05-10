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
describe('Commit Difference Tabset directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('commitDifferenceTabset');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.recordId = '';
        scope.sourceBranch = {};
        scope.targetBranchId = '';
        scope.difference = {};
        this.element = $compile(angular.element('<commit-difference-tabset record-id="recordId" source-branch="sourceBranch" target-branch-id="targetBranchId" difference="difference"></commit-difference-tabset>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('recordId should be one way bound', function() {
            this.isolatedScope.recordId = 'record';
            scope.$digest();
            expect(scope.recordId).toEqual('');
        });
        it('sourceBranch should be one way bound', function() {
            this.isolatedScope.sourceBranch = {test: true};
            scope.$digest();
            expect(scope.sourceBranch).toEqual({});
        });
        it('targetBranchId should be one way bound', function() {
            this.isolatedScope.targetBranchId = 'branch';
            scope.$digest();
            expect(scope.targetBranchId).toEqual('');
        });
        it('difference should be one way bound', function() {
            this.isolatedScope.difference = {test: true};
            scope.$digest();
            expect(scope.difference).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commit-difference-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toEqual(1);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toEqual(2);
        });
        it('with a commit-changes-display', function() {
            expect(this.element.find('commit-changes-display').length).toEqual(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toEqual(1);
        });
        it('depending on whether there are differences', function() {
            expect(this.element.find('info-message').length).toEqual(1);

            scope.difference = {additions: [{}], deletions: []};
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);

            scope.difference = {additions: [], deletions: [{}]};
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
        });
    });
});
