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
        /**
         * @ngdoc overview
         * @name discoverState
         *
         * @description
         * The `discoverState` module only provides the `discoverStateService` service which 
         * contains various variables to hold the state of the discover module along with some
         * utility functions for those variables.
         */
        .module('discoverState', [])
        /**
         * @ngdoc service
         * @name discoverState.service:discoverStateService
         *
         * @description
         * `discoverStateService` is a service which contains various variables to hold the
         * state of the discover module along with some utility functions for thos variables.
         */
        .service('discoverStateService', discoverStateService);
    
    function discoverStateService() {
        var self = this;
        
        self.explore = {
            active: true,
            breadcrumbs: ['Classes'],
            classDetails: [],
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            },
            recordId: ''
        };
        
        self.query = {
            active: false
        };
        
        self.resetPagedInstanceDetails = function() {
            self.explore.instanceDetails = {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            }
        }
    }
})();