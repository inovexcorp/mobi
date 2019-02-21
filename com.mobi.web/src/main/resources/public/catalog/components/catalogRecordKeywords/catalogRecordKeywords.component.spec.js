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
describe('Catalog Record Keywords component', function() {
    var $compile, scope, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        this.keywords = [{'@value': 'B'}, {'@value': 'A'}];
        scope.record = {
            [prefixes.catalog + 'keyword']: this.keywords
        };
        this.element = $compile(angular.element('<catalog-record-keywords record="record"></catalog-record-keywords>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('catalogRecordKeywords');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            this.controller.record = {a: 'b'};
            scope.$digest();
            expect(scope.record).not.toEqual({a: 'b'});
        });
    });
    describe('initializes correctly', function() {
        it('with keywords', function() {
            expect(this.controller.keywords).toEqual(['A', 'B']);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CATALOG-RECORD-KEYWORDS');
            expect(this.element.querySelectorAll('.catalog-record-keywords').length).toBe(1);
        });
        it('depending on the number of keywords', function() {
            expect(this.element.querySelectorAll('.keyword').length).toEqual(this.keywords.length);

            this.controller.keywords = [];
            scope.$digest();
            expect(this.element.querySelectorAll('.keyword').length).toEqual(0);
        });
    });
});