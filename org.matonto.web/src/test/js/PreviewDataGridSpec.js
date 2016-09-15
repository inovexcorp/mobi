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
describe('Create Mapping Overlay directive', function() {
    var $compile,
        scope,
        delimitedManagerSvc,
        mapperStateSvc,
        controller,
        hotTable;

    beforeEach(function() {
        module('templates');
        module('previewDataGrid');
        mockDelimitedManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _delimitedManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });
        hotTable = {
            selectCell: jasmine.createSpy('selectCell'),
            countRows: jasmine.createSpy('countRows').and.returnValue(0),
            render: jasmine.createSpy('render'),
            deselectCell: jasmine.createSpy('deselectCell')
        };
    });

    describe('should update when', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<preview-data-grid></preview-data-grid>'))(scope);
            scope.$digest();
            controller = this.element.controller('previewDataGrid');
            controller.hotTable = hotTable;
        });
        describe('the highlight index changes', function() {
            beforeEach(function() {
                this.index = 0;
            })
            it('if it has a value', function() {
                controller.hotTable.deselectCell.calls.reset();
                mapperStateSvc.highlightIndex = `${this.index}`;
                scope.$digest();
                expect(controller.hotTable.countRows).toHaveBeenCalled();
                expect(controller.hotTable.selectCell).toHaveBeenCalledWith(0, this.index, controller.hotTable.countRows() - 1, this.index, false);
                expect(controller.hotTable.deselectCell).toHaveBeenCalled();
            });
            it('if it does not have a value', function() {
                mapperStateSvc.highlightIndex = `${this.index}`;
                scope.$digest();
                controller.hotTable.selectCell.calls.reset();
                mapperStateSvc.highlightIndex = '';
                scope.$digest();
                expect(controller.hotTable.deselectCell).toHaveBeenCalled();
                expect(controller.hotTable.selectCell).not.toHaveBeenCalled();
            });
        });
        it('whether the data has headers or not changes', function() {
            delimitedManagerSvc.containsHeaders = false;
            scope.$digest();
            expect(controller.hotTable.render).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<preview-data-grid></preview-data-grid>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('preview-data-grid')).toBe(true);
        });
        it('with a hot table', function() {
            expect(this.element.find('hot-table').length).toBe(1);
        });
    });
});