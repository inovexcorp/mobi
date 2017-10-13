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
describe('Record Keywords directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        controller,
        prefixes;

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
        scope.record[prefixes.catalog + 'keyword'] = [{'@value': 'b'}, {'@value': 'a'}];
        element = $compile(angular.element('<record-keywords record="record"></record-keywords>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        })
        it('record should be one way bound', function() {
            var previousRecord = angular.copy(scope.record);
            isolatedScope.record = {'@id': ''};
            scope.$digest();
            expect(scope.record).toEqual(previousRecord);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('recordKeywords');
        });
        it('should return all the record keywords sorting alphabetically', function() {
            expect(controller.getKeywords(scope.record)).toEqual(['a', 'b']);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            controller = element.controller('recordKeywords');
            spyOn(controller, 'getKeywords').and.returnValue(['a', 'b']);
        });
        it('for wrapping containers', function() {
            expect(element.hasClass('record-keywords')).toBe(true);
        });
        it('with a field-name span', function() {
            expect(element.querySelectorAll('span.field-name').length).toBe(1);
        });
        it('depending on how many keywords there are', function() {
            expect(element.querySelectorAll('.keywords li').length).toBe(2);

            controller.getKeywords.and.returnValue([]);
            scope.$digest();
            expect(element.querySelectorAll('.keywords li').length).toBe(1);
        });
        it('depending on whether a list item is last', function() {
            var listItems = element.querySelectorAll('.keywords li');
            expect(angular.element(listItems[0]).hasClass('last')).toBe(false);
            expect(angular.element(listItems[1]).hasClass('last')).toBe(true);
        });
    });
});