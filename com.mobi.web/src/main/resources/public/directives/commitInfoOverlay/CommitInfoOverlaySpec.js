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
describe('Commit Info Overlay directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('commitInfoOverlay');
        mockUserManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.commit = {};
        scope.additions = [];
        scope.deletions = [];
        scope.overlayFlag = true;
        this.element = $compile(angular.element('<commit-info-overlay commit="commit" additions="additions" deletions="deletions" overlay-flag="overlayFlag"></commit-info-overlay>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('commitInfoOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('commit is one way bound', function() {
            this.isolatedScope.commit = {id: ''};
            scope.$digest();
            expect(scope.commit).toEqual({});
        });
        it('additions is one way bound', function() {
            this.isolatedScope.additions = [{}];
            scope.$digest();
            expect(scope.additions).toEqual([]);
        });
        it('deletions is one way bound', function() {
            this.isolatedScope.deletions = [{}];
            scope.$digest();
            expect(scope.deletions).toEqual([]);
        });
    });
    describe('controller bound variable', function() {
        it('overlayFlag is two way bound', function() {
            this.controller.overlayFlag = false;
            scope.$digest();
            expect(scope.overlayFlag).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commit-info-overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
            expect(this.element.querySelectorAll('.main').length).toBe(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(1);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(0);

            scope.additions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(1);

            scope.additions = [];
            scope.deletions = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.changes-container p').length).toBe(0);
            expect(this.element.querySelectorAll('.changes-container commit-changes-display').length).toBe(1);
        });
        it('with a button to close', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(1);
            expect(angular.element(buttons[0]).text().trim()).toBe('Close');
        });
    });
    describe('controller methods', function() {
        it('should close the overlay', function() {
            this.controller.close();
            scope.$digest();
            expect(scope.overlayFlag).toBe(false);
        });
    });
});