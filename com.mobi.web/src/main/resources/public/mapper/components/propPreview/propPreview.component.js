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
     * @name mapper.component:propPreview
     * @requires $filter
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `propPreview` is a component that creates a div with a brief description of the passed property and its range. It
     * displays the name of the property, its IRI, its description, and its range datatype or class.
     *
     * @param {Object} propObj the property object from an ontology to preview
     * @param {Object[]} ontologies A list of ontologies containing the property and to pull the range class from
     */
    const propPreviewComponent = {
        templateUrl: 'mapper/components/propPreview/propPreview.component.html',
        bindings: {
            propObj: '<',
            ontologies: '<'
        },
        controllerAs: 'dvm',
        controller: propPreviewComponentCtrl
    };

    propPreviewComponentCtrl.$inject = ['$filter', 'ontologyManagerService', 'mapperStateService', 'utilService', 'prefixes'];

    function propPreviewComponentCtrl($filter, ontologyManagerService, mapperStateService, utilService, prefixes) {
        var dvm = this;
        var util = utilService;
        var state = mapperStateService;
        dvm.om = ontologyManagerService;
        dvm.name = '';
        dvm.rangeId = '';
        dvm.rangeName = '';
        dvm.rangeIsDeprecated = false;

        dvm.$onChanges = function(changesObj) {
            if (_.has(changesObj, 'propObj')) {
                dvm.name = dvm.om.getEntityName(changesObj.propObj.currentValue);
                dvm.description = dvm.om.getEntityDescription(changesObj.propObj.currentValue) || '(None Specified)';
                var newRangeId = util.getPropertyId(changesObj.propObj.currentValue, prefixes.rdfs + 'range');
                if (dvm.om.isObjectProperty(changesObj.propObj.currentValue)) {
                    if (newRangeId !== dvm.rangeId) {
                        var availableClass = _.find(state.availableClasses, {classObj: {'@id': newRangeId}});
                        dvm.rangeName = dvm.om.getEntityName(availableClass.classObj);
                        dvm.rangeIsDeprecated = dvm.om.isDeprecated(availableClass.classObj);
                    }
                } else {
                    dvm.rangeName = $filter('splitIRI')(newRangeId).end || 'string';
                    dvm.rangeIsDeprecated = false;
                }
                dvm.rangeId = newRangeId;
            }
        }
    }

    angular.module('mapper')
        .component('propPreview', propPreviewComponent);
})();
