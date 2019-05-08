/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name query.component:queryTab
     *
     * @description
     * `queryTab` is a component that provides a {@link query.component:sparqlEditor} and a
     * {@link query.component:sparqlResultBlock} to edit SPARQL queries and display the results of the queries.
     */
    const queryTabComponent = {
        templateUrl: 'discover/query/components/queryTab/queryTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: queryTabComponentCtrl
    };

    function queryTabComponentCtrl() {
        var dvm = this;
    }

    angular.module('query')
        .component('queryTab', queryTabComponent);
})();