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

/**
 * @ngdoc service
 * @name shared.service:yasguiService
 * @requires shared.service:prefixes
 *
 */
yasguiService.$inject = ['REST_PREFIX','sparqlManagerService', 'modalService', '$location', 'discoverStateService', '$window', '$document'];

function yasguiService(REST_PREFIX, sparqlManagerService, modalService, $location, discoverStateService, $window, $document) {
    //@todo remove this log
    const self = this;
    const defaultUrl : URL = new URL(REST_PREFIX + 'sparql/limited-results', $window.location.origin);;
    let yasgui : any = {};
    let customURL = null;
    let dataset = '';
    let innerHeight = $window.innerHeight;
    let reponseLimitElement = <HTMLElement>{};
    let yasrContainerSelector = '.yasr .CodeMirror-scroll, .yasr .dataTables_wrapper ';
    let yasrRootElement : HTMLElement = <any>{};
    let yasqeRootElement : HTMLElement = <any>{};
    let timeoutResizeId = null;


    const initPlugins = () => {
        // register custom plugins
        if (Yasgui.Yasr) {
            Yasgui.Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
            Yasgui.Yasr.registerPlugin("rdfXml", YasrRdfXmlPlugin.default as any);
            Yasgui.Yasr.registerPlugin("jsonLD", YasrJsonLDlPlugin.default as any);
        } else {
            if ($window) {
                ($window as any).Yasr.registerPlugin("turtle", YasrTurtlePlugin.default as any);
                ($window as any).Yasr.registerPlugin("rdfXml", YasrRdfXmlPlugin.default as any);
                ($window as any).Yasr.registerPlugin("jsonLD", YasrJsonLDlPlugin.default as any);
            }
        }
        // set the order of the plugins
        Yasgui.Yasr.defaults.pluginOrder = [ "table", "turtle" , "rdfXml", "jsonLD"];
    }

    // Register event listeners
    const initEvents = () => {
        const tab =  yasgui.getTab();
        const formatType =  {
            'turtle': 'ttl',
            'rdfXml': 'rdf',
            'jsonLD': 'jsonld',
            'table': 'json'
        };

        tab.once("query",() => {
            handleYasrVisivility();
        });

        // update query string value on blur
        tab.yasqe.on("blur", () => {
            discoverStateService.query.queryString = tab.yasqe.getValue();
        });

        // update plugin data on tab change
        tab.yasr.on('change',(instance: Yasgui.Yasr, plugin: Plugin) => {
            if (isPluginEnabled(instance?.selectedPlugin)) {
                refreshPluginData();
            }
        });

        /**
         * Update yasr height 
         * display query limit message
         * overwrite download button functionality
         */
        tab.yasr.once("drawn",(instance: Yasgui.yasr, plugin: Plugin) => {

            drawResponseLimitMessage(instance.headerEl);
            // dont show table plugin as selected if it cant handled the results
            if (!instance.plugins['table'].canHandleResults() && instance.drawnPlugin !== 'table') {
                tab.yasr.draw();
            }

           if (!instance.results.error) {
                // Display modal
                let downloadIcon = yasrRootElement.querySelector('.yasr_downloadIcon');
                if (!downloadIcon) {
                    return;
                }
                downloadIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    sparqlManagerService.queryString = tab.yasqe.getQueryWithValues();
                    const queryType = tab.yasqe.getQueryType()?.toLowerCase();
                    modalService.openModal('downloadQueryOverlay', {queryType}, undefined, 'sm');
                });
           }
         
        });

        // update yasr codemirror height
        // update yasr header: response limit message
        tab.yasr.on("drawn",({ results }) => {
            let limit = (results.res && results.res.headers['x-limit-exceeded']) ? results.res.headers['x-limit-exceeded'] : 0;
            let yasrCodeMirrorElement = <HTMLElement>yasrRootElement.querySelector(yasrContainerSelector);
          
            updateResponseLimitMessage(limit);

            if (tab.yasr.drawnPlugin === 'table') {
                tab.yasr.plugins['table'].dataTable.column().visible(false);
            }

            if (tab.yasr.getSelectedPluginName() !== tab.yasr.drawnPlugin) {
                tab.yasr.selectPlugin(tab.yasr.drawnPlugin);
            }
        });
    }

    // Get container height 
    const getYasContainerHeight = () =>  {
        let tabSet = document.querySelector('.material-tabset-headings');
        let yasr = yasgui.getTab().getYasr();
        if(window.hasOwnProperty('CodeMirror')) {
            let plugin = yasr.selectedPlugin || yasr.drawnPlugin;
            console.log(yasr.plugins[plugin]);
            //yasr.plugins[plugin].refresh();
        }
        if (yasqeRootElement instanceof HTMLElement && tabSet) {
            let style  = `auto`;
            return style;
        }
        return 'auto';
    }

    const drawResponseLimitMessage = (headerElement) => {
        reponseLimitElement = document.createElement('div');
        reponseLimitElement.classList.add('yasr_response_limit');
        headerElement.insertBefore(reponseLimitElement, headerElement.querySelector('.yasr_response_chip').nextSibling)
    }

    const updateResponseLimitMessage = (limit = 0) => {
        let className = 'hide';
        if (limit) {
            reponseLimitElement.classList.remove(className);
            if (!reponseLimitElement.innerText) {
                reponseLimitElement.innerText = `Warning: Query Results exceeded the limit of ${limit} rows/triples`;
            }
        } else {
            reponseLimitElement.classList.add(className)
        }
    }

    const getFormat = (type) => {
        let format = type || yasgui.getTab().yasr.config.defaultPlugin;
        const formatType =  {
           'turtle': 'text/turtle',
           'rdfXml': 'application/rdf+xml',
           'jsonLD': 'application/ld+json',
           'table': 'application/json'
        }
        return formatType?.[format] || formatType.jsonLD;
    }

    const isPluginEnabled = (plugin) => {
        let pluginElement = document.querySelector(`.select_${plugin}`);
        if (pluginElement) {
            return !hasClass(pluginElement, 'disabled');
        } else {
            return false;
        }
    }

    // update yasr request configuration
    const setRequestConfig = () => {
        let url =  customURL || getUrl();
        const { headers } = yasgui.getTab().getRequestConfig();
        headers.Accept = getFormat(yasgui.getTab().yasr.selectedPlugin);
        yasgui.getTab().setRequestConfig({
            endpoint: url, 
            headers: headers
        });
    }

    const getUrl = (datSetUri = dataset) => {
        const searchValue = 'dataset';
        if (datSetUri) {
            if (!defaultUrl.searchParams.has(searchValue)) {
                defaultUrl.searchParams.append(searchValue, datSetUri)
            } else {
                defaultUrl.searchParams.set(searchValue, datSetUri)
            }
        } else  {
            if (defaultUrl.searchParams.has(searchValue)) {
                defaultUrl.searchParams.delete(searchValue)
            }
        }
        return defaultUrl.href;
    }

    const refreshPluginData = () => {
        let yasr = yasgui.getTab().yasr;
        if (yasr.drawnPlugin && yasr.selectedPlugin) {
            self.submitQuery();
        }
    }

    const getDefaultConfig =  () => {
        return {
            requestConfig : {
                method: 'GET',
                endpoint: getUrl()
            },
            populateFromUrl: false,
            copyEndpointOnNewTab: false
        };
    }

    const handleYasrVisivility = () => {
        let className = 'hide'
        let isElementHidden = hasClass(yasrRootElement,className);
        let method = isElementHidden ? 'remove' : 'add'
        let hasResults = !!yasgui.getTab().yasr.results;

        if (method === 'add' && !hasResults) {
            yasrRootElement.classList.add(className);
        } else {
            if (isElementHidden) {
                yasrRootElement.classList.remove(className);
            }
        }
    }
    
    const updateYasguiUI = () => {
        overwritePlugins();
        // Init UI events
        yasrRootElement = yasgui.getTab().yasr.rootEl;
        yasqeRootElement = yasgui.getTab().yasqe.rootEl;
        if (yasrRootElement instanceof HTMLElement) {
            initEvents();
            handleYasrVisivility();
            if (yasrRootElement.querySelector(`.select_response`)) {
                yasrRootElement.querySelector(`.select_response`).classList.add('hide');
            }
        }
    }

    const overwritePlugins = () => {
        //overwrite table plugin
        // update canHandleResults
        // render plugin only when content type is EQ to json
        let yasr =  yasgui.getTab().getYasr();
        yasr.plugins['table'].canHandleResults = function() {
            let isCompatible = !!this.yasr.results
                && this.yasr.results?.getVariables()
                && this.yasr.results?.getVariables().length > 0
                && this.yasr.results.getContentType() == 'application/json';
            return isCompatible;
        }
        // dont show response plugin
        yasr.plugins['response'].canHandleResults = function() {
            return false;
        }
        // overwrite yasr dowload function
        yasr.download = function() {
           return false;
        };
    }

    self.hasInitialized = false;

    self.updateDataset = (data) => {
        dataset = data;
    }

    self.handleYasrContainer = handleYasrVisivility;

    self.initYasgui = (element, config :any = {}) => {
        const localConfig = getDefaultConfig();
        config.name = 'mobiQuery';
        config.tabName = 'mobiQuery';

        if(config.endpoint) {
            customURL = config.endpoint;
        }
        const configuration = merge({}, localConfig, config );
        // Init YASGUI
        initPlugins();
        if (!self.hasInitialized) {
            self.reset();
        }
        
        yasgui = new Yasgui(element, configuration);
        updateYasguiUI();
        self.hasInitialized = true;
    }

    self.getYasgui = () => {
        return yasgui;
    }
    
    // fire a new query
    self.submitQuery  = (queryConfig = {}) => {
        if (self.hasInitialized) {
            setRequestConfig();
            yasgui.getTab().yasqe.query(queryConfig);
        } else {
            throw 'Error: Yasgui has not been initialized';
        }
    }

    self.reset = () => {
        dataset = '';
        if (Object.prototype.hasOwnProperty.call(yasgui, 'getTab')) {
            self.clearStorage();
        } else  {
            let yasguiKeyName = 'yagui__config';
            if (localStorage.getItem(yasguiKeyName)) {
                localStorage.removeItem(yasguiKeyName);
            }
        }
    }

    self.clearStorage = () => {
        yasgui.getTab().getYasr().storage.removeNamespace();
    }
}

export default yasguiService;
