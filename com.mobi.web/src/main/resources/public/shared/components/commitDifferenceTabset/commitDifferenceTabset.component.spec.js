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
describe('Commit Difference Tabset component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'commitChangesDisplay');
        mockComponent('shared', 'commitHistoryTable');
        mockComponent('shared', 'infoMessage');
        mockComponent('shared', 'tab');
        mockComponent('shared', 'tabset');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.branchTitle = '';
        scope.commitId = '';
        scope.targetId = '';
        scope.difference = {};
        scope.entityNameFunc = jasmine.createSpy('entityNameFunc');
        this.element = $compile(angular.element('<commit-difference-tabset commit-id="commitId" branch-title="branchTitle" target-id="targetId" difference="difference" entity-name-func="entityNameFunc"></commit-difference-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitDifferenceTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('commitId should be one way bound', function() {
            this.controller.commitId = 'commit';
            scope.$digest();
            expect(scope.commitId).toEqual('');
        });
        it('branchTitle should be one way bound', function() {
            this.controller.branchTitle = 'branch';
            scope.$digest();
            expect(scope.branchTitle).toEqual('');
        });
        it('targetId should be one way bound', function() {
            this.controller.targetId = 'target';
            scope.$digest();
            expect(scope.targetId).toEqual('');
        });
        it('difference should be one way bound', function() {
            this.controller.difference = {test: true};
            scope.$digest();
            expect(scope.difference).toEqual({});
        });
        it('entityNameFunc should be one way bound', function() {
            this.controller.entityNameFunc = undefined;
            scope.$digest();
            expect(scope.entityNameFunc).toBeDefined();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMIT-DIFFERENCE-TABSET');
            expect(this.element.querySelectorAll('.commit-difference-tabset').length).toEqual(1);
        });
        ['tabset', 'commit-changes-display', 'commit-history-table'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toEqual(2);
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
