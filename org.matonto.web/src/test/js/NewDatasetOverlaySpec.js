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
    var $compile, scope, $q, element, controller, datasetManagerSvc, datasetStateSvc, catalogManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('newDatasetOverlay');
        mockDatasetManager();
        mockDatasetState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetManagerService_, _datasetStateService_, _catalogManagerService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'local'};
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
        describe('should get a list of ontologies', function() {
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecords.and.returnValue($q.reject('Error Message'));
                controller.getOntologies();
                scope.$apply();
                expect(controller.ontologySearchConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.ontologySearchConfig);
                expect(controller.ontologies).toEqual([]);
                expect(controller.totalSize).toEqual(0);
                expect(controller.links).toEqual({next: '', prev: ''});
                expect(utilSvc.parseLinks).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');
            });
            it('successfully', function() {
                var headers = { 'x-total-count': 0, link: '' };
                var response = {
                    data: [{}],
                    headers: jasmine.createSpy('headers').and.returnValue(headers)
                };
                catalogManagerSvc.getRecords.and.returnValue($q.when(response));
                utilSvc.parseLinks.and.returnValue({prev: 'prev', next: 'next'});
                controller.getOntologies();
                scope.$apply();
                expect(controller.ontologySearchConfig.pageIndex).toBe(0);
                expect(catalogManagerSvc.getRecords).toHaveBeenCalledWith(catalogManagerSvc.localCatalog['@id'], controller.ontologySearchConfig);
                expect(controller.ontologies).toEqual(response.data);
                expect(response.headers).toHaveBeenCalled();
                expect(controller.totalSize).toBe(headers['x-total-count']);
                expect(utilSvc.parseLinks).toHaveBeenCalledWith(headers.link);
                expect(controller.links.prev).toBe('prev');
                expect(controller.links.next).toBe('next');
                expect(controller.error).toBe('');
            });
        });
        describe('should create a dataset', function() {
            beforeEach(function() {
                controller.keywords = ['a ', ' b', 'c d'];
                controller.selectedOntologies = [{'@id': 'ontology1'}, {'@id': 'ontology2'}];
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.createDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.create();
                scope.$apply();
                expect(controller.recordConfig.keywords).toEqual(['a', 'b', 'c d']);
                expect(controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
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
                expect(controller.recordConfig.ontologies).toEqual(['ontology1', 'ontology2']);
                expect(datasetManagerSvc.createDatasetRecord).toHaveBeenCalledWith(controller.recordConfig);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(datasetStateSvc.setResults).toHaveBeenCalled();
                expect(scope.onClose).toHaveBeenCalled();
                expect(controller.error).toBe('');
            });
        });
        it('should test whether an ontology is selected', function() {
            expect(controller.isSelected('id')).toBe(false);
            controller.selectedOntologies = [{'@id': 'id'}];
            expect(controller.isSelected('id')).toBe(true);
            expect(controller.isSelected('test')).toBe(false);
        });
        it('should select an ontology', function() {
            var ontology = {'@id': 'id'};
            spyOn(controller, 'isSelected').and.returnValue(true);
            controller.selectOntology(ontology);
            expect(controller.selectedOntologies).not.toContain(ontology);

            controller.isSelected.and.returnValue(false);
            controller.selectOntology(ontology);
            expect(controller.selectedOntologies).toContain(ontology);
        });
        it('should unselect an ontology', function() {
            controller.selectedOntologies = [{'@id': 'id'}];
            controller.unselectOntology('test');
            expect(controller.selectedOntologies.length).toBe(1);
            controller.unselectOntology('id');
            expect(controller.selectedOntologies.length).toBe(0);
        });
    });
    describe('fills the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('NEW-DATASET-OVERLAY');
        });
        describe('on step 1', function() {
            it('with a .overlay', function() {
                expect(element.querySelectorAll('.new-dataset-info-overlay.overlay').length).toBe(1);
            });
            it('with a step-progress-bar', function() {
                expect(element.find('step-progress-bar').length).toBe(1);
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

                controller.infoForm.$invalid = false;
                scope.$digest();
                expect(button.attr('disabled')).toBeFalsy();
            });
            it('with the correct buttons', function() {
                var buttons = element.querySelectorAll('.btn-container button');
                expect(buttons.length).toBe(2);
                expect(['Cancel', 'Next']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Next']).toContain(angular.element(buttons[1]).text().trim());
            });
        });
        describe('on step 2', function() {
            beforeEach(function() {
                controller.step = 1;
                scope.$digest();
            });
            it('with a .overlay', function() {
                expect(element.querySelectorAll('.new-dataset-ontologies-overlay.overlay').length).toBe(1);
            });
            it('with a step-progress-bar', function() {
                expect(element.find('step-progress-bar').length).toBe(1);
            });
            it('with a .input-group', function() {
                expect(element.querySelectorAll('.input-group.ontologies-search-bar').length).toBe(1);
            });
            it('with a .list-group', function() {
                expect(element.querySelectorAll('.list-group.ontology-records-list').length).toBe(1);
            });
            it('with a paging-details', function() {
                expect(element.find('paging-details').length).toBe(1);
            });
            it('with a pagination', function() {
                expect(element.find('pagination').length).toBe(1);
            });
            it('depending on whether an error has occured', function() {
                expect(element.find('error-display').length).toBe(0);

                controller.error = 'test';
                scope.$digest();
                expect(element.find('error-display').length).toBe(1);
            });
            it('depending on whether an error has occured', function() {
                expect(element.find('error-display').length).toBe(0);

                controller.error = 'test';
                scope.$digest();
                expect(element.find('error-display').length).toBe(1);
            });
            it('depending on how many ontologies there are', function() {
                controller.ontologies = [{}];
                scope.$digest();
                expect(element.querySelectorAll('.ontology-records-list button').length).toBe(controller.ontologies.length);
            });
            it('depending on whether an ontology has been selected', function() {
                controller.ontologies = [{'@id': 'ontology'}];
                spyOn(controller, 'isSelected').and.returnValue(true);
                scope.$digest();
                var button = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
                expect(button.hasClass('active')).toBe(true);
            });
            it('depending on how many ontologies have been selected', function() {
                expect(element.querySelectorAll('.selected-ontologies span').length).toBe(2);
                controller.selectedOntologies = [{'@id': '1'}, {'@id': '2'}];
                scope.$digest();
                expect(element.querySelectorAll('.selected-ontologies span').length).toBe(controller.selectedOntologies.length + 1);
            });
            it('with the correct buttons', function() {
                var buttons = element.querySelectorAll('.btn-container button');
                expect(buttons.length).toBe(2);
                expect(['Back', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Back', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
            });
        });
    });
    it('should go to the next step when the next button is clicked', function() {
        spyOn(controller, 'getOntologies');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.step).toBe(1);
        expect(controller.getOntologies).toHaveBeenCalled();
    });
    it('should call onClose when the button is clicked', function() {
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(scope.onClose).toHaveBeenCalled();
    });
    it('should call getOntologies when the search button is clicked', function() {
        controller.step = 1;
        scope.$digest();
        spyOn(controller, 'getOntologies');
        var searchButton = angular.element(element.querySelectorAll('.ontologies-search-bar button')[0]);
        searchButton.triggerHandler('click');
        expect(controller.getOntologies).toHaveBeenCalled();
    });
    it('should select an ontology when clicked', function() {
        controller.step = 1;
        controller.ontologies = [{}];
        scope.$digest();
        spyOn(controller, 'selectOntology');
        var button = angular.element(element.querySelectorAll('.ontology-records-list button')[0]);
        button.triggerHandler('click');
        expect(controller.selectOntology).toHaveBeenCalledWith({});
    });
    it('should unselect an ontology when clicked', function() {
        controller.step = 1;
        controller.selectedOntologies = [{'@id': 'id'}];
        scope.$digest();
        spyOn(controller, 'unselectOntology');
        var link = angular.element(element.querySelectorAll('.selected-ontologies span a')[0]);
        link.triggerHandler('click');
        expect(controller.unselectOntology).toHaveBeenCalledWith('id');
    });
    it('should go the previous step when the back button is clicked', function() {
        controller.step = 1;
        scope.$digest();
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(controller.step).toBe(0);
    });
    it('should call create when the button is clicked', function() {
        controller.step = 1;
        scope.$digest();
        spyOn(controller, 'create');
        var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(controller.create).toHaveBeenCalled();
    });
});
