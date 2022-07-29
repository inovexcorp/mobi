/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { POLICY } from '../../../../prefixes';
import { ProgressSpinnerService } from '../../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { YasguiService } from '../../../../shared/services/yasgui.service';

import './queryTab.component.scss';

/**
 * @class query.QueryTabComponent
 *
 * A component that provides a form for submitting and viewing the results of SPARQL queries against the system repo or
 * a {@link discover.component:datasetFormGroup selected dataset}. The query editor and results are displayed via a
 * YASGUI instance tied to the {@link shared.DiscoverStateService}.
 */
@Component({
    selector: 'query-tab',
    templateUrl: './queryTab.component.html'
})
export class QueryTabComponent implements OnInit {
    tab: any = {};
    error = '';
    queryForm = this.fb.group({
        dataset: ['']
    });

    @ViewChild('discoverQuery') discoverQuery: ElementRef;

    constructor(private fb: FormBuilder, public yasgui: YasguiService, public state: DiscoverStateService, 
        private spinnerSvc: ProgressSpinnerService, @Inject('utilService') private util,
        @Inject('policyEnforcementService') private pep) {}

    ngOnInit(): void {
        this.yasgui.initYasgui(this.discoverQuery.nativeElement, {name: 'discoverQuery'});
        const yasgui = this.yasgui.getYasgui();
       
        if (yasgui && yasgui.getTab) {
            this.tab = yasgui.getTab();
            this.initEventListener();
            this.setValues();
            this.error = '';
        } else {
            this.error = 'Something went wrong, try again in a few seconds or refresh the page';
        }
    }
    onSelect($event): void { // $event until datasetFormGroup is upgraded
        this.state.query.submitDisabled = false;
        this.state.query.datasetRecordId = $event.value;
        this.permissionCheck($event.value);
    }
    submitQuery(): void {
        if (this.state.query.datasetRecordId) {
            const pepRequest = this.createPepReadRequest(this.state.query.datasetRecordId);

            this.pep.evaluateRequest(pepRequest)
                .then(response => {
                    const canRead = response !== this.pep.deny;
                    if (canRead) { 
                        this.spinnerSvc.startLoadingForComponent(this.discoverQuery);
                        this.yasgui.submitQuery();
                        this.spinnerSvc.finishLoadingForComponent(this.discoverQuery);
                    } else {
                        this.util.createErrorToast('You don\'t have permission to read dataset');
                        this.state.query.submitDisabled = true;
                    }
                }, () => {
                    this.util.createWarningToast('Could not retrieve record permissions');
                    this.state.query.submitDisabled = true;
                });
        } else {
            this.spinnerSvc.startLoadingForComponent(this.discoverQuery);
            this.yasgui.submitQuery();
            this.spinnerSvc.finishLoadingForComponent(this.discoverQuery);
        }
    }
    permissionCheck(datasetRecordIRI: string): void {
        if (datasetRecordIRI) {
            const pepRequest = this.createPepReadRequest(datasetRecordIRI);
            this.pep.evaluateRequest(pepRequest)
                .then(response => {
                    const canRead = response !== this.pep.deny;
                    if (!canRead) {
                        this.util.createErrorToast('You don\'t have permission to read dataset');
                        this.state.query.submitDisabled = true;
                    }
                }, () => {
                    this.util.createWarningToast('Could not retrieve record permissions');
                    this.state.query.submitDisabled = true;
                });
        } else {
            const pepRequest = this.createPepReadRequest('http://mobi.com/system-repo');
            this.pep.evaluateRequest(pepRequest)
                .then(response => {
                    const canRead = response !== this.pep.deny;
                    if (!canRead) {
                        this.util.createErrorToast('You don\'t have access to query system repo');
                        this.state.query.submitDisabled = true;
                    }
                }, () => {
                    this.util.createWarningToast('Could not retrieve system repo permissions');
                    this.state.query.submitDisabled = true;
                });
        }
    }
    createPepReadRequest(datasetRecordIRI: string): { resourceId: any; actionId: string; } {
        return {
            resourceId: datasetRecordIRI,
            actionId: POLICY + 'Read'
        };
    }
    isYasguiElementDrawn(): boolean {
        return !(Object.prototype.hasOwnProperty.call(this.tab, 'rootEl') && this.tab.rootEl instanceof HTMLElement);
    }
    initEventListener(): void {
        if (!this.isYasguiElementDrawn() ) {
            return;
        }
        // get YASGUI instance and cache Yasgui object
        this.tab.yasqe.on('blur', () => {
            this.state.query.queryString = this.tab.yasqe.getValue();
        });

        this.tab.yasr.on('drawn', (yasr) => {
            this.state.query.selectedPlugin = yasr.drawnPlugin;
        });

        this.tab.yasqe.on('queryResponse', (instance, response: any, duration: number) => {
            this.state.query.response = response;
            this.state.query.executionTime = duration;
        });
    }
    setValues(): void {
        if (Object.prototype.hasOwnProperty.call(this.tab.yasqe, 'setValue')) {
            const yasqueValue = this.state.query.queryString || this.tab.yasqe.config.value;
            this.tab.yasqe.setValue(yasqueValue);
        }
        
        const isResponseEmpty = Object.keys(this.state.query.response).length === 0;
        if (!isResponseEmpty) {
            this.tab.yasr.setResponse(this.state.query.response, this.state.query.executionTime);
            this.yasgui.handleYasrContainer();
        }
    }
}