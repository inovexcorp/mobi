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
describe('Confirmation Overlay directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('confirmationOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.cancelText = 'cancel';
        scope.confirmText = 'confirm';
        scope.cancelClick = jasmine.createSpy('cancelClick');
        scope.confirmClick = jasmine.createSpy('confirmClick');
        scope.headerText = 'header';
        scope.size = '';
        this.element = $compile(angular.element('<confirmation-overlay cancel-text="cancelText" confirm-text="confirmText" cancel-click="cancelClick()" confirm-click="confirmClick()" header-text="headerText" size="size"></confirmation-overlay>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('cancelText should be two way bound', function() {
            this.isolatedScope.cancelText = 'Cancel';
            scope.$digest();
            expect(scope.cancelText).toEqual('Cancel');
        });
        it('confirmText should be two way bound', function() {
            this.isolatedScope.confirmText = 'Confirm';
            scope.$digest();
            expect(scope.confirmText).toEqual('Confirm');
        });
        it('cancelClick should be called in parent scope when invoked', function() {
            this.isolatedScope.cancelClick();
            expect(scope.cancelClick).toHaveBeenCalled();
        });
        it('confirmClick should be called in parent scope when invoked', function() {
            this.isolatedScope.confirmClick();
            expect(scope.confirmClick).toHaveBeenCalled();
        });
        it('headerText should be two way bound', function() {
            this.isolatedScope.headerText = 'Header';
            scope.$digest();
            expect(scope.headerText).toEqual('Header');
        });
        it('size should be two way bound', function() {
            this.isolatedScope.size = 'large';
            scope.$digest();
            expect(scope.size).toEqual('large');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
            expect(this.element.querySelectorAll('.main').length).toBe(1);
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with the correct classes based on size', function() {
            expect(this.element.hasClass('lg')).toBe(false);
            expect(this.element.hasClass('sm')).toBe(false);

            scope.size = 'large';
            scope.$digest();
            expect(this.element.hasClass('lg')).toBe(true);
            expect(this.element.hasClass('sm')).toBe(false);

            scope.size = 'small';
            scope.$digest();
            expect(this.element.hasClass('lg')).toBe(false);
            expect(this.element.hasClass('sm')).toBe(true);
        });
        it('with buttons for canceling and confirming', function() {
            var buttons = this.element.find('button');
            expect(buttons.length).toBe(2);
            expect([scope.cancelText, scope.confirmText].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect([scope.cancelText, scope.confirmText].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});