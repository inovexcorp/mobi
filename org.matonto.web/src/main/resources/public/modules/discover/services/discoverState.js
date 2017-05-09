/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        .module('discoverState', [])
        .service('discoverStateService', discoverStateService);
    
    discoverStateService.$inject = ['datasetManagerService', 'prefixes'];
    
    function discoverStateService(datasetManagerService, prefixes) {
        var self = this;
        var dam = datasetManagerService;
        
        self.explore = {
            active: true
        };
        
        self.query = {
            active: false
        };
        
        self.datasetRecords = [];
        
        dam.getDatasetRecords()
            .then(response => {
                self.datasetRecords = _.map(response.data, arr => _.find(arr, obj => _.includes(obj['@type'], prefixes.dataset + 'DatasetRecord')));
            }, () => self.util.createErrorToast('Error retrieving datasets'));
    }
})();