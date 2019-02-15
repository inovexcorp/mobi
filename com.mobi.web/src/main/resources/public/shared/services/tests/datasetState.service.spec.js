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
describe('Dataset State service', function() {
    var datasetStateSvc, $q, $timeout, datasetManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('datasetState');
        mockDatasetManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$q_, _$timeout_, datasetStateService, _datasetManagerService_, _utilService_, _prefixes_) {
            $q = _$q_;
            $timeout = _$timeout_;
            datasetStateSvc = datasetStateService;
            datasetManagerSvc = _datasetManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });
    });

    afterEach(function() {
        datasetStateSvc = null;
        $q = null;
        $timeout = null;
        datasetManagerSvc = null;
        utilSvc = null;
        prefixes = null;
    });

    it('should reset all state variables', function() {
        datasetStateSvc.reset();
        expect(datasetStateSvc.paginationConfig.pageIndex).toBe(0);
        expect(datasetStateSvc.paginationConfig.searchText).toBe('');
        expect(datasetStateSvc.totalSize).toBe(0);
        expect(datasetStateSvc.links).toEqual({next: '', prev: ''});
        expect(datasetStateSvc.results).toEqual([]);
    });
    describe('should set the results of dataset records', function() {
        beforeEach(function() {
            spyOn(datasetStateSvc, 'setPagination');
        });
        describe('if a url is passed', function() {
            beforeEach(function() {
                this.url = 'http://example.com';
            });
            it('unless an error occurs', function() {
                utilSvc.getResultsPage.and.returnValue($q.reject('Error Message'));
                datasetStateSvc.setResults(this.url);
                $timeout.flush();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.url);
                expect(datasetManagerSvc.getDatasetRecords).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                expect(datasetStateSvc.setPagination).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                datasetStateSvc.setResults(this.url);
                $timeout.flush();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(this.url);
                expect(datasetManagerSvc.getDatasetRecords).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setPagination).toHaveBeenCalledWith(jasmine.any(Object));
            });
        });
        describe('if a url is not passed', function() {
            it('unless an error occurs', function() {
                datasetManagerSvc.getDatasetRecords.and.returnValue($q.reject('Error Message'));
                datasetStateSvc.setResults();
                $timeout.flush();
                expect(utilSvc.getResultsPage).not.toHaveBeenCalled();
                expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalledWith(datasetStateSvc.paginationConfig);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                expect(datasetStateSvc.setPagination).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                datasetStateSvc.setResults();
                $timeout.flush();
                expect(utilSvc.getResultsPage).not.toHaveBeenCalled();
                expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalledWith(datasetStateSvc.paginationConfig);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                expect(datasetStateSvc.setPagination).toHaveBeenCalledWith(jasmine.any(Object));
            });
        });
    });
    it('should reset all pagination related state variables', function() {
        datasetStateSvc.resetPagination();
        expect(datasetStateSvc.paginationConfig.pageIndex).toBe(0);
        expect(datasetStateSvc.paginationConfig.searchText).toBe('');
        expect(datasetStateSvc.totalSize).toBe(0);
        expect(datasetStateSvc.links).toEqual({next: '', prev: ''});
        expect(datasetStateSvc.results).toEqual([]);
    });
    describe('should set the pagination variables based on a response', function() {
        beforeEach(function() {
            this.headers = {
                'x-total-count': 1
            };
            this.response = {
                data: [[]],
                headers: jasmine.createSpy('headers').and.returnValue(this.headers)
            };
            datasetManagerSvc.splitDatasetArray.and.returnValue({record: {}, identifiers: []});
        });
        it('if it has links', function() {
            var nextLink = 'http://example.com/next';
            var prevLink = 'http://example.com/prev';
            this.headers.link = '<' + nextLink + '>; rel=\"next\", <' + prevLink + '>; rel=\"prev\"';
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
            datasetStateSvc.setPagination(this.response);
            expect(datasetManagerSvc.splitDatasetArray).toHaveBeenCalledWith([]);
            expect(datasetStateSvc.results).toEqual([{record: {}, identifiers: []}]);
            expect(datasetStateSvc.totalSize).toEqual(this.headers['x-total-count']);
            expect(datasetStateSvc.links.next).toBe(nextLink);
            expect(datasetStateSvc.links.prev).toBe(prevLink);
        });
        it('if it does not have links', function() {
            datasetStateSvc.setPagination(this.response);
            expect(datasetManagerSvc.splitDatasetArray).toHaveBeenCalledWith([]);
            expect(datasetStateSvc.results).toEqual([{record: {}, identifiers: []}]);
            expect(datasetStateSvc.totalSize).toEqual(this.headers['x-total-count']);
            expect(datasetStateSvc.links.next).toBe('');
            expect(datasetStateSvc.links.prev).toBe('');
        });
    });
});
