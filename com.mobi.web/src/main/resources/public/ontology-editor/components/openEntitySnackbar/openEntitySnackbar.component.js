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
     * @name ontology-editor.component:openEntitySnackbar
     * @requires shared.service:ontologyStateService
     *
     * @description
     * `openEntitySnackbar` is a component that creates a snackbar that notifies the user that the new entity was created.
     * It also provides a button that will use the {@link shared.service:ontologyStateService} to open the appropriate tab
     * and scroll to the newly created entity.
     */
    const openEntitySnackbarComponent = {
        templateUrl: 'ontology-editor/components/openEntitySnackbar/openEntitySnackbar.component.html',
        bindings: {
            iri: '<'
        },
        controllerAs: 'dvm',
        controller: openEntitySnackbarComponentCtrl
    };

    openEntitySnackbarComponentCtrl.$inject = ['$timeout', 'ontologyStateService'];

    function openEntitySnackbarComponentCtrl($timeout, ontologyStateService) {
        var dvm = this;
        dvm.os = ontologyStateService;
        dvm.show = true;
        dvm.entityName = '';

        dvm.$onInit = function() {
            setShow();
            dvm.entityName = dvm.os.getEntityNameByIndex(dvm.iri);
        }

        dvm.openEntity = function() {
            dvm.os.goTo(dvm.iri);
            closeSnackbar();
        }

        function setShow() {
            dvm.show = true;
            $timeout(() => {
                closeSnackbar();
            }, 5500);
        }

        function closeSnackbar() {
            dvm.show = false;
            $timeout(() => {
                dvm.os.listItem.goTo.active = false;
                dvm.os.listItem.goTo.entityIRI = '';
            }, 500);
        }
    }
    
    angular.module('ontology-editor')
        .component('openEntitySnackbar', openEntitySnackbarComponent);
})();
