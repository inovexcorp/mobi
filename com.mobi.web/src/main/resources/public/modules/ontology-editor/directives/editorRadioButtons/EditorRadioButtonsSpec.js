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
describe('Editor Radio Buttons directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('editorRadioButtons');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        this.element = $compile(angular.element('<editor-radio-buttons ng-model="bindModel"></editor-radio-buttons>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('bindModel should be two way bound', function() {
            this.isolatedScope.bindModel = 'ontology';
            scope.$digest();
            expect(scope.bindModel).toBe('ontology');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('editor-radio-buttons')).toBe(true);
        })
        it('with a radio-buttons', function() {
            expect(this.element.find('radio-button').length).toBe(2);
        });
    });
});