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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PROV } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UtilService } from '../../../shared/services/util.service';
import { ProvManagerService } from '../../../shared/services/provManager.service';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';

/**
 * @class home.ActivityCardComponent
 *
 * `activity-card` is a component which creates a Bootstrap `.card` containing a infinite scrolled list of the
 * most recent activities in the application. The activities are loaded 10 at a time and are displayed using
 * {@link home.ActivityTitleComponent activityTitles}.
 */
@Component({
    selector: 'activity-card',
    templateUrl: './activityCard.component.html'
})
export class ActivityCardComponent implements OnInit, OnDestroy {
    private increment = 10;

    limit = this.increment;
    activities = [];
    entities = [];
    totalSize = 0;

    subscription: Subscription;

    @ViewChild('cardBody', { static: true }) cardBody: ElementRef;
    
    constructor(public pm: ProvManagerService, public util: UtilService, private spinnerSvc: ProgressSpinnerService) {}
    
    ngOnInit(): void {
        this.setPage();
    }
    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
    loadMore(): void {
        this.limit += this.increment;
        this.setPage();
    }
    setPage(): void {
        this.spinnerSvc.startLoadingForComponent(this.cardBody);
        this.subscription = this.pm.getActivities(this.getConfig())
            .pipe(finalize(() => {
                this.spinnerSvc.finishLoadingForComponent(this.cardBody);
            }))
            .subscribe(response => {
                this.activities = response.body.activities;
                this.entities = response.body.entities;
                this.totalSize = Number(response.headers.get('x-total-count')) || 0;
            }, errorMessage => {
                if (errorMessage) {
                    this.util.createErrorToast(errorMessage);
                }
            });
    }
    getTimeStamp(activity: JSONLDObject): string {
        const dateStr = this.util.getPropertyValue(activity, PROV + 'endedAtTime');
        return this.util.getDate(dateStr, 'short');
    }
    getConfig(): PaginatedConfig {
        return {pageIndex: 0, limit: this.limit};
    }
    trackByFn(index: number, item: JSONLDObject): string {
        return item['@id'];
    }
}
