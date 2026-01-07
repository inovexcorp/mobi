/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { chunk } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WindowRef } from '../../../shared/services/windowRef.service';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';

/**
 * @class home.QuickActionGridComponent
 *
 * `quick-action-grid` is a component which creates a Bootstrap `.card` containing a grid of links to perform
 * common actions in the application. These actions are searching the catalog, opening an ontology, reading the
 * documentation, exploring data, querying data, and ingesting data.
 */
@Component({
    selector: 'quick-action-grid',
    templateUrl: './quickActionGrid.component.html',
    styleUrls: ['./quickActionGrid.component.scss']
})
export class QuickActionGridComponent implements OnInit {
    actions = [];

    constructor(private windowRef: WindowRef, private router: Router, private ds: DiscoverStateService) {}
    
    ngOnInit(): void {
        const actions = [
            {
                title: 'Search the Catalog',
                icon: 'fa-book',
                action: () => this.searchTheCatalog()
            },
            {
                title: 'Open an Ontology',
                icon: 'fa-folder-open',
                action: () => this.openAnOntology()
            },
            {
                title: 'Read the Documentation',
                icon: 'fa-book',
                action: () => this.readTheDocumentation()
            },
            {
                title: 'Explore Data',
                icon: 'fa-database',
                action: () => this.exploreData()
            },
            {
                title: 'Query Data',
                icon: 'fa-search',
                action: () => this.queryData()
            },
            {
                title: 'Ingest Data',
                icon: 'fa-map',
                action: () => this.ingestData()
            },
        ];
        this.actions = chunk(actions, 3);
    }
    searchTheCatalog(): void {
        this.router.navigate(['/catalog']);
    }
    openAnOntology(): void {
        this.router.navigate(['/ontology-editor']);
    }
    readTheDocumentation(): void {
        this.windowRef.getNativeWindow().open('https://mobi.inovexcorp.com/docs/', '_blank');
    }
    exploreData(): void {
        this.ds.tabIndex = 0;
        this.router.navigate(['/discover']);
    }
    queryData(): void {
        this.ds.tabIndex = 2;
        this.router.navigate(['/discover']);
    }
    ingestData(): void {
        this.router.navigate(['/mapper']);
    }
}
