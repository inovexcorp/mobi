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
import './queryTab.component.scss';

const template = require('./queryTab.component.html');

/**
 * @ngdoc component
 * @name query.component:queryTab
 * @requires shared.service:sparqlManagerService
 * @requires shared.service:prefixes
 *
 * @description
 * `queryTab` is a component that provides a form for submitting and viewing the results of SPARQL queries against the
 * system repo or a {@link discover.component:datasetFormGroup selected dataset}. The query editor and results are
 * displayed via {@link query.component:discoverQuery}.
 */
const queryTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: queryTabComponentCtrl
};

queryTabComponentCtrl.$inject = ['sparqlManagerService', 'yasguiService'];

function queryTabComponentCtrl(sparqlManagerService, yasguiService) {
    var dvm = this;
    dvm.sparql = sparqlManagerService;
    dvm.yasgui = yasguiService;
}

export default queryTabComponent;