/*-
 * #%L
 * com.mobi.web
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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:entityPublisher
     * @requires userManager.service:userManagerService
     * @requires utilService.service:utilService
     *
     * @description
     * `entityPublisher` is a component which creates a span with a display of a JSON-LD object's dcterms:publisher
     * property value. Retrieves the username of the publisher using the {@link userManager.service:userManagerService}.
     *
     * @param {Object} entity A JSON-LD object
     */
    const entityPublisherComponent = {
        templateUrl: 'modules/catalog/components/entityPublisher/entityPublisher.component.html',
        bindings: {
            entity: '<'
        },
        controllerAs: 'dvm',
        controller: entityPublisherComponentCtrl
    };

    entityPublisherComponentCtrl.$inject = ['userManagerService', 'utilService'];

    function entityPublisherComponentCtrl(userManagerService, utilService) {
        var dvm = this;
        var util = utilService;
        var um = userManagerService;
        dvm.publisherName = '';

        dvm.$onInit = function() {
            dvm.publisherName = getPublisherName();
        }
        dvm.$onChanges = function() {
            dvm.publisherName = getPublisherName();
        }

        function getPublisherName() {
            var publisherId = util.getDctermsId(dvm.entity, 'publisher');
            return publisherId ? _.get(_.find(um.users, {iri: publisherId}), 'username', '(None)') : '(None)';
        }
    }

    angular.module('catalog')
        .component('entityPublisher', entityPublisherComponent);
})();
