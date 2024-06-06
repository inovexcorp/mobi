/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { some } from 'lodash';
import { filter, map } from 'rxjs/operators';

import { MapperStateService } from './shared/services/mapperState.service';
import { OntologyStateService } from './shared/services/ontologyState.service';
import { WorkflowsStateService } from './workflows/services/workflows-state.service';

/**
 * @class AppComponent
 * 
 * Main component for the Mobi application.
 */
@Component({
    selector: 'mobi-app',
    template: `
        <router-outlet></router-outlet>
        <progress-spinner></progress-spinner>
    `
})
export class AppComponent implements OnInit {
    constructor(public router: Router, private titleService: Title, private os: OntologyStateService, 
        private ms: MapperStateService,
        private _wss: WorkflowsStateService) {}

    @HostListener('window:unload', [ '$event' ]) unloadHandler(event: Event): void {
        this.handleUnload(event);
    }

    @HostListener('window:beforeunload', [ '$event' ]) beforeUnloadHandler(event: Event): void {
        this.handleUnload(event);
    }

    ngOnInit(): void {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map(() => {
                let route: ActivatedRoute = this.router.routerState.root;
                let routeTitle = '';
                while (route?.firstChild) {
                    route = route.firstChild;
                }
                if (route.snapshot.data['title']) {
                    routeTitle = route?.snapshot.data['title'];
                }
                return routeTitle;
                })
            )
            .subscribe((title: string) => {
                if (title) {
                this.titleService.setTitle(`${title} | Mobi`);
                }
            });
    }

    // Throws an alert if there are unsaved changes that would be lost if you closed the page
    handleUnload(event: Event): void {
        const ontologyHasChanges = some(this.os.list, item => this.os.hasChanges(item));
        const mappingHasChanges = this.ms.isMappingChanged();
        const workflowHasChanges = this._wss.isEditMode && this._wss.hasChanges;
        if (ontologyHasChanges || mappingHasChanges || workflowHasChanges) {
            event.preventDefault();
        }
    }
}
