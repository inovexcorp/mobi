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
describe('File Upload Form directive', function() {
    var $compile,
        scope,
        mapperStateSvc,
        delimitedManagerSvc,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('fileUploadForm');
        mockMapperState();
        mockDelimitedManager();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_, _delimitedManagerService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
            delimitedManagerSvc = _delimitedManagerService_;
            $q = _$q_;
        });

        this.element = $compile(angular.element('<file-upload-form></file-upload-form>'))(scope);
        scope.$digest();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            controller = this.element.controller('fileUploadForm');
        });
        it('should correctly test whether the file is an Excel file', function() {
            var result = controller.isExcel();
            expect(result).toBe(false);

            controller.fileObj = {name: 'test.xls'};
            scope.$digest();
            result = controller.isExcel();
            expect(result).toBe(true);

            controller.fileObj = {name: 'test.xlsx'};
            scope.$digest();
            result = controller.isExcel();
            expect(result).toBe(true);
        });
        describe('should upload a file', function() {
            it('unless a file has not been selected', function() {
                controller.upload();
                expect(delimitedManagerSvc.upload).not.toHaveBeenCalled();
            });
            describe('if a file has been selected', function() {
                beforeEach(function() {
                    controller.fileObj = {};
                });
                it('unless an error occurs', function() {
                    delimitedManagerSvc.upload.and.returnValue($q.reject('Error message'));
                    controller.upload();
                    scope.$apply();
                    expect(delimitedManagerSvc.upload).toHaveBeenCalledWith(controller.fileObj);
                    expect(delimitedManagerSvc.previewFile).not.toHaveBeenCalled();
                    expect(mapperStateSvc.setInvalidProps).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                    expect(delimitedManagerSvc.dataRows).toBeUndefined();
                    expect(mapperStateSvc.invalidProps).toEqual([]);
                });
                it('successfully', function() {
                    delimitedManagerSvc.upload.and.returnValue($q.when('File Name'));
                    controller.upload();
                    scope.$apply();
                    expect(delimitedManagerSvc.upload).toHaveBeenCalledWith(controller.fileObj);
                    expect(delimitedManagerSvc.fileName).not.toBe('');
                    expect(controller.errorMessage).toBe('');
                    expect(delimitedManagerSvc.previewFile).toHaveBeenCalledWith(50);
                    expect(mapperStateSvc.setInvalidProps).toHaveBeenCalled();
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('file-upload-form')).toBe(true);
        });
        it('with a file input', function() {
            expect(this.element.find('file-input').length).toBe(1);
        });
        it('depending on the type of file', function() {
            controller = this.element.controller('fileUploadForm');
            controller.fileObj = {name: 'test.csv'};
            scope.$digest();
            expect(this.element.find('radio-button').length).toBe(3);

            controller.fileObj = {name: 'test.xls'};
            scope.$digest();
            expect(this.element.find('radio-button').length).toBe(0);
        });
        it('depending on whether an error occurred', function() {
            controller = this.element.controller('fileUploadForm');
            expect(this.element.find('error-display').length).toBe(0);

            controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
    });
});