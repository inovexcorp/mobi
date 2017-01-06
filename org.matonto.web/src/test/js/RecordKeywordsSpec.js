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
describe('Record Keywords directive', function() {
    var $compile,
        scope,
        prefixes,
        controller;

    beforeEach(function() {
        module('templates');
        module('recordKeywords');
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        scope.record = {};
        this.element = $compile(angular.element('<record-keywords record="record"></record-keywords>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('record should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.record = {'@id': ''};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.record[prefixes.catalog + 'keyword'] = [{'@value': '0'}, {'@value': '1'}];
            scope.$digest();
            controller = this.element.controller('recordKeywords');
        });
        it('should collect the keywords in a single string', function() {
            expect(controller.getKeywords(scope.record)).toBe('0, 1');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.record[prefixes.catalog + 'keyword'] = [{'@value': '0'}, {'@value': '1'}];
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-keywords')).toBe(true);
        });
        it('with a field-name span', function() {
            expect(this.element.querySelectorAll('span.field-name').length).toBe(1);
        });
    });
});