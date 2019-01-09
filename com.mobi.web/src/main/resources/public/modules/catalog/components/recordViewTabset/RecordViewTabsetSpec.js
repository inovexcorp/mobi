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
describe('Record View Tabset component', function() {
    var $compile, scope, catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockComponent('catalog', 'branchList');
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogManagerSvc.isVersionedRDFRecord.and.returnValue(true);

        scope.record = {};
        this.element = $compile(angular.element('<record-view-tabset record="record"></record-view-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordViewTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        this.element.remove();
    });

    describe('should initialize', function() {
        it('with whether the record is a versioned RDF record', function() {
            expect(catalogManagerSvc.isVersionedRDFRecord).toHaveBeenCalledWith(scope.record);
            expect(this.controller.isVersionedRDFRecord).toEqual(true);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-VIEW-TABSET');
        });
        ['material-tabset', 'material-tab', 'branch-list'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
    });
});