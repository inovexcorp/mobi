(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name propertyValueOverlay
         *
         * @description
         * The `propertyValueOverlay` module only provides the `propertyValueOverlay` component which creates content
         * for a modal to display information about a property value on an instance.
         */
        .module('propertyValueOverlay', [])
        /**
         * @ngdoc component
         * @name propertyValueOverlay.component:propertyValueOverlay
         * @requires discoverState.service:discoverStateService
         * @requires prefixes.service:prefixes
         * @requires uuid.service:uuid
         * @requires util.service:utilService
         * @requires exploreUtilsService.service:exploreUtilsService
         * @requires modal.service:modalService
         *
         * @description
         * `propertyValueOverlay` is a component that creates content for a modal to view the value of the provided
         * property on the {@link discoverState.service:discoverStateService selected instance}. The modal allows you to
         * view all reified statements associated with the value and add new ones from the provided list using a
         * {@link newInstancePropertyOverlay.component:newInstancePropertyOverlay}. Meant to be used in conjunction with
         * the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         * @param {Object} resolve An object with data provided to the modal
         * @param {string} resolve.iri The IRI of the property
         * @param {number} resolve.index The index of the value being viewed from the property array on the instance
         * @param {Object[]} resolve.properties The list of properties to select from
         * @param {string} resolve.text The text of the propery value being viewed
         */
        .component('propertyValueOverlay', {
            bindings: {
                close: '&',
                dismiss: '&',
                resolve: '<'
            },
            controllerAs: 'dvm',
            controller: ['discoverStateService', 'prefixes', 'uuid', 'utilService', 'exploreUtilsService', 'modalService', PropertyValueOverlayController],
            templateUrl: 'discover/explore/directives/propertyValueOverlay/propertyValueOverlay.component.html'
        });

        function PropertyValueOverlayController(discoverStateService, prefixes, uuid, utilService, exploreUtilsService, modalService) {
            var dvm = this;
            var ds = discoverStateService;
            dvm.eu = exploreUtilsService;
            dvm.util = utilService;
            dvm.propertyText = '';

            dvm.$onInit = function() {
                var instance = ds.getInstance();
                dvm.object = angular.copy(_.get(_.get(instance, dvm.resolve.iri, []), dvm.resolve.index));
                dvm.ommitted = ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object'];

                dvm.reification = dvm.eu.getReification(ds.explore.instance.entity, instance['@id'], dvm.resolve.iri, dvm.object)
                    || {
                        '@id': dvm.util.getSkolemizedIRI(),
                        '@type': [prefixes.rdf + 'Statement'],
                        [prefixes.rdf + 'subject']: [{'@id': instance['@id']}],
                        [prefixes.rdf + 'predicate']: [{'@id': dvm.resolve.iri}],
                        [prefixes.rdf + 'object']: [dvm.object]
                    };
            }
            dvm.showReifiedPropertyOverlay = function() {
                modalService.openModal('newInstancePropertyOverlay', {properties: dvm.resolve.properties, instance: dvm.reification}, dvm.addToChanged);
            }
            dvm.notOmmitted = function(propertyIRI) {
                return !_.includes(dvm.ommitted, propertyIRI);
            }
            dvm.submit = function() {
                _.forOwn(dvm.reification, (value, key) => {
                    if (_.isArray(value) && value.length === 0) {
                        delete dvm.reification[key];
                    }
                });
                if (!_.some(ds.explore.instance.entity, {'@id': dvm.reification['@id']})) {
                    ds.explore.instance.entity.push(dvm.reification);
                }
                dvm.close({'$value': dvm.resolve.iri});
            }
            dvm.addToChanged = function(propertyIRI) {
                dvm.changed = _.uniq(_.concat(dvm.changed, [propertyIRI]));
            }
            dvm.isChanged = function(propertyIRI) {
                return _.includes(dvm.changed, propertyIRI);
            }
            dvm.cancel = function() {
                dvm.dismiss();
            }
        }
})();