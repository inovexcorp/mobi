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
import './queryTab.component.scss';

const template = require('./queryTab.component.html');

/**
 * @ngdoc component
 * @name query.component:queryTab
 * @requires shared.service:sparqlManagerService
 * @requires shared.service:prefixes
 * @requires shared.service:discoverStateService
 *
 * @description
 * `queryTab` is a component that provides a form for submitting and viewing the results of SPARQL queries against the
 * system repo or a {@link discover.component:datasetFormGroup selected dataset}. The query editor and results are
 * displayed via a YASGUI instance tied to the {@link shared.service:discoverStateService}.
 */
const queryTabComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: queryTabComponentCtrl
};

queryTabComponentCtrl.$inject = ['$element', 'sparqlManagerService', 'yasguiService', 'discoverStateService'];

function queryTabComponentCtrl($element, sparqlManagerService, yasguiService, discoverStateService) {
    var dvm = this;
    var tab:any = {};
    dvm.sparql = sparqlManagerService;
    dvm.yasgui = yasguiService;
    dvm.ds = discoverStateService;

    dvm.$onInit = function() {
        let wrapper_element = $element.querySelectorAll('.discover-query')[0];
        dvm.yasgui.initYasgui(wrapper_element, {name: 'discoverQuery'});
        let yasgui = dvm.yasgui.getYasgui();
       
        if (yasgui && yasgui.getTab) {
            tab = yasgui.getTab();
            initEventListener();
            setValues();
            dvm.error = null;
        } else {
            dvm.error = `Something went wrong, try again in a few seconds or refresh the page"`;
        }
    }

    const isYasguiElementDrawn = () => {
        return !(Object.prototype.hasOwnProperty.call(tab, 'rootEl') && tab.rootEl instanceof HTMLElement);
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

export default queryTabComponent;