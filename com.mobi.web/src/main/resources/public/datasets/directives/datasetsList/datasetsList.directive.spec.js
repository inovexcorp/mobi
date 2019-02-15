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
describe('Datasets List directive', function() {
    var $compile, scope, $q, datasetStateSvc, datasetManagerSvc, catalogManagerSvc, utilSvc, prefixes, modalSvc;

    beforeEach(function() {
        module('templates');
        module('datasetsList');
        mockDatasetState();
        mockDatasetManager();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();
        mockModal();
        injectInArrayFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _datasetStateService_, _datasetManagerService_, _catalogManagerService_, _utilService_, _prefixes_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            modalSvc = _modalService_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        this.element = $compile(angular.element('<datasets-list></datasets-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetsList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        datasetStateSvc = null;
        datasetManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should retrieve the list of identified ontologies for a dataset', function() {
            var ontologyId = 'ontologyId';
            var dataset = {identifiers: [_.set({}, "['" + prefixes.dataset + "linksToRecord'][0]['@id']", ontologyId)]};
            expect(this.controller.getIdentifiedOntologyIds(dataset)).toEqual([ontologyId]);
        });
        describe('should set the correct state for clicking a dataset', function() {
            beforeEach(function() {
                datasetStateSvc.openedDatasetId = 'test';
            })
            it('if it was open', function() {
                this.controller.clickDataset({record: {'@id': datasetStateSvc.openedDatasetId}});
                expect(datasetStateSvc.selectedDataset).toBeUndefined();
                expect(datasetStateSvc.openedDatasetId).toBe('');
            });
            describe('if it was not open', function() {
                var dataset = {record: {'@id': 'notopen'}};
                var ontologyId = 'ontologyId';
                beforeEach(function() {
                    catalogManagerSvc.getRecord.and.callFake(function(id) {
                        return {'@id': id};
                    });
                });
                it('and it links to ontologies that have not been retrieved yet', function() {
                    spyOn(this.controller, 'getIdentifiedOntologyIds').and.returnValue([ontologyId]);
                    this.controller.clickDataset(dataset);
                    scope.$apply();
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(this.controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(ontologyId, 'catalogId');
                    expect(this.controller.cachedOntologyIds).toContain(ontologyId);
                });
                it('and it does not link to any ontologies', function() {
                    spyOn(this.controller, 'getIdentifiedOntologyIds').and.returnValue([]);
                    this.controller.clickDataset(dataset);
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(this.controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                    expect(this.controller.cachedOntologyIds).toEqual([]);
                });
                it('and all the ontologies it links to have been retrieved already', function() {
                    spyOn(this.controller, 'getIdentifiedOntologyIds').and.returnValue([ontologyId]);
                    this.controller.cachedOntologyIds = [ontologyId]
                    this.controller.clickDataset(dataset);
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(this.controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                    expect(this.controller.cachedOntologyIds).toEqual([ontologyId]);
                });
            });
        });
        it('should get a page of dataset records', function() {
            this.controller.getPage();
            expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.controller.currentPage - 1);
            expect(datasetStateSvc.setResults).toHaveBeenCalled();
        });
        describe('should delete a dataset', function() {
            beforeEach(function() {
                this.dataset = {record: {'@id': 'dataset'}};
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.deleteDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.delete(this.dataset);
                scope.$apply();
                expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.resetPagination).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    this.index = datasetStateSvc.paginationConfig.pageIndex = 1;
                });
                it('if there is only one result on the current page', function() {
                    datasetStateSvc.results = [{}];
                    this.controller.delete(this.dataset);
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index - 1);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(datasetStateSvc.submittedSearch).toEqual(!!datasetStateSvc.paginationConfig.searchText);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('if there is more than one result on the current page', function() {
                    datasetStateSvc.results = [{}, {}];
                    this.controller.delete(this.dataset);
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(datasetStateSvc.submittedSearch).toEqual(!!datasetStateSvc.paginationConfig.searchText);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('if there are no results on the current page', function() {
                    this.controller.delete(this.dataset);
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(datasetStateSvc.submittedSearch).toEqual(!!datasetStateSvc.paginationConfig.searchText);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('if the current page is the first one', function() {
                    datasetStateSvc.paginationConfig.pageIndex = 0;
                    datasetStateSvc.results = [{}];
                    this.controller.delete(this.dataset);
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(0);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                    expect(datasetStateSvc.submittedSearch).toEqual(!!datasetStateSvc.paginationConfig.searchText);
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
        });
        describe('should clear a dataset', function() {
            beforeEach(function() {
                this.dataset = {record: {'@id': 'dataset'}};
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.clearDatasetRecord.and.returnValue($q.reject('Error Message'));
                this.controller.clear(this.dataset);
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');

            });
            it('successfully', function() {
                this.controller.clear(this.dataset);
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith(this.dataset.record['@id']);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        it('should show the editDatasetOverlay', function() {
            this.controller.showEdit({});
            expect(datasetStateSvc.selectedDataset).toEqual({});
            expect(modalSvc.openModal).toHaveBeenCalledWith('editDatasetOverlay');
        });
        it('should show the uploadDataOverlay', function() {
            this.controller.showUploadData({});
            expect(datasetStateSvc.selectedDataset).toEqual({});
            expect(modalSvc.openModal).toHaveBeenCalledWith('uploadDataOverlay');
        });
        it('should confirm deleting a dataset', function() {
            this.controller.showDelete({});
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), jasmine.any(Function));
        });
        it('should confirm clearing a dataset', function() {
            this.controller.showClear({});
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), jasmine.any(Function));
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('datasets-list')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
        it('depending on how many datasets there are', function() {
            expect(this.element.querySelectorAll('block-content info-message').length).toBe(1);
            expect(this.element.querySelectorAll('block-content .dataset').length).toBe(0);

            datasetStateSvc.results = [{}, {}];
            scope.$digest();
            expect(this.element.querySelectorAll('block-content info-message').length).toBe(0);
            expect(this.element.querySelectorAll('block-content .dataset').length).toBe(datasetStateSvc.results.length);
        });
        it('depending on whether a search has been submitted', function() {
            expect(this.element.querySelectorAll('block-content info-message.no-results').length).toBe(1);
            expect(this.element.querySelectorAll('block-content info-message.no-match').length).toBe(0);

            datasetStateSvc.submittedSearch = true;
            scope.$digest();
            expect(this.element.querySelectorAll('block-content info-message.no-results').length).toBe(0);
            expect(this.element.querySelectorAll('block-content info-message.no-match').length).toBe(1);
        });
        it('depending on whether a dataset is opened', function() {
            datasetStateSvc.results = [{record: {'@id': 'a'}}, {record: {'@id': 'b'}}];
            datasetStateSvc.openedDatasetId = 'a';
            scope.$digest();
            var datasets = this.element.querySelectorAll('block-content .dataset');
            expect(angular.element(datasets[0]).hasClass('open')).toBe(true);
            expect(angular.element(datasets[0].querySelectorAll('.header i')[0]).hasClass('fa-caret-down')).toBe(true);
            expect(datasets[0].querySelectorAll('.full-details').length).toBe(1);
            expect(angular.element(datasets[1]).hasClass('open')).toBe(false);
            expect(angular.element(datasets[1].querySelectorAll('.header i')[0]).hasClass('fa-caret-right')).toBe(true);
            expect(datasets[1].querySelectorAll('.full-details').length).toBe(0);
        });
    });
    it('should call clickDataset when a dataset is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        spyOn(this.controller, 'clickDataset');
        scope.$digest();

        var datasetDiv = angular.element(this.element.querySelectorAll('block-content .dataset .details')[0]);
        datasetDiv.triggerHandler('click');
        expect(this.controller.clickDataset).toHaveBeenCalledWith(dataset);
    });
    it('should set the correct state when a upload data link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();
        spyOn(this.controller, 'showUploadData');
        var link = angular.element(this.element.querySelectorAll('block-content .dataset [uib-dropdown] .upload-data')[0]);
        link.triggerHandler('click');
        expect(this.controller.showUploadData).toHaveBeenCalledWith(dataset);
    });
    it('should call showDelete when a delete link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();
        spyOn(this.controller, 'showDelete');
        var link = angular.element(this.element.querySelectorAll('block-content .dataset [uib-dropdown] .delete-dataset')[0]);
        link.triggerHandler('click');
        expect(this.controller.showDelete).toHaveBeenCalledWith(dataset);
    });
    it('should set the correct state when a clear link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();
        spyOn(this.controller, 'showClear');
        var link = angular.element(this.element.querySelectorAll('block-content .dataset [uib-dropdown] .clear-dataset')[0]);
        link.triggerHandler('click');
        expect(this.controller.showClear).toHaveBeenCalledWith(dataset);
    });
    it('should call showEdit when an edit link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();
        spyOn(this.controller, 'showEdit');
        var link = angular.element(this.element.querySelectorAll('block-content .dataset [uib-dropdown] .update-dataset')[0]);
        link.triggerHandler('click');
        expect(this.controller.showEdit).toHaveBeenCalledWith(dataset);
    });
});
