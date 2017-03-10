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
describe('Datasets List directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        datasetStateSvc,
        datasetManagerSvc,
        utilSvc,
        prefixes;

    beforeEach(function() {
        module('templates');
        module('datasetsList');
        mockDatasetState();
        mockDatasetManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetStateService_, _datasetManagerService_, _utilService_, _prefixes_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetStateSvc = _datasetStateService_;
            datasetManagerSvc = _datasetManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
        });

        element = $compile(angular.element('<datasets-list></datasets-list>'))(scope);
        scope.$digest();
        controller = element.controller('datasetsList');
    });

    describe('controller methods', function() {
        describe('should set the correct state for clicking a dataset', function() {
            beforeEach(function() {
                controller.openedDatasetId = 'test';
            })
            it('if it was open', function() {
                controller.clickDataset({'@id': controller.openedDatasetId});
                expect(controller.selectedDataset).toBeUndefined();
            });
            it('if it was not open', function() {
                controller.clickDataset({'@id': 'notopen'});
                expect(controller.selectedDataset).toEqual({'@id': 'notopen'});
                expect(controller.openedDatasetId).toBe('notopen');
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
            beforeEach(function() {
                controller.showDeleteConfirm = true;
                controller.selectedDataset = {'@id': 'dataset'};
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.deleteDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.delete();
                scope.$apply();
                expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith('dataset');
                expect(controller.showDeleteConfirm).toBe(true);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');
                expect(controller.selectedDataset).toEqual({'@id': 'dataset'});
                expect(datasetStateSvc.resetPagination).not.toHaveBeenCalled();
                expect(datasetStateSvc.setResults).not.toHaveBeenCalled();

            });
            it('successfully', function() {
                controller.delete();
                scope.$apply();
                expect(datasetManagerSvc.deleteDatasetRecord).toHaveBeenCalledWith('dataset');
                expect(controller.showDeleteConfirm).toBe(false);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(controller.error).toBe('');
                expect(controller.selectedDataset).toBeUndefined();
                expect(datasetStateSvc.resetPagination).toHaveBeenCalled();
                expect(datasetStateSvc.setResults).toHaveBeenCalled();
            });
        });
        it('should clear a dataset', function() {
            beforeEach(function() {
                controller.showClearConfirm = true;
                controller.selectedDataset = {'@id': 'dataset'};
            });
            it('unless an error occurs', function() {
                datasetManagerSvc.clearDatasetRecord.and.returnValue($q.reject('Error Message'));
                controller.clear();
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith('dataset');
                expect(controller.showClearConfirm).toBe(true);
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(controller.error).toBe('Error Message');

            });
            it('successfully', function() {
                controller.clear();
                scope.$apply();
                expect(datasetManagerSvc.clearDatasetRecord).toHaveBeenCalledWith('dataset');
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
            expect(element.querySelectorAll('block-content .text-info').length).toBe(1);
            expect(element.querySelectorAll('block-content .dataset').length).toBe(0);

            datasetStateSvc.results = [{}, {}];
            scope.$digest();
            expect(element.querySelectorAll('block-content .text-info').length).toBe(0);
            expect(element.querySelectorAll('block-content .dataset').length).toBe(datasetStateSvc.results.length);
        });
        it('depending on whether search text has been entered', function() {
            expect(element.querySelectorAll('block-content .text-info .no-results').length).toBe(1);
            expect(element.querySelectorAll('block-content .text-info .no-match').length).toBe(0);

            datasetStateSvc.paginationConfig.searchText = 'test';
            scope.$digest();
            expect(element.querySelectorAll('block-content .text-info .no-results').length).toBe(0);
            expect(element.querySelectorAll('block-content .text-info .no-match').length).toBe(1);
        });
        it('depending on whether a dataset is opened', function() {
            datasetStateSvc.results = [{'@id': 'a'}, {'@id': 'b'}];
            controller.openedDatasetId = 'a';
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
        var dataset = {'@id': 'dataset'};
        datasetStateSvc.results = [dataset];
        spyOn(controller, 'clickDataset');
        scope.$digest();

        var datasetDiv = angular.element(element.querySelectorAll('block-content .dataset')[0]);
        datasetDiv.triggerHandler('click');
        expect(controller.clickDataset).toHaveBeenCalledWith(dataset);
    });
    it('should set the correct state when a delete link is clicked', function() {
        var dataset = {'@id': 'dataset'};
        datasetStateSvc.results = [dataset];
        scope.$digest();

        var link = angular.element(element.querySelectorAll('block-content .dataset .action-container .delete-dataset')[0]);
        link.triggerHandler('click');
        expect(controller.selectedDataset).toEqual(dataset);
        expect(controller.showDeleteConfirm).toBe(true);
    });
    it('should set the correct state when a clear link is clicked', function() {
        var dataset = {'@id': 'dataset'};
        datasetStateSvc.results = [dataset];
        scope.$digest();

        var link = angular.element(element.querySelectorAll('block-content .dataset .action-container .clear-dataset')[0]);
        link.triggerHandler('click');
        expect(controller.selectedDataset).toEqual(dataset);
        expect(controller.showClearConfirm).toBe(true);
    });
});