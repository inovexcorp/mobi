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
import { hasClass } from "../../vendor/YASGUI/plugins/utils/yasguiUtil";




import { merge } from 'lodash';
import jsonLD from "../../vendor/YASGUI/plugins/jsonLD/jsonLD";

/**
 * @ngdoc service
 * @name shared.service:yasguiService
 * @requires shared.service:prefixes
 *
 */
yasguiService.$inject = ['REST_PREFIX'];

function yasguiService(REST_PREFIX) {
    const self = this;
    const defaultUrl : URL =  new URL(REST_PREFIX + 'sparql/page', document.location.origin);
    let hasInitialized = false
    let defaultType = 'jsonld'
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

    const getFormat = (type : string =  defaultType) => {
       const formatType =  {
           'turtle': 'turtle',
           'rdfXml': 'rdf/xml',
           'jsonLD': 'jsonld'
       }
       return formatType?.[type] || formatType.jsonLD;
    }

    const isPluginEnabled = (plugin) => {
        let pluginElement = document.querySelector(`.select_${plugin}`);
        if(pluginElement) {
            return !hasClass(pluginElement, 'disabled');
        } else {
            return false;
        }
    }
    const getSelectedUrlFormat =  () => getFormat(self.yasgui.getTab().yasr.selectedPlugin);

    const getEndpointURL= () => {
        let format = getSelectedUrlFormat();
        let url = getUrl(format);
       return url;
    }

    const setRequestConfigURL = (url) => {
        self.yasgui.getTab().setRequestConfig({
            endpoint: url
        });
    }

    const getUrl = (format: string = defaultType) => {
        const searchValue = 'returnFormat';
        if (!defaultUrl.searchParams.has(searchValue)) {
            defaultUrl.searchParams.append(searchValue, format)
        } else {
            defaultUrl.searchParams.set(searchValue, format)
        }

        return defaultUrl.href;
    }

    const refreshPluginData = () => {
        let selectedPlugin = self.yasgui.getTab().yasr.selectedPlugin;
        if (self.yasgui.getTab().yasr.drawnPlugin && selectedPlugin) {
            setRequestConfigURL(getEndpointURL());
            //@todo dont query if plugin doesnt support result type.
            self.submitQuery();
        }
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
