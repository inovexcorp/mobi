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
describe('Upload Data Overlay directive', function() {
    var $compile, scope, $q, datasetManagerSvc, datasetStateSvc, utilSvc, httpSvc;

    beforeEach(function() {
        module('templates');
        module('uploadDataOverlay');
        mockDatasetManager();
        mockDatasetState();
        mockUtil();
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _$q_, _datasetManagerService_, _datasetStateService_, _utilService_, _httpService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            utilSvc = _utilService_;
            httpSvc = _httpService_;
        });

        datasetStateSvc.selectedDataset = {record: {'@id': 'dataset'}};
        utilSvc.getDctermsValue.and.returnValue('Test');
        scope.onClose = jasmine.createSpy('onClose');
        this.element = $compile(angular.element('<upload-data-overlay on-close="onClose()"></upload-data-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('uploadDataOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetManagerSvc = null;
        datasetStateSvc = null;
        utilSvc = null;
        httpSvc = null;
        this.element.remove();
    });

    it('initializes with the correct values', function() {
        expect(this.controller.datasetTitle).toEqual('Test');
        expect(this.controller.importing).toEqual(false);
    });
    describe('controller bound variable', function() {
        it('onClose should be called in parent scope when invoked', function() {
            this.controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should upload data to a dataset', function() {
            it('unless an error occurs', function() {
                datasetManagerSvc.uploadData.and.returnValue($q.reject('Error Message'));
                this.controller.upload();
                scope.$apply();
                expect(datasetManagerSvc.uploadData).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.controller.fileObj, this.controller.uploadId);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(scope.onClose).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                this.controller.upload();
                expect(this.controller.importing).toEqual(true);
                scope.$apply();
                expect(datasetManagerSvc.uploadData).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.controller.fileObj, this.controller.uploadId);
                expect(this.controller.importing).toEqual(false);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(scope.onClose).toHaveBeenCalled();
            });
        });
        it('should cancel any import and close the overlay', function() {
            this.controller.cancel();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.uploadId);
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('upload-data-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a file-input', function() {
            expect(this.element.find('file-input').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.error = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether data is importing', function() {
            this.controller.form.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(this.element.querySelectorAll('.importing-indicator').length).toEqual(0);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.importing = true;
            this.controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.importing-indicator').length).toEqual(1);
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call upload when the Submit button is clicked', function() {
        spyOn(this.controller, 'upload');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.upload).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});