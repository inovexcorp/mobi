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
import * as Yasgui from '@triply/yasgui/build/yasgui.min.js';
import * as YasrTurtlePlugin from '../../vendor/YASGUI/plugins/turtle/turtle';
import * as YasrRdfXmlPlugin from '../../vendor/YASGUI/plugins/rdfXml/rdfXml';
import * as YasrJsonLDlPlugin from '../../vendor/YASGUI/plugins/jsonLD/jsonLD';
import { addClass } from "../../vendor/YASGUI/plugins/utils/yasguiUtil";




import { merge } from 'lodash';

/**
 * @ngdoc service
 * @name shared.service:yasguiService
 * @requires shared.service:prefixes
 *
 */
yasguiService.$inject = ['REST_PREFIX'];

function yasguiService(REST_PREFIX) {
    const self = this;
    let hasInitialized = false
    const initPlugins = () => {
        //
        if (Yasgui.Yasr) {
            Yasgui.Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
            Yasgui.Yasr.registerPlugin("rdfXml", YasrRdfXmlPlugin.default as any);
            Yasgui.Yasr.registerPlugin("jsonLD", YasrJsonLDlPlugin.default as any);
        } else {
            if (window) {
                (window as any).Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
                (window as any).Yasr.registerPlugin("rdfXml", YasrRdfXmlPlugin.default as any);
                (window as any).Yasr.registerPlugin("jsonLD", YasrJsonLDlPlugin.default as any);
            }
        }
    }

    const initEvents = () => {
        self.yasgui.getTab().yasr.on('change',(e) => {
            refreshPluginData();
        });
    }

    const refreshPluginData = () => {
        if (self.yasgui.getTab().yasr.drawnPlugin && self.yasgui.getTab().yasr.selectedPlugin) {
            let config = {
                url: getUrl(),
                reqMethod: "GET",
                args: { returnFormat:  self.yasgui.getTab().yasr.drawnPlugin }

            }
            console.log('config', config);
            self.submitQuery(config)
        }
    }

    const getUrl = () => {
        const path = REST_PREFIX + 'sparql/page';
        const { href } = new URL(path, document.location.origin);
        return href;
    }

    const getDefaultConfig =  () => {
        return {
            requestConfig : {
                method: 'GET',
                endpoint: getUrl()
            },
            persistencyExpire: 0,
            populateFromUrl: false,
            copyEndpointOnNewTab: false
        };

    }

    self.initYasgui = (element, config = {}) => {
        const localConfig = getDefaultConfig();
        const configuration = merge({}, localConfig, config );
        // Init YASGUI
        initPlugins();
        self.yasgui = new Yasgui(element, configuration);
        hasInitialized = true;
        document.querySelector(`.select_response`).classList.add('hide');
        // Init UI events
        initEvents();
        return self.yasgui;
    }
    // fire a new query
    self.submitQuery  = (queryConfig = {}) => {
        if(hasInitialized) {
            self.yasgui.getTab().yasqe.query(queryConfig);
        } else {
            throw 'Yasgui has not ben inizialize!';
        }
    }
}

export default yasguiService;
