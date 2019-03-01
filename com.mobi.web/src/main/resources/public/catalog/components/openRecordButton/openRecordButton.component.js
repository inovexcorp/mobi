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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:openRecordButton
     * @requires shared.service:catalogManagerService
     * @requires shared.service:catalogStateService
     * @requires shared.service:mappingManagerService
     * @requires shared.service:mapperStateService
     * @requires shared.service:ontologyStateService
     * @requires shared.service:policyEnforcementService
     * @requires shared.service:policyManagerService
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `openRecordButton` is a component which creates an Open Record button that will open the provided record in the
     * appropriate module.
     * 
     * @param {Object} record The record to open
     */
    const openRecordButtonComponent = {
        templateUrl: 'catalog/components/openRecordButton/openRecordButton.component.html',
        bindings: {
            record: '<',
            stopProp: '@'
        },
        controllerAs: 'dvm',
        controller: openRecordButtonComponentCtrl
    };

    openRecordButtonComponentCtrl.$inject = ['$state', 'catalogManagerService', 'catalogStateService', 'mappingManagerService', 'mapperStateService', 'ontologyStateService', 'policyEnforcementService', 'policyManagerService', 'utilService', 'prefixes'];

    function openRecordButtonComponentCtrl($state, catalogManagerService, catalogStateService, mappingManagerService, mapperStateService, ontologyStateService, policyEnforcementService, policyManagerService, utilService, prefixes) {
        var dvm = this;
        var cs = catalogStateService;
        var cm = catalogManagerService;
        var mm = mappingManagerService;
        var ms = mapperStateService;
        var os = ontologyStateService;
        var pe = policyEnforcementService;
        var pm = policyManagerService;
        var util = utilService;
        dvm.record = undefined;
        dvm.stopPropagation = false;
        dvm.recordType = '';
        dvm.showButton = true;

        dvm.$onInit = function() {
            console.log('here')
            dvm.stopPropagation = dvm.stopProp !== undefined;
            dvm.recordType = cs.getRecordType(dvm.record);

            if (dvm.record && dvm.recordType === prefixes.ontologyEditor + 'OntologyRecord') {
                var request = {
                    resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(dvm.record['@id']),
                    actionId: pm.actionRead
                };
                pe.evaluateRequest(request).then(decision => {
                    dvm.showButton = dvm.recordType !== prefixes.catalog + 'Record' && decision !== pe.deny;
                });
            }
        }
        dvm.$onChanges = function() {
            dvm.stopPropagation = dvm.stopProp !== undefined;
            dvm.recordType = cs.getRecordType(dvm.record);

            if (dvm.record && dvm.recordType === prefixes.ontologyEditor + 'OntologyRecord') {
                var request = {
                    resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(dvm.record['@id']),
                    actionId: pm.actionRead
                };
                pe.evaluateRequest(request).then(decision => {
                    dvm.showButton = dvm.recordType !== prefixes.catalog + 'Record' && decision !== pe.deny;
                });
            }
        }
        dvm.openRecord = function(event) {
            if (dvm.stopPropagation) {
                event.stopPropagation();
            }
            switch (dvm.recordType) {
                case prefixes.ontologyEditor + 'OntologyRecord':
                    dvm.openOntology();
                    break;
                case prefixes.delim + 'MappingRecord':
                    dvm.openMapping();
                    break;
                case prefixes.dataset + 'DatasetRecord':
                    dvm.openDataset();
                    break;
                default:
            }
        }
        dvm.openOntology = function() {
            $state.go('root.ontology-editor');
            if (!_.isEmpty(os.listItem)) {
                os.listItem.active = false;
            }
            var listItem = _.find(os.list, {ontologyRecord: {recordId: dvm.record['@id']}});
            if (listItem) {
                os.listItem = listItem;
                os.listItem.active = true;
            } else {
                os.openOntology(dvm.record['@id'], util.getDctermsValue(dvm.record, 'title'))
                    .then(_.noop, util.createErrorToast);
            }
        }
        dvm.openMapping = function() {
            $state.go('root.mapper');
            mm.getMapping(dvm.record['@id'])
                .then(jsonld => {
                    var formattedRecord = {
                        id: dvm.record['@id'],
                        title: util.getDctermsValue(dvm.record, 'title'),
                        description: util.getDctermsValue(dvm.record, 'description'),
                        keywords: _.map(_.get(dvm.record, "['" + prefixes.catalog + "keyword']", []), '@value'),
                        branch: util.getPropertyId(dvm.record, prefixes.catalog + 'masterBranch')
                    };
                    var mapping = {
                        jsonld,
                        record: formattedRecord,
                        difference: {
                            additions: [],
                            deletions: []
                        }
                    };
                    ms.mapping = mapping;
                    return cm.getRecord(_.get(mm.getSourceOntologyInfo(jsonld), 'recordId'), cm.localCatalog['@id']);
                }, () => $q.reject('Mapping ' + util.getDctermsValue(dvm.record, 'title') + ' could not be found'))
                .then(ontologyRecord => {
                    ms.mapping.ontology = ontologyRecord;
                }, errorMessage => util.createErrorToast(_.startsWith(errorMessage, 'Mapping') ? errorMessage : 'Ontology could not be found'));
            
        }
        dvm.openDataset = function() {
            $state.go('root.datasets');
        }
    }

    angular.module('catalog')
        .component('openRecordButton', openRecordButtonComponent);
})();
