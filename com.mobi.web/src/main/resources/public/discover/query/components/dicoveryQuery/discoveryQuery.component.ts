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
import '../../../../shared/components/yasgui/yasgui.component.scss';
import './discoveryQuery.component.scss';
/**
 * @ngdoc component
 * @name shared.component:yasgui
 *
 */
const template = require('./discoveryQuery.component.html');
const discoveryQueryComponent = {
    template,
    controllerAs: 'dvm',
    controller: queryController
};

queryController.$inject = ['yasguiService', 'discoverStateService'];

function queryController(yasguiService, discoverStateService) {
    let dvm = this;
    let yasgui:any = {};
    dvm.ds = discoverStateService;
    
    const initEventListener = () => {
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
        let yasqueVaue = dvm.ds.query.queryString || yasgui.yasqe.config.value;
        yasgui.yasqe.setValue(yasqueVaue);
        let isResponseEmpty = Object.keys(dvm.ds.query.response).length === 0;
        if(!isResponseEmpty) {
            yasgui.yasr.setResponse(dvm.ds.query.response, dvm.ds.query.executionTime) ;
            yasguiService.handleYasrContainer();
        }
    }
   
    dvm.$onInit = function() {
        let wrapper_element = document.getElementsByClassName('yasgui-editor')[0];
        dvm.yasgui = yasguiService.initYasgui(wrapper_element, {name: 'dicoveryQuery'});
        yasgui = dvm.yasgui;
        if (dvm.yasgui) {
            initEventListener();
            setValues();
        } else {
            throw 'Error: Yasgui service has not been initialized!';
        }
        
    }
}

export default discoveryQueryComponent;