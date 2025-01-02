/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Injectable, Injector, NgZone } from '@angular/core';
import { merge } from 'lodash';
import * as Yasgui from '@triply/yasgui/build/yasgui.min.js';
import { PersistedJson } from '@triply/yasgui/build/ts/src/PersistentConfig';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import * as YasrTurtlePlugin from '../../vendor/YASGUI/plugins/turtle/turtle';
import * as YasrRdfXmlPlugin from '../../vendor/YASGUI/plugins/rdfXml/rdfXml';
import * as YasrJsonLDlPlugin from '../../vendor/YASGUI/plugins/jsonLD/jsonLD';
import { hasClass } from '../../vendor/YASGUI/plugins/utils/yasguiUtil';
import { REST_PREFIX } from '../../constants';
import { DownloadQueryOverlayComponent } from '../components/downloadQueryOverlay/downloadQueryOverlay.component';
import { ToastService } from './toast.service';
import { YasguiQuery } from '../models/yasguiQuery.class';
import { LoginManagerService } from './loginManager.service';


/**
 * @class shared.YasguiService
 * 
 * A service that provide access to YASUI library. Extends YASUI:YASR plugins. Requires:
 * @trpiply/yasgui
 * vendor.YASGUI.plugins:turtle
 * vendor.YASGUI.plugins:rdfXml
 * vendor.YASGUI.plugins:jsonLD
 * vendor.YASGUI.plugins.utils:yasguiUtil
 * 
 * Documentation: https://triply.cc/docs/yasgui
 * Demo Page: https://yasgui.triply.cc/
 * Code: https://github.com/TriplyDB/Yasgui
 */
@Injectable()
export class YasguiService {
    defaultUrl : URL = new URL(`${REST_PREFIX}sparql/limited-results`, window.location.origin);
    yasgui : any = {};
    customURL = null;
    reponseLimitElement = <HTMLElement>{};
    yasrRootElement : HTMLElement = <any>{};
    hasInitialized = false;
    yasguiQuery: YasguiQuery;
    isOntology = false;
    
    constructor(private matDialog: MatDialog,
        private injector: Injector,
        private router: Router,
        private ngZone: NgZone,
        private toast: ToastService) {
        }

    initYasgui(element: HTMLElement, config: any = {}, query: YasguiQuery, isOntology = false) : void{
        this.yasguiQuery = query;
        this.isOntology = isOntology;
        const localConfig = this._getDefaultConfig();
        config.name = 'mobiQuery';
        config.tabName = 'mobiQuery';

        if (config.endpoint) {
            this.customURL = config.endpoint;
        }
        
        const configuration = merge({}, localConfig, config);
        // Init YASGUI
        this._initPlugins();
        
        if (!this.hasInitialized) {
            this.reset();
        }
        this.yasgui = new (<any>Yasgui).default(element, configuration);
        this._updateYasguiUI();
        this.hasInitialized = true;
    }

    handleYasrContainer = this._handleYasrVisibility;

    public getYasgui(): any {
        return this.yasgui;
    }
    
    // fire a new query
    public submitQuery(queryConfig = {}): boolean {
        if (this.hasInitialized) {
            this._setRequestConfig(queryConfig);
            this.yasgui.getTab().yasqe.query();
            return true;
        } else {
            this.toast.createErrorToast('Error: Yasgui has not been initialized');
            return false;
        }
    }

    public reset(): void {
        if (!this.isOntology && this.yasguiQuery) {
            this.yasguiQuery.recordId = '';
        }
        if (Object.prototype.hasOwnProperty.call(this.yasgui, 'getTab')) {
            this.clearStorage();
        } else  {
            const yasguiKeyName = 'yagui__config';
            if (localStorage.getItem(yasguiKeyName)) {
                localStorage.removeItem(yasguiKeyName);
            }
        }
    }

    /**
     * Clear Storage
     * https://github.com/TriplyDB/Yasgui/blob/master/packages/utils/src/Storage.ts
     */
    public clearStorage(): void {
        this.yasgui.getTab().getYasr().storage.removeNamespace();
    }
    
    private _initPlugins() {
        // register custom plugins
        if (Yasgui.Yasr) {
            Yasgui.Yasr.registerPlugin('turtle', YasrTurtlePlugin.default as any);
            Yasgui.Yasr.registerPlugin('rdfXml', YasrRdfXmlPlugin.default as any);
            Yasgui.Yasr.registerPlugin('jsonLD', YasrJsonLDlPlugin.default as any);
        } else {
            (window as any).Yasr.registerPlugin('turtle', YasrTurtlePlugin.default as any);
            (window as any).Yasr.registerPlugin('rdfXml', YasrRdfXmlPlugin.default as any);
            (window as any).Yasr.registerPlugin('jsonLD', YasrJsonLDlPlugin.default as any);
        }
        // set the order of the plugins
        Yasgui.Yasr.defaults.pluginOrder = [ 'table', 'turtle' , 'rdfXml', 'jsonLD'];
    }
    
    private _setYasguiResponseAndExecutionTime(response: any, duration: number): void {
        this.yasguiQuery.response = response;
        this.yasguiQuery.executionTime = duration;
    }
    private _handleErrorResponse(response: any, duration: number): void {
        const loginManagerService = this.injector.get(LoginManagerService);
        loginManagerService.validateSession().subscribe((valid) => {
            if (valid) {
                this._setYasguiResponseAndExecutionTime(response, duration);
            }
        });
    }

    // Register event listeners
    private _initEvents() {
        const tab = this.yasgui.getTab();
        tab.once('query',() => {
            this._handleYasrVisibility();
        });

        // update query string value on blur
        tab.yasqe.on('blur', (yasqe: Yasgui.Yasqe) => {
            this.yasguiQuery.queryString = yasqe.getValue();
        });

        // update plugin data on tab change
        tab.yasr.on('change', (instance: Yasgui.Yasr, config: PersistedJson) => {
            if (this._isPluginEnabled(instance?.selectedPlugin)) {
                this._refreshPluginData();
            }
        });

        tab.yasqe.on('queryResponse', (instance, response: any, duration: number) => {
            if (response instanceof Error && 'status' in response) {
                if (response['status'] === 401) {
                    this._handleErrorResponse(response, duration);
                } else {
                    this._setYasguiResponseAndExecutionTime(response, duration);
                }
            } else {
                this._setYasguiResponseAndExecutionTime(response, duration);
            }
        });

        const downloadIcon = this.yasrRootElement.querySelector('.yasr_downloadIcon');
        if (downloadIcon) {
            downloadIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this._downloadIconOnClick(tab);
            });
        }
        
        /**
         * display query limit message
         * overwrite download button functionality
         */
        tab.yasr.once('drawn', (instance: Yasgui.yasr, plugin: Plugin) => {
            this._drawResponseLimitMessage(instance.headerEl);
            // dont show table plugin as selected if it cant handled the results
            if (!instance.plugins['table'].canHandleResults() && instance.drawnPlugin !== 'table') {
                instance.draw();
            }
        });

        // Fires when a plugin finished drawing the results
        // update yasr header: response limit message
        tab.yasr.on('drawn', (yasr: Yasgui.Yasr, plugin: Plugin) => {
            const drawnPlugin = yasr.drawnPlugin;
            const results = yasr.results;
            const limit = (results.res && results.res.headers['x-limit-exceeded']) ? results.res.headers['x-limit-exceeded'] : 0;
            this._updateResponseLimitMessage(limit);

            if (drawnPlugin === 'table') {
                yasr.plugins['table'].dataTable.column().visible(false);
                const tableFilterInput = this.yasrRootElement.querySelector('.tableFilter');
                if (tableFilterInput) {
                    tableFilterInput.addEventListener('keypress', function (e:KeyboardEvent) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    });
                }
            }

            if (drawnPlugin === 'error') {
                const error = this.yasgui.getTab().getYasr().results?.getError();
                const errTextEl = this.yasrRootElement.querySelector('pre');
                if (errTextEl && error.text && !Object.prototype.hasOwnProperty.call(error, 'clear')) {
                    try {
                        const errorJson = JSON.parse(decodeURIComponent(error.text));
                        if (Object.prototype.hasOwnProperty.call(errorJson, 'details')) {
                            errTextEl.textContent = errorJson['details'];
                        } else if (Object.prototype.hasOwnProperty.call(errorJson, 'errorDetails')) {
                            errTextEl.textContent = errorJson['errorDetails'];
                        } else {
                            errTextEl.textContent = 'Could not find error details from response object.';
                        }
                    } catch (e) {
                        errTextEl.textContent = 'Could not parse error response as JSON.';
                    }
                }
            }

            if (yasr.getSelectedPluginName() !== drawnPlugin) {
                yasr.selectPlugin(drawnPlugin);
            }
        });
    }

    private _downloadIconOnClick(tab){
        const downloadIconDisabled = this.yasrRootElement.querySelector('.yasr_downloadIcon').classList.contains('disabled');

        if (downloadIconDisabled) {
            return;
        }
        
        this.matDialog.open(DownloadQueryOverlayComponent, {
            data: {
                query: tab.yasqe.getQueryWithValues(),
                queryType: tab.yasqe.getQueryType()?.toLowerCase(),
                recordId: this.yasguiQuery.recordId,
                commitId: this.yasguiQuery.commitId,
                isOntology: this.isOntology
            }
        }).afterClosed().subscribe((errorMessage) => {
            if (errorMessage) {
                tab.yasr.setResponse({
                        data: [],
                        error: { 
                            status: 401,
                            text: errorMessage,
                            statusText: errorMessage,
                            clear: true
                        },
                        status: 401,
                        contentType: undefined,
                        executionTime: 0
                    });
            }
        });
    }

    private _drawResponseLimitMessage(headerElement) {
        this.reponseLimitElement = document.createElement('div');
        this.reponseLimitElement.classList.add('yasr_response_limit');
        headerElement.insertBefore(this.reponseLimitElement, headerElement.querySelector('.yasr_response_chip').nextSibling);
    }

    private _updateResponseLimitMessage(limit = 0) {
        this.reponseLimitElement.innerText = '';
        const className = 'hide';
        if (limit) {
            this.reponseLimitElement.classList.remove(className);
            if (!this.reponseLimitElement.innerText) {
                this.reponseLimitElement.innerText = `Warning: Query Results exceeded the limit of ${limit} rows/triples`;
            }
        } else {
            this.reponseLimitElement.classList.add(className);
        }
    }

    private _isPluginEnabled(plugin) {
        if (!(Object.prototype.hasOwnProperty.call(this.yasgui, 'rootEl') && this.yasgui.rootEl instanceof HTMLElement)) {
            return false;
        }

        const pluginElement = this.yasgui.rootEl.querySelector(`.select_${plugin}`);
        if (pluginElement) {
            return !hasClass(pluginElement, 'disabled');
        } else {
            return false;
        }
    }

    /**
     * Get Accept Header for a specific type
     * @param type format
     * @returns Accept Header Content Type
     */
    private _getFormat(type, query: string) {
        let format = type || this.yasgui.getTab().yasr.config.defaultPlugin;
        const formatType =  {
           'turtle': 'text/turtle',
           'rdfXml': 'application/rdf+xml',
           'jsonLD': 'application/ld+json',
           'table': 'application/json'
        };
        const selectIndex = query.toLowerCase().indexOf('select') === -1 ? 99999 : query.toLowerCase().indexOf('select');
        const constructIndex = query.toLowerCase().indexOf('construct')  === -1 ? 99999 : query.toLowerCase().indexOf('construct');
        if (format === 'table' && constructIndex < selectIndex) {
            return formatType['turtle'];
        }
        let defaultForType;
        if ( type === 'error' && constructIndex < selectIndex) {
            defaultForType = formatType.turtle;
        } else if (constructIndex < selectIndex) {
            defaultForType = formatType.jsonLD;
        } else {
            if (format === 'turtle' || format === 'rdfXml' || format === 'jsonLD') {
                format = 'NOT_VALID';
            }
            defaultForType = formatType.table;
        }
        return formatType?.[format] || defaultForType;
    }

    // update yasr request configuration
    private _setRequestConfig(configVals) {
        const datasetIri = this.isOntology ? undefined : this.yasguiQuery.recordId;
        let url =  this.customURL || this.defaultUrl.href;
        if (this.isOntology) {
            url = new URL(`${REST_PREFIX}ontologies/${encodeURIComponent(this.yasguiQuery.recordId)}/limited-results`, window.location.origin).href;
            // query
        }
        const { headers } = this.yasgui.getTab().getRequestConfig();
        headers.Accept = this._getFormat(this.yasgui.getTab().yasr.selectedPlugin, this.yasguiQuery.queryString);
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const requestConfig = {
            endpoint: url,
            headers: headers,
            method: 'POST'
        };
        if (this.isOntology) {
            requestConfig['args'] = [
                {name: 'applyInProgressCommit', value: true}, 
                {name: 'includeImports', value: this.yasguiQuery.isImportedOntologyIncluded}
            ];
            if (this.yasguiQuery.commitId !== '') {
                requestConfig['args'].push({ name: 'commitId', value: this.yasguiQuery.commitId});
            }
        } else {
            requestConfig['args'] = (datasetIri !== '') ? [{name: 'dataset', value: datasetIri}] : [];
        }
        this.yasgui.getTab().setRequestConfig(requestConfig);
    }

    private _refreshPluginData() {
        const yasr = this.yasgui.getTab().yasr;
        if (yasr.drawnPlugin && yasr.selectedPlugin) {
            this.submitQuery();
        }
    }

    /**
     * Get Default Configuration for Yasgui
     * Documentation: https://triply.cc/docs/yasgui-api#yasgui-config
     * Main Object: https://github.com/TriplyDB/Yasgui/blob/89d2f430c75eb10cf400d9187a1d7fdac507943c/packages/yasgui/src/index.ts#L25
     * RequestConfig: https://github.com/TriplyDB/Yasgui/blob/89d2f430c75eb10cf400d9187a1d7fdac507943c/packages/yasqe/src/index.ts#L984
     * @returns Config Object
     */
    private _getDefaultConfig() {
        return {
            requestConfig: {
                method: 'POST',
                endpoint: this.defaultUrl.href
            },
            populateFromUrl: false,
            copyEndpointOnNewTab: false
        };
    }

    private _handleYasrVisibility () {
        const className = 'd-none';
        const isElementHidden = hasClass(this.yasrRootElement, className);
        const method = isElementHidden ? 'remove' : 'add';
        const hasResults = !!this.yasgui.getTab().yasr.results;
        
        if (method === 'add' && !hasResults) {
            this.yasrRootElement.classList.add(className);
        } else {
            if (isElementHidden) {
                this.yasrRootElement.classList.remove(className);
            }
        }
    }
    
    private _updateYasguiUI() {
        this._overwritePlugins();
        // Init UI events
        this.yasrRootElement = this.yasgui.getTab().yasr.rootEl;
        if (this.yasrRootElement instanceof HTMLElement) {
            this._initEvents();
            this._handleYasrVisibility();
            if (this.yasrRootElement.querySelector('.select_response')) {
                this.yasrRootElement.querySelector('.select_response').classList.add('hide');
            }
        }
    }

    private _overwritePlugins() {
        // overwrite table plugin
        // update canHandleResults
        // render plugin only when content type is EQ to json
        const yasr = this.yasgui.getTab().getYasr();
        yasr.plugins['table'].canHandleResults = function() {
            const isCompatible = !!this.yasr.results
                && this.yasr.results?.getVariables()
                && this.yasr.results?.getVariables().length > 0
                && this.yasr.results.getContentType() === 'application/json';
            return isCompatible;
        };

        yasr.plugins['table'].getUriLinkFromBinding = function(binding, prefixes?: { [key: string]: string }) {
            const prefixed = false;
            const href = binding.value;
            let visibleString = href;
            if (prefixes) {
                for (const prefixLabel in prefixes) {
                    if (visibleString.indexOf(prefixes[prefixLabel]) === 0) {
                        visibleString = `${prefixLabel}:${href.substring(prefixes[prefixLabel].length)}`;
                        break;
                    }
                }
            }
            // Hide brackets when prefixed or compact
            const hideBrackets = prefixed || this.persistentConfig.compact;
            return `${hideBrackets ? '': '&lt;'}<a class='iri' target='${
                this.config.openIriInNewWindow ? '_blank' : '_self'
            }'${this.config.openIriInNewWindow ? 'ref=\'noopener noreferrer\'' : ''} href='${href}'>${visibleString}</a>${
                hideBrackets ? '' : '&gt;'
            }`;
        };

        // dont show response plugin
        yasr.plugins['response'].canHandleResults = function() {
            return false;
        };
        // overwrite yasr download function
        yasr.download = function() {
           return false;
        };
    }
}
