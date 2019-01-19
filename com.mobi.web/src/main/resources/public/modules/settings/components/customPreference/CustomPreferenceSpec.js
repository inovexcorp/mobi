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
describe('Custom Preference component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('settings');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.header = '';
        scope.question = '';
        this.element = $compile(angular.element('<custom-preference header="header" question="question"></custom-preference>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('customPreference');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variables', function() {
        it('header should be one way bound', function() {
            this.controller.header = 'test';
            scope.$digest();
            expect(scope.header).toBe('');
        });
        it('question should be one way bound', function() {
            this.controller.question = 'test';
            scope.$digest();
            expect(scope.question).toBe('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CUSTOM-PREFERENCE');
        });
        ['.question', '.answer'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toBe(1);
            });
        });
    });
});