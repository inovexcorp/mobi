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
import { first } from 'rxjs/operators';
import { filter, some, every } from 'lodash';
import { Component, Inject, OnInit, OnChanges, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Datasource, IDatasource } from 'ngx-ui-scroll';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { INDENT } from '../../../constants';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';

import './hierarchyTree.component.scss';

/**
 * @class ontology-editor.HierarchyTreeComponent
 * 
 * A component which creates a `div` containing a {@link shared.SearchBarComponent} and hierarchy of
 * {@link ontology-editor.TreeItemComponent}. When search text is provided, the hierarchy filters what is shown based on
 * value matches with predicates in the {@link shared.OntologyManagerService entityNameProps}.
 *
 * @param {HierarchyNode[]} hierarchy An array which represents a flattened hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */

@Component({
    selector: 'hierarchy-tree',
    templateUrl: './hierarchyTree.component.html'
})
export class HierarchyTreeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() parentLabel: string;
    @Input() hierarchy: HierarchyNode[];
    @Input() index: number;
    @Input() branchId: string;

    @Output() resetIndex = new EventEmitter<null>();
    @Output() updateSearch = new EventEmitter<string>();

    datasource: IDatasource = new Datasource({
        get: (index, count, success) => {
            const data = this.filteredHierarchy.slice(index, index + count);
            success(data);
        },
        settings: {
            bufferSize: 35,
            startIndex: 0,
            minIndex: 0
        }
    });

    indent = INDENT;
    searchText = '';
    filterText = '';
    filteredHierarchy = [];
    preFilteredHierarchy = [];
    midFilteredHierarchy = [];
    activeTab = '';
    dropdownFilterActive = false;
    dropdownFilters = [];
    activeEntityFilter;
    deprecatedEntityFilter;
    chunks = [];

    constructor(public os: OntologyStateService, public om: OntologyManagerService, @Inject('utilService') private util) {}

    ngOnInit(): void {
        this.activeEntityFilter = {
            name: 'Hide unused imports',
            checked: false,
            flag: false,
            filter: node => {
                let match = true;
                if (this.os.isImported(node.entityIRI)) {
                    match = false;
                }
                return match;
            }
        };
        this.deprecatedEntityFilter = {
            name: 'Hide deprecated ' + this.parentLabel,
            checked: false,
            flag: false,
            filter: node => {
                let match = true;
                if (this.os.isIriDeprecated(node.entityIRI)) {
                    match = false;
                }
                return match;
            }
        };
        this.dropdownFilters = [Object.assign({}, this.activeEntityFilter), Object.assign({}, this.deprecatedEntityFilter)];
        this.activeTab = this.os.getActiveKey();
        this.update();
    }
    private removeFilters(): void {
        this.dropdownFilterActive = false;
        this.dropdownFilters = [Object.assign({}, this.activeEntityFilter), Object.assign({}, this.deprecatedEntityFilter)];
        this.searchText = '';
        this.filterText = '';
    }
    ngOnChanges(changesObj: any): void {
        if (!changesObj.hierarchy || !changesObj.hierarchy.isFirstChange()) {
            if (changesObj.branchId) {
                this.removeFilters();
            }
            this.update();
        }
    }
    ngOnDestroy(): void {
        if (this.os.listItem?.editorTabStates) {
            this.resetIndex.emit();
        }
    }
    clickItem(entityIRI: string): void {
        this.os.selectItem(entityIRI).pipe(first()).toPromise();
    }
    onKeyup(): void {
        this.filterText = this.searchText;
        this.dropdownFilterActive = some(this.dropdownFilters, 'flag');
        this.update();
    }
    toggleOpen(node: HierarchyNode): void {
        node.isOpened = !node.isOpened;
        node.isOpened ? this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath] = true : delete this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath];
        this.filteredHierarchy = filter(this.preFilteredHierarchy, this.isShown.bind(this));
        this.datasource.adapter.reload(this.datasource.adapter.firstVisible.$index);
    }
    matchesSearchFilter(node: HierarchyNode): boolean {
        let searchMatch = false;
        // Check all possible names to see if the value matches the search text
        some(node.entityInfo.names, name => {
            if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                searchMatch = true;
            }
        });

        if (searchMatch) {
            return true;
        }

        // Check if beautified entity id matches search text
        if (this.util.getBeautifulIRI(node.entityIRI).toLowerCase().includes(this.filterText.toLowerCase())) {
            searchMatch = true;
        }
        
        return searchMatch;
    }
    matchesDropdownFilters(node: HierarchyNode): boolean {
        return every(this.dropdownFilters, filter => filter.flag ? filter.filter(node) : true);
    }
    searchFilter(node: HierarchyNode): boolean {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;

        if (this.filterText || this.dropdownFilterActive) {
            delete node.isOpened;
            let match = false;
            
            if (this.matchesSearchFilter(node) && this.matchesDropdownFilters(node)) {
                match = true;
                this.openAllParents(node);
                node.underline = true;
            }

            // Always return true for parents, but if the parent is not a match, set a property called parentNoMatch = true
            if (!match && node.hasChildren) {
                node.parentNoMatch = true;
                return true;
            }
            return match;
        } else {
            return true;
        }
    }
    // Start at the current node and go up through the parents marking each path as an iriToOpen. If a path is already present in this.os.listItem.editorTabStates[this.activeTab].open, it means it was already marked as an iriToOpen by another one of it's children. In that scenario we know all of it's parents will also be open, and we can break out of the loop.
    openAllParents(node: HierarchyNode): void {
        for (let i = node.path.length - 1; i > 1; i--) {
            const fullPath = this.os.joinPath(node.path.slice(0, i));

            if (this.os.listItem.editorTabStates[this.activeTab].open[fullPath]) {
                break;
            }

            this.os.listItem.editorTabStates[this.activeTab].open[fullPath] = true;
        }
    }
    isShown(node: HierarchyNode): boolean {
        const displayNode = (node.indent > 0 && this.os.areParentsOpen(node, this.activeTab)) || node.indent === 0;
        if ((this.dropdownFilterActive || this.filterText) && node.parentNoMatch) {
            if (node.displayNode === undefined) {
                return false;
            } else {
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }
    openEntities(node: HierarchyNode): boolean {
        const toOpen = this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath];
        if (toOpen) {
            if (!node.isOpened) {
                node.isOpened = true;
            }
            node.displayNode = true; 
        }
        return true;
    }

    private update(): void {
        if (this.filterText || this.dropdownFilterActive) {
            this.os.listItem.editorTabStates[this.activeTab].open = {};
        }
        this.updateSearch.emit(this.filterText);
        this.preFilteredHierarchy = this.hierarchy.filter(this.searchFilter.bind(this));
        this.midFilteredHierarchy = this.preFilteredHierarchy.filter(this.openEntities.bind(this));
        this.filteredHierarchy = this.midFilteredHierarchy.filter(this.isShown.bind(this));
        this.datasource.adapter.reload(this.index);
    }

    updateDropdownFilters(value): void {
        this.dropdownFilters = value;
    }

    updateSearchText(value: string): void {
        this.searchText = value;
    }
}