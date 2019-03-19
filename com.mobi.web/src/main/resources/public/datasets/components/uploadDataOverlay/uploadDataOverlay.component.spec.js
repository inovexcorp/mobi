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
describe('Upload Data Overlay component', function() {
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
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.close = jasmine.createSpy('close');
        this.element = $compile(angular.element('<upload-data-overlay close="close()" dismiss="dismiss()"></upload-data-overlay>'))(scope);
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
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should update the selected file', function() {
            this.controller.update({});
            expect(this.controller.fileObj).toEqual({});
        });
        describe('should upload data to a dataset', function() {
            it('unless an error occurs', function() {
                datasetManagerSvc.uploadData.and.returnValue($q.reject('Error Message'));
                this.controller.submit();
                scope.$apply();
                expect(datasetManagerSvc.uploadData).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.controller.fileObj, this.controller.uploadId);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                this.controller.fileObj = {name: 'File Name'};
                this.controller.submit();
                expect(this.controller.importing).toEqual(true);
                scope.$apply();
                expect(datasetManagerSvc.uploadData).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id'], this.controller.fileObj, this.controller.uploadId);
                expect(this.controller.importing).toEqual(false);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should cancel any import and close the overlay', function() {
            this.controller.cancel();
            expect(httpSvc.cancel).toHaveBeenCalledWith(this.controller.uploadId);
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('UPLOAD-DATA-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        it('with buttons', function() {
            expect(this.element.find('button').length).toBe(3);
        });
        ['form', 'span', 'file-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
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
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
            expect(this.element.querySelectorAll('.importing-indicator').length).toEqual(0);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.importing = true;
            this.controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.importing-indicator').length).toEqual(1);
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call upload when the Submit button is clicked', function() {
        spyOn(this.controller, 'submit');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});