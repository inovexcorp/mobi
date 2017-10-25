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
describe('Record Types directive', function() {
    var $compile,
        scope,
        catalogManagerSvc,
        inArrayFilter,
        controller;

    beforeEach(function() {
        module('templates');
        module('recordTypes');
        mockCatalogManager();
        injectInArrayFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _inArrayFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            inArrayFilter = _inArrayFilter_;
        });

        scope.record = {};
        this.element = $compile(angular.element('<record-types record="record"></record-types>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('record should be one way bound', function() {
            this.isolatedScope.record = {'@type': []};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('record-types')).toBe(true);
        });
        it('depending on how many types the record has', function() {
            scope.record['@type'] = ['type0'];
            scope.$digest();
            expect(inArrayFilter).toHaveBeenCalledWith(scope.record['@type'], catalogManagerSvc.recordTypes);
            expect(this.element.find('record-type').length).toBe(scope.record['@type'].length);
        });
    });
});