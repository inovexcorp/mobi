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
describe('New Dataset Overlay directive', function() {
    var $compile, scope, $q, datasetManagerSvc, datasetStateSvc, utilSvc;

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
        this.element = $compile(angular.element('<new-dataset-overlay on-close="onClose()"></new-dataset-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newDatasetOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetManagerSvc = null;
        datasetStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('onClose should be called in parent scope when invoked', function() {
            this.controller.onClose();
            expect(scope.onClose).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should create a dataset', function() {
            beforeEach(function() {
                this.controller.keywords = ['a ', ' b', 'c d'];
                this.controller.selectedOntologies = [{'@id': 'ontology1'}, {'@id': 'ontology2'}];
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.createDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.create();
                scope.$apply();
                expect(this.controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(this.controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(this.controller.recordConfig);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(scope.onClose).not.toHaveBeenCalled();
                expect(this.controller.error).toBe('Error Message');
            });
            it('successfully', function() {
                this.controller.create();
                scope.$apply();
                expect(this.controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(this.controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(this.controller.recordConfig);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(datasetStateSvc.setResults).toHaveBeenCalled();
                expect(scope.onClose).toHaveBeenCalled();
                expect(this.controller.error).toBe('');
            });
        });
    });
    describe('fills the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('NEW-DATASET-OVERLAY');
        });
        describe('on step 1', function() {
            it('with a .overlay', function() {
                expect(this.element.querySelectorAll('.new-dataset-info-overlay.overlay').length).toBe(1);
            });
            it('with a step-progress-bar', function() {
                expect(this.element.find('step-progress-bar').length).toBe(1);
            });
            it('with a text-input', function() {
                expect(this.element.find('text-input').length).toBe(1);
            });
            it('with a text-area', function() {
                expect(this.element.find('text-area').length).toBe(1);
            });
            it('with a keyword-select', function() {
                expect(this.element.find('keyword-select').length).toBe(1);
            });
            it('depending on whether an error has occured', function() {
                expect(this.element.find('error-display').length).toBe(0);

                this.controller.error = 'test';
                scope.$digest();
                expect(this.element.find('error-display').length).toBe(1);
            });
            it('depending on the validity of the form', function() {
                var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
                expect(button.attr('disabled')).toBeTruthy();

                this.controller.infoForm.$invalid = false;
                scope.$digest();
                expect(button.attr('disabled')).toBeFalsy();
            });
            it('with the correct buttons', function() {
                var buttons = this.element.querySelectorAll('.btn-container button');
                expect(buttons.length).toBe(2);
                expect(['Cancel', 'Next']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Next']).toContain(angular.element(buttons[1]).text().trim());
            });
        });
        describe('on step 2', function() {
            beforeEach(function() {
                this.controller.step = 1;
                scope.$digest();
            });
            it('with a .overlay', function() {
                expect(this.element.querySelectorAll('.new-dataset-ontologies-overlay.overlay').length).toBe(1);
            });
            it('with a step-progress-bar', function() {
                expect(this.element.find('step-progress-bar').length).toBe(1);
            });
            it('with a datasets-ontology-picker', function() {
                expect(this.element.find('datasets-ontology-picker').length).toBe(1);
            });
            it('depending on whether an error has occured', function() {
                expect(this.element.find('error-display').length).toBe(0);

                this.controller.error = 'test';
                scope.$digest();
                expect(this.element.find('error-display').length).toBe(1);
            });
            it('depending on whether an error has occured', function() {
                expect(this.element.find('error-display').length).toBe(0);

                this.controller.error = 'test';
                scope.$digest();
                expect(this.element.find('error-display').length).toBe(1);
            });
            it('with the correct buttons', function() {
                var buttons = this.element.querySelectorAll('.btn-container button');
                expect(buttons.length).toBe(2);
                expect(['Back', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Back', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
            });
        });
    });
    it('should go to the next step when the next button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.step).toBe(1);
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
    it('should go the previous step when the back button is clicked', function() {
        this.controller.step = 1;
        scope.$digest();
        var button = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        button.triggerHandler('click');
        expect(this.controller.step).toBe(0);
    });
    it('should call create when the button is clicked', function() {
        this.controller.step = 1;
        scope.$digest();
        spyOn(this.controller, 'create');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.create).toHaveBeenCalled();
    });
});
