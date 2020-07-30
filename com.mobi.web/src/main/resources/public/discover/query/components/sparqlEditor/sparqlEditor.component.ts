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
import { sortBy, map } from 'lodash';
import './sparqlEditor.component.scss';

const template = require('./sparqlEditor.component.html');

/**
 * @ngdoc component
 * @name query.component:sparqlEditor
 * @requires shared.service:sparqlManagerService
 * @requires shared.service:prefixes
 *
 * @description
 * `sparqlEditor` is a component that creates a {@link shared.component:block block} with a form for creating
 * a {@link shared.service:sparqlManagerService#queryString SPARQL query}, selecting
 * {@link shared.service:sparqlManagerService#prefixes prefixes} and a
 * {@link shared.service:sparqlManagerService#datasetRecordIRI dataset} and submitting it.
 */
const sparqlEditorComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: sparqlEditorComponentCtrl
};

sparqlEditorComponentCtrl.$inject = ['sparqlManagerService', 'prefixes', 'yasguiService','discoverStateService', '$element'];

function sparqlEditorComponentCtrl(sparqlManagerService, prefixes, yasguiService, discoverStateService,  $element) {
    var dvm = this;
    var tab:any = {};
    dvm.sparql = sparqlManagerService;
    dvm.yasgui = yasguiService;
    dvm.prefixList = [];
    dvm.ds = discoverStateService;
    dvm.editorOptions = {
        mode: 'application/sparql-query',
        indentUnit: 4,
        tabMode: 'indent',
        lineNumbers: true,
        lineWrapping: true,
        matchBrackets: true
    }

    dvm.$onInit = function() {
        dvm.prefixList = sortBy(map(prefixes, (value, key) => key + ': <' + value + '>'));
        let wrapper_element = $element.querySelectorAll('.discover-query')[0];
        yasguiService.initYasgui(wrapper_element, {name: 'dicoverQuery'});
        let yasgui = yasguiService.getYasgui();
       
        if (yasgui && yasgui.getTab) {
            setTab(yasgui.getTab());
            initEventListener();
            setValues();
            dvm.error = null;
        } else {
            dvm.error = `Something went wrong, try again in a few seconds or refresh the page"`;
        }
    }

    const isYasguiElementDrawn = () => {
        if (!(Object.prototype.hasOwnProperty.call(tab, 'rootEl') && tab.rootEl instanceof HTMLElement)) {
            return false;
        }
        return true;
    }
    const setTab = (t) => {
        tab = t;
    }
    const initEventListener = () => {
        if (!isYasguiElementDrawn() ) {
            return;
        }
        // get YASGUI instance
        // cache Yasgui object
        tab.yasqe.on("blur", () => {
            dvm.ds.query.queryString = tab.yasqe.getValue();
        });

        tab.yasr.on("drawn", (yasr) => {
            dvm.ds.query.selectedPlugin = yasr.drawnPlugin;
        });

        tab.yasqe.on('queryResponse', (instance, response: any, duration: number) => {
            dvm.ds.query.response = response;
            dvm.ds.query.executionTime = duration;
        });
    }

    const setValues = () => {
        if (Object.prototype.hasOwnProperty.call(tab, 'setValue')) {
            let yasqueValue = dvm.ds.query.queryString || tab.yasqe.config.value;
            tab.yasqe.setValue(yasqueValue);
        }
        
        let isResponseEmpty = Object.keys(dvm.ds.query.response).length === 0;
        if (!isResponseEmpty) {
            tab.yasr.setResponse(dvm.ds.query.response, dvm.ds.query.executionTime) ;
            yasguiService.handleYasrContainer();
        }
    }
}

export default sparqlEditorComponent;