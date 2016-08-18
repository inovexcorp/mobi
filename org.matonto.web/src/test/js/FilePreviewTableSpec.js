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
describe('File Preview Table directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc,
        mapperStateSvc,
        delimitedManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('filePreviewTable');
        mockDelimitedManager();
        mockOntologyManager();
        mockMappingManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };
            delimitedManagerSvc.filePreview = {
                headers: [''],
                rows: [[''], [''], [''], [''], ['']]
            };
            this.element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
            scope.$digest();
            controller = this.element.controller('filePreviewTable');
        });
        it('should set the correct values for toggling the table', function() {
            expect(controller.big).toBe(false);

            controller.toggleTable();
            scope.$digest();
            expect(controller.big).toBe(true);

            controller.toggleTable();
            scope.$digest();
            expect(controller.big).toBe(false);
            expect(controller.showNum).toBe(5);
        });
        describe('should determine whether the table is clickable', function() {
            it('if no data mapping is selected nor one being created', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(false);
                var result = controller.isClickable();
                expect(result).toBe(false);
            });
            it('if a data mapping is selected', function() {
                var result = controller.isClickable();
                expect(result).toBe(true);
            });
            it('if a data mapping is being created', function() {
                mappingManagerSvc.isDataMapping.and.returnValue(false);
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                mapperStateSvc.selectedProp = {};
                var result = controller.isClickable();
                expect(result).toBe(true);
            });
        });
        it('should get the highlight index for the table', function() {
            spyOn(controller, 'isClickable').and.returnValue(false);
            var result = controller.getHighlightIdx();
            expect(result).toBe(-1);

            controller.isClickable.and.returnValue(true);
            mapperStateSvc.selectedColumn = 'test';
            result = controller.getHighlightIdx();
            expect(result).toBe(-1);

            mapperStateSvc.selectedColumn = '';
            result = controller.getHighlightIdx();
            expect(result).toBe(0);
        });
        it('should set the correct state for clicking a column', function() {
            controller.clickColumn(0);
            expect(mapperStateSvc.selectedColumn).toBe(delimitedManagerSvc.filePreview.headers[0]);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            mappingManagerSvc.mapping = {
                jsonld: [{'@id': ''}]
            };
            delimitedManagerSvc.filePreview = {
                headers: [''],
                rows: [[''], [''], [''], [''], ['']]
            };
            this.element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-preview-table')).toBe(true);
            expect(this.element.querySelectorAll('table.table').length).toBe(1);
        });
        it('with the correct classes depending on table size', function() {
            controller = this.element.controller('filePreviewTable');
            var icon = angular.element(this.element.querySelectorAll('.toggle-table i')[0]);
            expect(icon.hasClass('fa-expand')).toBe(true);
            expect(icon.hasClass('fa-compress')).toBe(false);
            expect(this.element.hasClass('big')).toBe(false);

            controller.big = true;
            scope.$digest();
            expect(icon.hasClass('fa-expand')).toBe(false);
            expect(icon.hasClass('fa-compress')).toBe(true);
            expect(this.element.hasClass('big')).toBe(true);
        });
        it('with the correct number of rows depending on the number to show', function() {
            controller = this.element.controller('filePreviewTable');
            delimitedManagerSvc.filePreview.rows = [[''], [''], [''], [''], [''], ['']];
            expect(this.element.querySelectorAll('tbody tr:not(.hidden)').length).toBe(5);

            controller.showNum = delimitedManagerSvc.filePreview.rows.length;
            scope.$digest();
            expect(this.element.querySelectorAll('tbody tr:not(.hidden)').length).toBe(delimitedManagerSvc.filePreview.rows.length);
        });
        it('depending on whether columns are available', function() {
            controller = this.element.controller('filePreviewTable');
            spyOn(controller, 'isClickable').and.returnValue(true);
            scope.$digest();
            var items = this.element.querySelectorAll('th, td');
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(false);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(true);
            }

            mapperStateSvc.availableColumns = [''];
            scope.$digest();
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(true);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(false);
            }
        });
        it('depending on whether columns are clickable', function() {
            mapperStateSvc.availableColumns = [''];
            controller = this.element.controller('filePreviewTable');
            spyOn(controller, 'isClickable').and.returnValue(false);
            scope.$digest();
            var items = this.element.querySelectorAll('th, td');
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(false);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(false);
            }

            controller.isClickable.and.returnValue(true);
            scope.$digest();
            for (var i = 0; i < items.length; i++) {
                expect(angular.element(items[i]).hasClass('clickable')).toBe(true);
                expect(angular.element(items[i]).hasClass('disabled')).toBe(false);
            }
        });
        it('with the correct table data', function() {
            expect(this.element.find('th').length).toBe(delimitedManagerSvc.filePreview.headers.length);
            var rows = this.element.querySelectorAll('tbody tr');
            expect(rows.length).toBe(delimitedManagerSvc.filePreview.rows.length);
            expect(rows[0].querySelectorAll('td').length).toBe(delimitedManagerSvc.filePreview.rows[0].length);
        });
        it('with the correct column highlighted', function() {
            controller = this.element.controller('filePreviewTable');
            spyOn(controller, 'getHighlightIdx').and.returnValue(0);
            scope.$digest();
            expect(angular.element(this.element.find('th')[0]).hasClass('highlight')).toBe(true);
            var rows = this.element.querySelectorAll('tbody tr');
            for (var i = 0; i <  rows.length; i++) {
                var items = rows[i].querySelectorAll('td');
                expect(angular.element(items[0]).hasClass('highlight')).toBe(true);
            }
        });
        it('with the correct class for the button if last column is highlighted', function() {
            controller = this.element.controller('filePreviewTable');
            var button = angular.element(this.element.querySelectorAll('.toggle-table')[0]);
            expect(button.hasClass('opposite')).toBe(false);

            controller.hoverIdx = 0;
            scope.$digest();
            expect(button.hasClass('opposite')).toBe(true);
        });
    });
    it('should call toggleTable when button is clicked', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };
        delimitedManagerSvc.filePreview = {
            headers: [''],
            rows: [[''], [''], [''], [''], ['']]
        };
        var element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
        scope.$digest();
        controller = element.controller('filePreviewTable');
        spyOn(controller, 'toggleTable').and.callThrough();

        angular.element(element.find('button')).triggerHandler('click');
        scope.$digest();
        expect(controller.toggleTable).toHaveBeenCalled();
    });
    it('should highlight columns on hover of th', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };
        delimitedManagerSvc.filePreview = {
            headers: [''],
            rows: [[''], [''], [''], [''], ['']]
        };
        var element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
        scope.$digest();
        controller = element.controller('filePreviewTable');
        var tableHeader = angular.element(element.find('th')[0]);
        tableHeader.triggerHandler('mouseover');
        scope.$digest();
        expect(controller.hoverIdx).toBe(0);

        tableHeader.triggerHandler('mouseleave');
        scope.$digest();
        expect(controller.hoverIdx).toBe(undefined);
    });
    it('should highlight columns on hover of td', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };
        delimitedManagerSvc.filePreview = {
            headers: [''],
            rows: [[''], [''], [''], [''], ['']]
        };
        var element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
        scope.$digest();
        controller = element.controller('filePreviewTable');
        var dataItem = angular.element(element.querySelectorAll('td')[0]);
        dataItem.triggerHandler('mouseover');
        scope.$digest();
        expect(controller.hoverIdx).toBe(0);

        dataItem.triggerHandler('mouseleave');
        scope.$digest();
        expect(controller.hoverIdx).toBe(undefined);
    });
    it('should call clickColumn when a th or td is clicked', function() {
        mappingManagerSvc.mapping = {
            jsonld: [{'@id': ''}]
        };
        delimitedManagerSvc.filePreview = {
            headers: [''],
            rows: [[''], [''], [''], [''], ['']]
        };
        mapperStateSvc.availableColumns = [''];
        var element = $compile(angular.element('<file-preview-table></file-preview-table>'))(scope);
        scope.$digest();
        controller = element.controller('filePreviewTable');
        spyOn(controller, 'clickColumn');
        spyOn(controller, 'isClickable').and.returnValue(false);
        angular.element(element.find('th')[0]).triggerHandler('click');
        expect(controller.clickColumn).not.toHaveBeenCalled();

        controller.isClickable.and.returnValue(true);
        scope.$digest();
        angular.element(element.find('th')[0]).triggerHandler('click');
        expect(controller.clickColumn).toHaveBeenCalledWith(0);

        controller.clickColumn.calls.reset();
        angular.element(element.find('td')[0]).triggerHandler('click');
        scope.$digest();
        expect(controller.clickColumn).toHaveBeenCalledWith(0);
    });
});