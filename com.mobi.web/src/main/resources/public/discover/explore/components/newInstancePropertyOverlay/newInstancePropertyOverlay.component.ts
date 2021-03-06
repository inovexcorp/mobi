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

const template = require('./newInstancePropertyOverlay.component.html');

/**
 * @ngdoc component
 * @name explore.component:newInstancePropertyOverlay
 * @requires shared.service:utilService
 * @requires explore.service:exploreUtilsService
 *
 * @description
 * `newInstancePropertyOverlay` is a component that creates contents for a modal that adds a property to the
 * provided instance from the provided list of properties. The modal contains a dropdown list of the properties
 * that is searchable. When submitted, the modal passes back the IRI of the added property. Meant to be used in
 * conjunction with the {@link shared.service:modalService}.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 * @param {Object} resolve An object with data provided to the modal
 * @param {Object[]} resolve.properties The list of properties to select from
 * @param {Object} resolve.instance The instance to add the property to.
 */
const newInstancePropertyOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controllerAs: 'dvm',
    controller: newInstancePropertyOverlayComponentCtrl
};

newInstancePropertyOverlayComponentCtrl.$inject = ['$timeout', 'utilService', 'exploreUtilsService'];

function newInstancePropertyOverlayComponentCtrl($timeout, utilService, exploreUtilsService) {
    var dvm = this;
    var eu = exploreUtilsService;
    dvm.util = utilService;
    dvm.propertyIRI = '';

    dvm.$onInit = function() {
        $timeout(function() {
            var el = document.querySelector('#auto-complete');
            if (el instanceof HTMLElement) {
                el.focus();
            }
        }, 200);
    }
    dvm.getProperties = function() {
        return eu.getNewProperties(dvm.resolve.properties, dvm.resolve.instance, dvm.propertyIRI);
    }
    dvm.submit = function() {
        dvm.resolve.instance[dvm.propertyIRI] = [];
        dvm.close({'$value': dvm.propertyIRI});
    }
    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default newInstancePropertyOverlayComponent;