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
import { find, noop, get, map, isEmpty } from 'lodash';
import { RecordSelectFiltered } from '../../../shapes-graph-editor/models/recordSelectFiltered.interface';

const template = require('./openRecordButton.component.html');

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
 * @param {string} flat Whether the button should be flat. The presence of the attribute is enough to set it
 * @param {string} stopProp Whether propagation should be stopped on click event. The presence of the attribute is enough to set it
 */
const openRecordButtonComponent = {
    template,
    bindings: {
        record: '<',
        flat: '@',
        stopProp: '@'
    },
    controllerAs: 'dvm',
    controller: openRecordButtonComponentCtrl
};

openRecordButtonComponentCtrl.$inject = ['$state', 'catalogStateService', 'mapperStateService', 'ontologyStateService', 'policyEnforcementService', 'policyManagerService', 'utilService', 'prefixes', 'shapesGraphStateService'];

function openRecordButtonComponentCtrl($state, catalogStateService, mapperStateService, ontologyStateService, policyEnforcementService, policyManagerService, utilService, prefixes, shapesGraphStateService) {
    let dvm = this;
    let cs = catalogStateService;
    let ms = mapperStateService;
    let os = ontologyStateService;
    let pe = policyEnforcementService;
    let pm = policyManagerService;
    let util = utilService;
    let sgs = shapesGraphStateService;
    dvm.record = undefined;
    dvm.stopPropagation = false;
    dvm.recordType = '';
    dvm.isFlat = false;
    dvm.showButton = false;

    dvm.$onInit = function() {
        update();
    }
    dvm.$onChanges = function() {
        update();
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
            case prefixes.shapesGraphEditor + 'ShapesGraphRecord':
                dvm.openShapesGraph();
                break;
            default:
                util.createWarningToast('No module for record type ' + dvm.recordType);
        }
    }
    dvm.openOntology = function() {
        $state.go('root.ontology-editor');
        if (!isEmpty(os.listItem)) {
            os.listItem.active = false;
        }
        var listItem = find(os.list, {ontologyRecord: {recordId: dvm.record['@id']}});
        if (listItem) {
            os.listItem = listItem;
            os.listItem.active = true;
        } else {
            os.openOntology(dvm.record['@id'], util.getDctermsValue(dvm.record, 'title'))
                .then(noop, util.createErrorToast);
        }
    }
    dvm.openMapping = function() {
        var formattedRecord = {
            id: dvm.record['@id'],
            title: util.getDctermsValue(dvm.record, 'title'),
            description: util.getDctermsValue(dvm.record, 'description'),
            keywords: map(get(dvm.record, "['" + prefixes.catalog + "keyword']", []), '@value'),
            branch: util.getPropertyId(dvm.record, prefixes.catalog + 'masterBranch')
        };
        $state.go('root.mapper');
        ms.selectMapping(formattedRecord);
    }
    dvm.openDataset = function() {
        $state.go('root.datasets');
    }
    dvm.openShapesGraph = function() {
        const recordSelect: RecordSelectFiltered = {
            recordId: dvm.record['@id'],
            title: util.getDctermsValue(dvm.record, 'title'),
            description: util.getDctermsValue(dvm.record, 'description')
        };
        $state.go('root.shapes-graph-editor');
        sgs.openShapesGraph(recordSelect).then(noop, util.createErrorToast);
    }
    function update() {
        dvm.isFlat = dvm.flat !== undefined;
        dvm.stopPropagation = dvm.stopProp !== undefined;
        dvm.recordType = cs.getRecordType(dvm.record);

        if (dvm.recordType === prefixes.ontologyEditor + 'OntologyRecord') {
            var request = {
                resourceId: dvm.record['@id'],
                actionId: pm.actionRead
            };
            pe.evaluateRequest(request).then(decision => {
                dvm.showButton = decision !== pe.deny;
            });
        } else {
            dvm.showButton = true;
        }
    }
}

export default openRecordButtonComponent;
