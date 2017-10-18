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
    var $compile, scope, $q, element, controller, datasetStateSvc, datasetManagerSvc, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('datasetsList');
        mockDatasetState();
        mockDatasetManager();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();
        injectInArrayFilter();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _datasetManagerService_, _catalogManagerService_, _utilService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        element = $compile(angular.element('<datasets-list></datasets-list>'))(scope);
        scope.$digest();
        controller = element.controller('datasetsList');
    });

    describe('controller methods', function() {
        it('should retrieve the list of identified ontologies for a dataset', function() {
            var ontologyId = 'ontologyId';
            var dataset = {identifiers: [_.set({}, "['" + prefixes.dataset + "linksToRecord'][0]['@id']", ontologyId)]};
            expect(controller.getIdentifiedOntologyIds(dataset)).toEqual([ontologyId]);
        });
        describe('should set the correct state for clicking a dataset', function() {
            beforeEach(function() {
                datasetStateSvc.openedDatasetId = 'test';
            })
            it('if it was open', function() {
                controller.clickDataset({record: {'@id': datasetStateSvc.openedDatasetId}});
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
                    spyOn(controller, 'getIdentifiedOntologyIds').and.returnValue([ontologyId]);
                    controller.clickDataset(dataset);
                    scope.$apply();
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith(ontologyId, 'catalogId');
                    expect(controller.cachedOntologyIds).toContain(ontologyId);
                });
                it('and it does not link to any ontologies', function() {
                    spyOn(controller, 'getIdentifiedOntologyIds').and.returnValue([]);
                    controller.clickDataset(dataset);
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                    expect(controller.cachedOntologyIds).toEqual([]);
                });
                it('and all the ontologies it links to have been retrieved already', function() {
                    spyOn(controller, 'getIdentifiedOntologyIds').and.returnValue([ontologyId]);
                    controller.cachedOntologyIds = [ontologyId]
                    controller.clickDataset(dataset);
                    expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                    expect(datasetStateSvc.openedDatasetId).toBe(dataset.record['@id']);
                    expect(controller.getIdentifiedOntologyIds).toHaveBeenCalledWith(dataset);
                    expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                    expect(controller.cachedOntologyIds).toEqual([ontologyId]);
                });
            });
        });
        describe('should get a page of dataset records', function() {
            beforeEach(function() {
                this.index = datasetStateSvc.paginationConfig.pageIndex;
            });
            it('if the direction is previous', function() {
                controller.getPage('prev');
                expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index - 1);
            });
            it('if the direction is next', function() {
                controller.getPage('next');
                expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index + 1);
            });
        });
        describe('should delete a dataset', function() {
            var dataset = {record: {'@id': 'dataset'}};
            beforeEach(function() {
                controller.showDeleteConfirm = true;
                datasetStateSvc.selectedDataset = dataset;
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.deleteDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.delete();
                scope.$apply();
                expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(dataset.record['@id']);
                expect(controller.showDeleteConfirm).toBe(true);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');
                expect(datasetStateSvc.selectedDataset).toEqual(dataset);
                expect(datasetStateSvc.resetPagination).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();

            });
            describe('successfully', function() {
                beforeEach(function() {
                    this.index = datasetStateSvc.paginationConfig.pageIndex = 1;
                });
                it('if there is only one result on the current page', function() {
                    datasetStateSvc.results = [{}];
                    controller.delete();
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(dataset.record['@id']);
                    expect(controller.showDeleteConfirm).toBe(false);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                    expect(datasetStateSvc.selectedDataset).toBeUndefined();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index - 1);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                });
                it('if there is more than one result on the current page', function() {
                    datasetStateSvc.results = [{}, {}];
                    controller.delete();
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(dataset.record['@id']);
                    expect(controller.showDeleteConfirm).toBe(false);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                    expect(datasetStateSvc.selectedDataset).toBeUndefined();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                });
                it('if there are no results on the current page', function() {
                    controller.delete();
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(dataset.record['@id']);
                    expect(controller.showDeleteConfirm).toBe(false);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                    expect(datasetStateSvc.selectedDataset).toBeUndefined();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(this.index);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                });
                it('if the current page is the first one', function() {
                    datasetStateSvc.paginationConfig.pageIndex = 0;
                    datasetStateSvc.results = [{}];
                    controller.delete();
                    scope.$apply();
                    expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith(dataset.record['@id']);
                    expect(controller.showDeleteConfirm).toBe(false);
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(controller.error).toBe('');
                    expect(datasetStateSvc.selectedDataset).toBeUndefined();
                    expect(datasetStateSvc.paginationConfig.pageIndex).toBe(0);
                    expect(datasetStateSvc.setResults).toHaveBeenCalled();
                });
            });
        });
        describe('should clear a dataset', function() {
            beforeEach(function() {
                controller.showClearConfirm = true;
                datasetStateSvc.selectedDataset = {record: {'@id': 'dataset'}};
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.clearDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.clear();
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id']);
                expect(controller.showClearConfirm).toBe(true);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');

            });
            it('successfully', function() {
                controller.clear();
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith(datasetStateSvc.selectedDataset.record['@id']);
                expect(controller.showClearConfirm).toBe(false);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(controller.error).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('datasets-list')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
        it('depending on how many datasets there are', function() {
            expect(element.querySelectorAll('block-content info-message').length).toBe(1);
            expect(element.querySelectorAll('block-content .dataset').length).toBe(0);

            datasetStateSvc.results = [{}, {}];
            scope.$digest();
            expect(element.querySelectorAll('block-content info-message').length).toBe(0);
            expect(element.querySelectorAll('block-content .dataset').length).toBe(datasetStateSvc.results.length);
        });
        it('depending on whether search text has been entered', function() {
            expect(element.querySelectorAll('block-content info-message.no-results').length).toBe(1);
            expect(element.querySelectorAll('block-content info-message.no-match').length).toBe(0);

            datasetStateSvc.paginationConfig.searchText = 'test';
            scope.$digest();
            expect(element.querySelectorAll('block-content info-message.no-results').length).toBe(0);
            expect(element.querySelectorAll('block-content info-message.no-match').length).toBe(1);
        });
        it('depending on whether a dataset is opened', function() {
            datasetStateSvc.results = [{record: {'@id': 'a'}}, {record: {'@id': 'b'}}];
            datasetStateSvc.openedDatasetId = 'a';
            scope.$digest();
            var datasets = element.querySelectorAll('block-content .dataset');
            expect(angular.element(datasets[0]).hasClass('open')).toBe(true);
            expect(angular.element(datasets[0].querySelectorAll('.header i')[0]).hasClass('fa-caret-down')).toBe(true);
            expect(datasets[0].querySelectorAll('.full-details').length).toBe(1);
            expect(angular.element(datasets[1]).hasClass('open')).toBe(false);
            expect(angular.element(datasets[1].querySelectorAll('.header i')[0]).hasClass('fa-caret-right')).toBe(true);
            expect(datasets[1].querySelectorAll('.full-details').length).toBe(0);
        });
        it('depending on whether a dataset is being deleted', function() {
            expect(element.querySelectorAll('confirmation-overlay.delete-dataset').length).toBe(0);

            controller.showDeleteConfirm = true;
            scope.$digest();
            expect(element.querySelectorAll('confirmation-overlay.delete-dataset').length).toBe(1);
        });
        it('depending on whether a dataset is being cleared', function() {
            expect(element.querySelectorAll('confirmation-overlay.clear-dataset').length).toBe(0);

            controller.showClearConfirm = true;
            scope.$digest();
            expect(element.querySelectorAll('confirmation-overlay.clear-dataset').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            controller.showClearConfirm = true;
            controller.showDeleteConfirm = true;
            scope.$digest();
            expect(element.find('error-display').length).toBe(0);

            controller.error = 'Error Message';
            scope.$digest();
            expect(element.find('error-display').length).toBe(2);
        });
    });
    it('should call clickDataset when a dataset is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        spyOn(controller, 'clickDataset');
        scope.$digest();

        var datasetDiv = angular.element(element.querySelectorAll('block-content .dataset .details')[0]);
        datasetDiv.triggerHandler('click');
        expect(controller.clickDataset).toHaveBeenCalledWith(dataset);
    });
    it('should set the correct state when a delete link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();

        var link = angular.element(element.querySelectorAll('block-content .dataset [uib-dropdown] .delete-dataset')[0]);
        link.triggerHandler('click');
        expect(datasetStateSvc.selectedDataset).toEqual(dataset);
        expect(controller.showDeleteConfirm).toBe(true);
    });
    it('should set the correct state when a clear link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();

        var link = angular.element(element.querySelectorAll('block-content .dataset [uib-dropdown] .clear-dataset')[0]);
        link.triggerHandler('click');
        expect(datasetStateSvc.selectedDataset).toEqual(dataset);
        expect(controller.showClearConfirm).toBe(true);
    });
    it('should set the correct state when an update link is clicked', function() {
        var dataset = {record: {'@id': 'dataset'}};
        datasetStateSvc.results = [dataset];
        scope.$digest();

        var link = angular.element(element.querySelectorAll('block-content .dataset [uib-dropdown] .update-dataset')[0]);
        link.triggerHandler('click');
        expect(datasetStateSvc.selectedDataset).toEqual(dataset);
        expect(datasetStateSvc.showEditOverlay).toBe(true);
    });
});
