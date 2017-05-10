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
describe('Discover State Service', function() {
    var discoverStateSvc, datasetManagerSvc, prefixes, $q, util, scope;

    beforeEach(function() {
        module('discoverState');
        mockDatasetManager();
        mockPrefixes();
        mockUtil();

        inject(function(discoverStateService, _datasetManagerService_, _prefixes_, _$q_, _utilService_, _$rootScope_) {
            discoverStateSvc = discoverStateService;
            datasetManagerSvc = _datasetManagerService_;
            prefixes = _prefixes_;
            $q = _$q_;
            util = _utilService_;
            scope = _$rootScope_;
        });
    });
    
    describe('setDatasetRecords calls the correct functions', function() {
        it('when getDatasetRecords is resolved', function() {
            var datasetRecord = {'@type': [prefixes.dataset + 'DatasetRecord']};
            datasetManagerSvc.getDatasetRecords.and.returnValue($q.when({data: [[datasetRecord]]}));
            discoverStateSvc.setDatasetRecords();
            scope.$apply();
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalled();
            expect(discoverStateSvc.datasetRecords).toEqual([datasetRecord]);
        });
        it('when getDatasetRecords is rejected', function() {
            datasetManagerSvc.getDatasetRecords.and.returnValue($q.reject('error'));
            discoverStateSvc.setDatasetRecords();
            scope.$apply();
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalled();
            expect(util.createErrorToast).toHaveBeenCalledWith('error');
        });
    });
});
