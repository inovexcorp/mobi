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
describe('Custom Label directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.mutedText = '';

            this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
            scope.$digest();
        });
        it('mutedText should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mutedText = 'Muted';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.mutedText = '';

            this.element = $compile(angular.element('<custom-label muted-text="mutedText"></custom-label>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('control-label')).toBe(true);
        });
        it('with small text if there is muted text', function() {
            expect(this.element.find('small').length).toBe(0);
            scope.mutedText = 'Muted';
            scope.$digest();
            expect(this.element.find('small').length).toBe(1);
        });
    });
});