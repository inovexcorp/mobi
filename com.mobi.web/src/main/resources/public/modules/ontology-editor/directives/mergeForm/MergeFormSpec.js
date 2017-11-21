/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Merge Form directive', function() {
    var $compile, scope, $q, ontologyStateSvc, util;

    beforeEach(function() {
        module('templates');
        module('mergeForm');
        mockUtil();
        mockOntologyState();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            util = _utilService_;
        });

        scope.branchTitle = '';
        scope.isUserBranch = false;
        scope.removeBranch = false;
        scope.targetId = '';
        ontologyStateSvc.listItem.ontologyRecord.branchId = 'branchId';
        this.element = $compile(angular.element('<merge-form branch-title="branchTitle" is-user-branch="isUserBranch" target-id="targetId" remove-branch="removeBranch"></merge-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        util = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('branchTitle is one way bound', function() {
            this.controller.branchTitle = 'test';
            scope.$digest();
            expect(scope.branchTitle).toEqual('');
        });
        it('isUserBranch is one way bound', function() {
            this.controller.isUserBranch = true;
            scope.$digest();
            expect(scope.isUserBranch).toEqual(false);
        });
        it('targetId is two way bound', function() {
            this.controller.targetId = 'test';
            scope.$digest();
            expect(scope.targetId).toEqual('test');
        });
        it('removeBranch is two way bound', function() {
            this.controller.removeBranch = true;
            scope.$digest();
            expect(scope.removeBranch).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('merge-form')).toBe(true);
        });
        _.forEach(['ui-select', 'checkbox'], function(item) {
            it('for ' + item, function() {
                expect(this.element.find(item).length).toBe(1);
            });
        });
        it('with a .merge-message', function() {
            expect(this.element.querySelectorAll('.merge-message').length).toBe(1);
        });
        it('depending on whether the branch is a UserBranch', function() {
            var select = angular.element(this.element.find('ui-select')[0]);
            expect(select.attr('disabled')).toBeFalsy();
            expect(this.element.find('checkbox').length).toEqual(1);

            scope.isUserBranch = true;
            scope.$digest();
            expect(select.attr('disabled')).toBeTruthy();
            expect(this.element.find('checkbox').length).toEqual(0);
        });
        it('depending on whether the branch is the master branch', function() {
            expect(this.element.find('checkbox').length).toEqual(1);

            scope.branchTitle = 'MASTER';
            scope.$digest();
            expect(this.element.find('checkbox').length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        describe('matchesCurrent returns', function() {
            it('true if it does not match ontologyStateService.listItem.ontologyRecord.branchId', function() {
                expect(this.controller.matchesCurrent({'@id': 'differentId'})).toBe(true);
            });
            it('false if it does match ontologyStateService.listItem.ontologyRecord.branchId', function() {
                expect(this.controller.matchesCurrent({'@id': 'branchId'})).toBe(false);
            });
        });
    });
});