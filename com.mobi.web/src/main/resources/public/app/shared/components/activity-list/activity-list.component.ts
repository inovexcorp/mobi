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
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ActivityPaginatedConfig } from '../../models/activity-paginated-config';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { UtilService } from '../../../shared/services/util.service';
import { ProvManagerService } from '../../../shared/services/provManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { PROV } from '../../../prefixes';

interface ActivityDisplay {
    jsonld: JSONLDObject,
    timestamp: string
}

/**
 * @class shared.ActivityListComponent
 * 
 * A component that creates a list of activities optionally filtered by a provided entity or a provided user. The
 * activities are loaded 10 at a time and are displayed using {@link shared.ActivityTitleComponent}.
 */
@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html'
})
export class ActivityListComponent implements OnInit, OnDestroy {
    private increment = 10;
    
    limit = this.increment;
    activities: ActivityDisplay[] = [];
    entities: JSONLDObject[] = [];
    totalSize = 0;
    subscription: Subscription;
    
    @Input() entityIri: string;
    @Input() userIri: string;

    @ViewChild('activityList', { static: true }) activityList: ElementRef;

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
        this.spinnerSvc.startLoadingForComponent(this.activityList);
        this.subscription = this.pm.getActivities(this.getConfig())
            .pipe(finalize(() => {
                this.spinnerSvc.finishLoadingForComponent(this.activityList);
            }))
            .subscribe(response => {
                this.activities = response.body.activities.map(jsonld => ({
                    jsonld,
                    timestamp: this.getTimeStamp(jsonld)
                }));
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
    getConfig(): ActivityPaginatedConfig {
        const config: ActivityPaginatedConfig = {pageIndex: 0, limit: this.limit};
        if (this.entityIri) {
            config.entity = this.entityIri;
        }
        if (this.userIri) {
            config.agent = this.userIri;
        }
        return config;
    }
    trackByFn(index: number, item: ActivityDisplay): string {
        return item.jsonld['@id'];
    }

}
