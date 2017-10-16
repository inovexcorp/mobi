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
describe('Custom Preference directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('customPreference');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.header = '';
            scope.question = '';
            this.element = $compile(angular.element('<custom-preference header="header" question="question"></custom-preference>'))(scope);
            scope.$digest();
        });
        it('header should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.header = 'test';
            scope.$digest();
            expect(scope.header).toBe('test');
        });
        it('question should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.question = 'test';
            scope.$digest();
            expect(scope.question).toBe('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.header = '';
            scope.question = '';
            this.element = $compile(angular.element('<custom-preference header="header" question="question"></custom-preference>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ARTICLE');
        });
        it('with the correct classes', function() {
            expect(this.element.querySelectorAll('.question').length).toBe(1);
            expect(this.element.querySelectorAll('.answer').length).toBe(1);
        });
    });
});