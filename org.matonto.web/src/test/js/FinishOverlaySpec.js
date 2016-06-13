/*-
 * #%L
 * org.matonto.web
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
describe('Finish Overlay directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('finishOverlay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/finishOverlay/finishOverlay.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.save = jasmine.createSpy('save');
            scope.finish = jasmine.createSpy('finish');

            this.element = $compile(angular.element('<finish-overlay save="save()" finish="finish()"></finish-overlay>'))(scope);
            scope.$digest();
        });

        it('save should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.save();

            expect(scope.save).toHaveBeenCalled();
        });
        it('finish should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.finish();

            expect(scope.finish).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<finish-overlay save="save()" finish="finish()"></finish-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('finish-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with custom buttons for saving and finishing', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Save & finish', 'Finish'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});