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
import * as angular from 'angular';

import './previewBlock.component.scss';

const template = require('./previewBlock.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:previewBlock
 * @requires shared.service:ontologyStateService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:modalService
 *
 * @description
 * `previewBlock` is a component that creates a {@link shared.component:block} that displays a `codemirror` with
 * the current {@link shared.service:ontologyStateService selected ontology} in a specified RDF format.
 * The `block` contains a {@link ontology-editor.component:serializationSelect}, button to refresh the
 * preview, and a button for downloading the ontology in the selected format.
 */
const previewBlockComponent = {
    template,
    bindings: {
        activePage: '<',
        changeEvent: '&'
    },
    controllerAs: 'dvm',
    controller: previewBlockComponentCtrl
};

previewBlockComponentCtrl.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService'];

function previewBlockComponentCtrl($filter, ontologyStateService, ontologyManagerService) {
    var dvm = this;
    var om = ontologyManagerService;
    dvm.os = ontologyStateService;
    dvm.options = {
        mode: '',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true
    };

    dvm.$onChanges = function() {
        dvm.options.mode = dvm.activePage.mode;            
    }
    dvm.getPreview = function() {
        setMode(dvm.activePage.serialization);
        om.getOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.activePage.serialization, false, true)
            .then(ontology => {
                dvm.activePage.preview = (dvm.activePage.serialization === 'jsonld' ? $filter('json')(ontology) : ontology);
                dvm.changeEvent({value: dvm.activePage});
            }, response => {
                dvm.activePage.preview = response;
                dvm.changeEvent({value: dvm.activePage});
            });
    }
    dvm.download = function() {
        var fileName = $filter('splitIRI')(dvm.os.listItem.ontologyId).end;
        om.downloadOntology(dvm.os.listItem.ontologyRecord.recordId, dvm.os.listItem.ontologyRecord.branchId, dvm.os.listItem.ontologyRecord.commitId, dvm.activePage.serialization, fileName);
    }
    dvm.changeSerialization = function(value) {
        dvm.activePage.serialization = value;
        dvm.changeEvent({value: dvm.activePage});
    }

    function setMode(serialization) {
        if (serialization === 'turtle') {
            dvm.options.mode = 'text/turtle';
        } else if (serialization === 'jsonld') {
            dvm.options.mode = 'application/ld+json';
        } else {
            dvm.options.mode = 'application/xml';
        }
        dvm.activePage.mode = angular.copy(dvm.options.mode);
        dvm.changeEvent({value: dvm.activePage});
    }
}

export default previewBlockComponent;