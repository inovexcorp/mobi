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
import './discoverQuery.component.scss';

const template = require('./discoverQuery.component.html');
/**
 * @ngdoc component
 * @name query.component:discoverQuery
 * @requires shared.service:yasguiService
 * @requires shared.service:discoverStateService
 *
 * @description
 * `discoveryQuery` is a component which creates a new instace of YASGUI plugin.
 * Stores YASQUE response
 * Updates YASR plugin with the data stored by discoverStateService
 */
const discoverQueryComponent = {
    template,
    controllerAs: 'dvm',
    controller: discoveryQueryComponentCtrl
};

discoveryQueryComponentCtrl.$inject = ['$element', '$document', 'yasguiService', 'discoverStateService'];

function discoveryQueryComponentCtrl($element, $document, yasguiService, discoverStateService) {
    let dvm = this;
    let yasgui:any = {};
    dvm.ds = discoverStateService;

    dvm.$onInit = function() {
        let wrapper_element = $element.querySelectorAll('.discover-query')[0];
        yasguiService.initYasgui(wrapper_element, {name: 'dicoverQuery'});
        dvm.yasgui = yasguiService.getYasgui();

        if (dvm.yasgui) {
            initEventListener();
            setValues();
            dvm.error = null;
        } else {
            dvm.error = `Something went wrong, try again in a few seconds or refresh the page"`;
        }
    }

    const initEventListener = () => {
        if (!(Object.prototype.hasOwnProperty.call(dvm.yasgui, 'rootEl') && dvm.yasgui.rootEl instanceof HTMLElement) ) {
            return;
        }
        // get YASGUI instance
        // cache Yasgui object
        yasgui = dvm.yasgui.getTab();
        yasgui.yasqe.on("blur", () => {
            dvm.ds.query.queryString = yasgui.yasqe.getValue();
        });

        yasgui.yasr.on("drawn", (yasr) => {
            dvm.ds.query.selectedPlugin = yasr.drawnPlugin;
        });

        yasgui.yasqe.on("queryResponse", (instance, response: any, duration: number) => {
            dvm.ds.query.response = response;
            dvm.ds.query.executionTime = duration;
        });
    }

    const setValues = () => {
        if (!Object.prototype.hasOwnProperty.call(dvm.yasgui, 'setValue')) {
            return;
        }

        let yasqueVaue = dvm.ds.query.queryString || dvm.yasgui.yasqe.config.value;
        dvm.yasgui.yasqe.setValue(yasqueVaue);
        let isResponseEmpty = Object.keys(dvm.ds.query.response).length === 0;
        if (!isResponseEmpty) {
            dvm.yasgui.yasr.setResponse(dvm.ds.query.response, dvm.ds.query.executionTime) ;
            yasguiService.handleYasrContainer();
        }
    }
}

export default discoverQueryComponent;