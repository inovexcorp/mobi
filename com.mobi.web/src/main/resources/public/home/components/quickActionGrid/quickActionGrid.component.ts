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
import { chunk, isEmpty } from 'lodash';
import './quickActionGrid.component.scss';
import {Component, Inject, OnInit} from "@angular/core";
import {WindowRef} from "../../../shared/services/windowRef.service";

/**
 * @ngdoc component
 * @name home.component:quickActionGrid
 * @requires shared.service:ontologyStateService
 * @requires shared.service:discoverStateService
 *
 * @description
 * `quickActionGrid` is a component which creates a Bootstrap `.card` containing a grid of links to perform
 * common actions in the application. These actions are searching the catalog, opening an ontology, reading the
 * documentation, exploring data, querying data, and ingesting data.
 */
@Component({
    selector: 'quick-action-grid',
    templateUrl: './quickActionGrid.component.html'
})
export class QuickActionGridComponent implements OnInit {
    public actions = [];

    constructor(private windowRef: WindowRef, @Inject('$state') private $state, @Inject('ontologyStateService') private os,
                @Inject('discoverStateService') private ds) {
    }
    
    ngOnInit(): void {
        let actions = [
            {
                title: 'Search the Catalog',
                icon: 'fa-book',
                action: this.searchTheCatalog
            },
            {
                title: 'Open an Ontology',
                icon: 'fa-folder-open',
                action: this.openAnOntology
            },
            {
                title: 'Read the Documentation',
                icon: 'fa-book',
                action: this.readTheDocumentation
            },
            {
                title: 'Explore Data',
                icon: 'fa-database',
                action: this.exploreData
            },
            {
                title: 'Query Data',
                icon: 'fa-search',
                action: this.queryData
            },
            {
                title: 'Ingest Data',
                icon: 'fa-map',
                action: this.ingestData
            },
        ];
        this.actions = chunk(actions, 3);
    }
    searchTheCatalog() {
        this.$state.go('root.catalog');
    }
    openAnOntology() {
        this.$state.go('root.ontology-editor');
        if (!isEmpty(this.os.listItem)) {
            this.os.listItem.active = false;
        }
        this.os.listItem = {};
    }
    readTheDocumentation() {
        this.windowRef.getNativeWindow().open('https://mobi.inovexcorp.com/docs/', '_blank');
    }
    exploreData() {
        this.$state.go('root.discover');
        this.ds.explore.active = true;
        this.ds.search.active = false;
        this.ds.query.active = false;
    }
    queryData() {
        this.$state.go('root.discover');
        this.ds.explore.active = false;
        this.ds.search.active = false;
        this.ds.query.active = true;
    }
    ingestData() {
        this.$state.go('root.mapper');
    }
}