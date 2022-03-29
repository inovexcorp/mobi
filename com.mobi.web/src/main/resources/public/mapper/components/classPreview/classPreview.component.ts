/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import * as angular from 'angular';
import { has, isEqual, map } from 'lodash';

import './classPreview.component.scss';

const template = require('./classPreview.component.html');

/**
 * @ngdoc component
 * @name mapper.component:classPreview
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:mapperStateService
 *
 * @description
 * `classPreview` is a component that creates a div with a brief description of the passed class and its properties.
 * It displays the name of the class, its IRI, its description, and the list of its properties.
 *
 * @param {Object} classObj the class object from an ontology to preview
 * @param {Object[]} ontologies A list of ontologies containing the class and to pull properties
 * from.
 */
const classPreviewComponent = {
    template,
    bindings: {
        classObj: '<',
        ontologies: '<'
    },
    controllerAs: 'dvm',
    controller: classPreviewComponentCtrl
};

classPreviewComponentCtrl.$inject = ['mapperStateService', 'ontologyManagerService'];

function classPreviewComponentCtrl(mapperStateService, ontologyManagerService) {
    const dvm = this;
    dvm.om = ontologyManagerService;
    dvm.state = mapperStateService;
    dvm.name = '';
    dvm.description = '';
    dvm.props = [];
    dvm.total = 0;

    dvm.$onChanges = function(changesObj) {
        if (has(changesObj, 'classObj')) {
            const obj = changesObj.classObj.currentValue;
            dvm.name = obj.name ? obj.name : dvm.om.getEntityName(obj);
            dvm.description = obj.description ? obj.description : dvm.om.getEntityDescription(obj) || '(None Specified)';
            let props = dvm.state.getClassProps(dvm.ontologies, obj['@id']);
            if (!isEqual(changesObj.classObj.currentValue, changesObj.classObj.previousValue)) {
                dvm.total = props.length;
                dvm.props = map(props.slice(0, 10), originalProp => {
                    var prop = angular.copy(originalProp);
                    prop.name = dvm.om.getEntityName(prop.propObj);
                    prop.isDeprecated = dvm.om.isDeprecated(prop.propObj);
                    return prop;
                });
            }
        }
    }
}

export default classPreviewComponent;
