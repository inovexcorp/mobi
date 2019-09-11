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
     * @name ontology-editor.component:selectedDetails
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:ontologyStateService
     * @requires ontology-editor.service:ontologyUtilsManagerService
     * @requires shared.service:manchesterConverterService
     * @requires shared.service:modalService
     *
     * @description
     * `classesTab` is a component that creates div with detailed about the currently selected entity in the active page
     * of the current {@link shared.service:ontologyStateService selected ontology}. This includes the entity's name, a
     * {@link ontology-editor.component:staticIri}, and a display of the types of the entity along with a button to
     * {@link ontology-editor.component:individualTypesModal edit the individual types}. The display is optionally
     * `readOnly` and can optionally highlight text in the `staticIri` matching the provided `highlightText`.
     * 
     * @param {boolean} readOnly Whether the display should be read only
     * @param {string} highlightText Optional text to pass along to the `staticIri` for highlighting
     */
    const selectedDetailsComponent = {
        templateUrl: 'ontology-editor/components/selectedDetails/selectedDetails.component.html',
        bindings: {
            readOnly: '<',
            highlightText: '<'
        },
        controllerAs: 'dvm',
        controller: selectedDetailsComponentCtrl
    };

    selectedDetailsComponentCtrl.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'manchesterConverterService', 'modalService'];

    function selectedDetailsComponentCtrl($filter, ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, manchesterConverterService, modalService) {
        var dvm = this;
        var mc = manchesterConverterService;
        var ontoUtils = ontologyUtilsManagerService;
        dvm.os = ontologyStateService;
        dvm.om = ontologyManagerService;

        dvm.getTypes = function() {
            return _.join(_.orderBy(
                    _.map(_.get(dvm.os.listItem.selected, '@type', []), t => { 
                        if (dvm.om.isBlankNodeId(t)) {
                            return mc.jsonldToManchester(t, dvm.os.listItem.ontology);
                        } else {
                            return $filter('prefixation')(t);
                        }
                    })
            ), ', ');
        }
        dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
            dvm.os.onEdit(iriBegin, iriThen, iriEnd)
                .then(() => {
                    ontoUtils.saveCurrentChanges();
                    ontoUtils.updateLabel();
                });
        }
        dvm.showTypesOverlay = function() {
            modalService.openModal('individualTypesModal');
        }
    }

    angular.module('ontology-editor')
        .component('selectedDetails', selectedDetailsComponent);
})();
