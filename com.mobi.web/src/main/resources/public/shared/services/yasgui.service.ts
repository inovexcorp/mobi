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
yasguiService.$inject = ['REST_PREFIX','sparqlManagerService', 'modalService'];

function yasguiService(REST_PREFIX, sparqlManagerService, modalService) {
    const self = this;
    const defaultUrl : URL =  new URL(REST_PREFIX + 'sparql/limited-results', document.location.origin);
    let dataset = '';
    let innerHeight = window.innerHeight;
    let reponseLimitElement = <HTMLElement>{};
    let hasInitialized = false
    let yasrContainerSelector = '.yasr .CodeMirror-scroll, .yasr .dataTables_wrapper ';
    let yasrRootElement : HTMLElement = <any>{};
    let timeoutResizeId = null;

    const initPlugins = () => {
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
        Yasgui.Yasr.defaults.pluginOrder = [ "table", "turtle" , "rdfXml", "jsonLD"];
    }

    const resizeYasrContainer = () => {
        if (timeoutResizeId) {
            clearTimeout(timeoutResizeId);
        }

        timeoutResizeId = setTimeout(() => {
            innerHeight = window.innerHeight;
            let yasrContentElement = <HTMLElement>document.querySelector(yasrContainerSelector);
            yasrContentElement.style.height = getYasContainerHeight();
        }, 200);
    }

    const initEvents = () => {
        const yasgui =  self.yasgui.getTab();
        const formatType =  {
            'turtle': 'ttl',
            'rdfXml': 'rdf',
            'jsonLD': 'jsonld',
            'table': 'json'
        };

        window.addEventListener('resize', resizeYasrContainer);
        yasgui.yasqe.on("resize", resizeYasrContainer);
        yasgui.once("query",() => {
            handleYasrVisivility();
        });

        yasgui.yasr.on('change',(instance: Yasgui.Yasr, plugin: Plugin) => {
            if (isPluginEnabled(instance?.selectedPlugin)) {
                refreshPluginData();
            }
        });
        // update yasr container height
        // add new element to yasr header.
        yasgui.yasr.once("drawn",(instance: Yasgui.yasr, plugin: Plugin) => {

            drawResponseLimitMessage(instance.headerEl);
            resizeYasrContainer();
            if (!instance.plugins['table'].canHandleResults() && instance.drawnPlugin !== 'table') {
                yasgui.yasr.draw();
            }

            document.querySelector('.yasr_downloadIcon').addEventListener('click', (e) => {
                e.preventDefault();
                sparqlManagerService.queryString = yasgui.yasqe.getQueryWithValues();
                const type = formatType[yasgui.yasr.drawnPlugin] || formatType[yasgui.yasr.config.defaultPlugin];
                const queryType = yasgui.yasqe.getQueryType()?.toLowerCase();
                modalService.openModal('downloadQueryOverlay', {queryType}, undefined, 'sm');
            })
        });

        // update yasr codemirror height
        // update yasr header: response limit message
        yasgui.yasr.on("drawn",({ results }) => {
            let limit = (results.res && results.res.headers['x-limit-exceeded']) ? results.res.headers['x-limit-exceeded'] : 0;
            let yasrCodeMirrorElement = <HTMLElement>document.querySelector(yasrContainerSelector);
            if (yasrCodeMirrorElement) { yasrCodeMirrorElement.style.height = getYasContainerHeight(); }
            resizeYasrContainer();
            updateResponseLimitMessage(limit);

            if (yasgui.yasr.drawnPlugin === 'table') {
                yasgui.yasr.plugins['table'].dataTable.column().visible(false);
            }

            if (yasgui.yasr.getSelectedPluginName() !== yasgui.yasr.drawnPlugin) {
                yasgui.yasr.selectPlugin(yasgui.yasr.drawnPlugin);
            }
        });
    }

    const getYasContainerHeight = () =>  {
        let elementHeight = Math.floor(innerHeight
            - document.querySelector('.yasqe').getBoundingClientRect().bottom
            - document.querySelector('.material-tabset-headings').clientHeight);
        let style  = `${elementHeight}px`;
        return style;
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
        let format = type || self.yasgui.getTab().yasr.config.defaultPlugin;
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
        let url =  getUrl();
        const { headers } = self.yasgui.getTab().getRequestConfig();
        headers.Accept = getFormat(self.yasgui.getTab().yasr.selectedPlugin);
        self.yasgui.getTab().setRequestConfig({
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
        }

        return defaultUrl.href;
    }

    const refreshPluginData = () => {
        let yasr = self.yasgui.getTab().yasr;
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
        let hasResults = !!self.yasgui.getTab().yasr.results;

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
        initEvents();
        yasrRootElement =  self.yasgui.getTab().yasr.rootEl;
        handleYasrVisivility();
        document.querySelector(`.select_response`).classList.add('hide');
    }

    const overwritePlugins = () => {
        //overwrite table plugin
        // update canHandleResults
        // render plugin only when content type is EQ to json
        let yasr =  self.yasgui.getTab().getYasr();
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

    self.updateDataset = (data) => {
        dataset = data;
    }

    self.initYasgui = (element, config = {}) => {
        const localConfig = getDefaultConfig();
        const { tabName: defaultTabName } = Yasgui.defaults;
        let tab = null;
        let { name = defaultTabName } = config;
        config.tabName = name;
        const configuration = merge({}, localConfig, config );
        // Init YASGUI
        initPlugins();
        self.yasgui = new Yasgui(element, configuration);

        if (config.name) {
            tab = self.yasgui.tabNameTaken(name);
            if ( !tab ) {
               self.yasgui.addTab(
                    true, // set as active tab
                    { configuration, name:name, tabName: name }
                );
            } else  {
                if (self.yasgui.getTab().getId() !== tab.persistentJson.id) {
                    self.yasgui.selectTabId(tab.persistentJson.id);
                }
            }
        }
        updateYasguiUI();
        hasInitialized = true;
        return self.yasgui;
    }

    // fire a new query
    self.submitQuery  = (queryConfig = {}) => {
        if (hasInitialized) {
            setRequestConfig();
            self.yasgui.getTab().yasqe.query(queryConfig);
        } else {
            throw 'Yasgui has not ben initialize!';
        }
    }
}

export default yasguiService;
