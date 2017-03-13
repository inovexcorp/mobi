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
describe('New Dataset Overlay directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        datasetManagerSvc,
        datasetStateSvc,
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('newDatasetOverlay');
        mockDatasetManager();
        mockDatasetState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _datasetManagerService_, _datasetStateService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        scope.onClose = jasmine.createSpy('onClose')
        element = $compile(angular.element('<new-dataset-overlay on-close="onClose()"></new-dataset-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('newDatasetOverlay');
    });

    describe('controller bound variable', function() {
        it('onClose should be called in parent scope when invoked', function() {
            controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should create a dataset', function() {
            beforeEach(function() {
                controller.keywords = ['a ', ' b', 'c d'];
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.createDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.create();
                scope.$apply();
                expect(controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(controller.recordConfig);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.onClose).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');
            });
            it('successfully', function() {
                controller.create();
                scope.$apply();
                expect(controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(controller.recordConfig);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(datasetStateSvc.setResults).toHaveBeenCalled();
                expect(scope.onClose).toHaveBeenCalled();
                expect(controller.error).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('new-dataset-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a text-input', function() {
            expect(element.find('text-input').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(element.find('keyword-select').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.error = 'test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and continue', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call create when the submit button is clicked', function() {
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
});