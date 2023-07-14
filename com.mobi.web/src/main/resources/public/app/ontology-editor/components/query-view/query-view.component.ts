/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnChanges, OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { YasguiQuery } from '../../../shared/models/yasguiQuery.class';
import { YasguiService } from '../../../shared/services/yasgui.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';

@Component({
    selector: 'query-view',
    templateUrl: './query-view.component.html',
    styleUrls: ['./query-view.component.scss'],
    providers: [YasguiService]
})
export class QueryViewComponent implements OnInit, OnChanges, OnDestroy {

    @Input()
    yasguiQuery: YasguiQuery
    tab: any = {};
    error = '';
    ready = true;
    isIncludeImportsChecked: boolean;

    @ViewChild('ontologyQuery', {static: false}) ontologyQuery: ElementRef;


    constructor(public yasgui: YasguiService, private spinnerSvc: ProgressSpinnerService,
                private changeDetector : ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.ready = true;
        this.changeDetector.detectChanges();
        this._setUpYasgui();
        this.isIncludeImportsChecked = this.yasguiQuery.isImportedOntologyInclude;
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes?.yasguiQuery && !changes?.yasguiQuery.isFirstChange()) {
            this.ready = false;
            this.changeDetector.detectChanges();
            this.yasgui.reset();
            this.ready = true;
            this.changeDetector.detectChanges();
            this._setUpYasgui();
        }
    }

    ngOnDestroy(): void {
        //update values when component is destroyed
        this.yasguiQuery.isImportedOntologyInclude = this.isIncludeImportsChecked;
    }

    submitQuery(): void {
        this.spinnerSvc.startLoadingForComponent(this.ontologyQuery);
        this.yasguiQuery.isImportedOntologyInclude = this.isIncludeImportsChecked || false;
        const config =  {
            args: [{ name: 'includeImports', value: this.yasguiQuery.isImportedOntologyInclude }]
        };
        this.yasgui.submitQuery(config);
        this.spinnerSvc.finishLoadingForComponent(this.ontologyQuery);
    }

    setValues(): void {
        if (Object.prototype.hasOwnProperty.call(this.tab.yasqe, 'setValue')) {
            const yasqueValue = this.yasguiQuery.queryString || this.tab.yasqe.config.value;
            this.tab.yasqe.setValue(yasqueValue);
        }

        const isResponseEmpty = Object.keys(this.yasguiQuery.response).length === 0;
        if (!isResponseEmpty) {
            this.tab.yasr.setResponse(this.yasguiQuery.response, this.yasguiQuery.executionTime);
            this.yasgui.handleYasrContainer();
        }
    }

    _setUpYasgui(): void {
        this.yasgui.initYasgui(this.ontologyQuery.nativeElement, {name: 'ontologyQuery'}, this.yasguiQuery, true);
        const yasgui = this.yasgui.getYasgui();

        if (yasgui && yasgui.getTab) {
            this.tab = yasgui.getTab();
            this.setValues();
            this.error = '';
        } else {
            this.error = 'Something went wrong, try again in a few seconds or refresh the page';
        }
    }
}
