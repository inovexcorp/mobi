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
describe('Record Types component', function() {
    var $compile, scope, catalogManagerSvc, inArray;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'recordType');
        mockCatalogManager();
        injectInArrayFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _inArrayFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            inArray = _inArrayFilter_;
        });

        scope.record = {};
        this.element = $compile(angular.element('<record-types record="record"></record-types>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordTypes');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        inArray = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            this.controller.record = {'@type': []};
            scope.$digest();
            expect(scope.record).toEqual({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-TYPES');
        });
        it('depending on how many types the record has', function() {
            scope.record['@type'] = ['type0'];
            scope.$digest();
            expect(inArray).toHaveBeenCalledWith(scope.record['@type'], catalogManagerSvc.recordTypes);
            expect(this.element.find('record-type').length).toBe(scope.record['@type'].length);
        });
    });
});