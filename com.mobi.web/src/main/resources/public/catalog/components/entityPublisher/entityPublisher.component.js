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
        templateUrl: 'catalog/components/entityPublisher/entityPublisher.component.html',
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
