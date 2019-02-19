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
describe('Circle Button directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.btnIcon = 'fa-square';
        scope.btnSmall = false;
        scope.displayText = 'text';
        this.element = $compile(angular.element('<circle-button btn-icon="btnIcon" btn-small="btnSmall" display-text="displayText"></circle-button>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('btnIcon should be one way bound', function() {
            this.isolatedScope.btnIcon = 'fa-square-o';
            scope.$digest();
            expect(scope.btnIcon).toEqual('fa-square');
        });
        it('btnSmall should be one way bound', function() {
            this.isolatedScope.btnSmall = true;
            scope.$digest();
            expect(scope.btnSmall).toEqual(false);
        });
        it('displayText should be one way bound', function() {
            this.isolatedScope.displayText = 'new';
            scope.$digest();
            expect(scope.displayText).toEqual('text');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('BUTTON');
        });
        it('with a btnIcon', function() {
            expect(this.element.querySelectorAll('.' + scope.btnIcon).length).toBe(1);
        });
        it('depending on btnSmall', function() {
            expect(this.element.hasClass('small')).toBe(false);
            scope.btnSmall = true;
            scope.$digest();
            expect(this.element.hasClass('small')).toBe(true);
        });
    });
});