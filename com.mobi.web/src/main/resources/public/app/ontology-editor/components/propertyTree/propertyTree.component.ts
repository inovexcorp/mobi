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
import { first } from 'rxjs/operators';
import { every, some, has, concat, map, merge, findIndex } from 'lodash';
import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    OnChanges,
    Output,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    AfterContentChecked,
    AfterViewInit
} from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { INDENT } from '../../../constants';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { getBeautifulIRI } from '../../../shared/utility';
import { HierarchyFilter } from '../hierarchyFilter/hierarchyFilter.component';

/**
 * @class ontology-editor.PropertyTreeComponent
 *
 * A component which creates a `div` containing a {@link shared.SearchBarComponent} and hierarchy of
 * {@link ontology-editor.TreeItemComponent}. When search text is provided, the hierarchy filters what is shown based on
 * value matches with predicates in the utility entityNameProps.
 *
 * @param {Object[]} datatypeProps An array which represents a flattened list of data properties
 * @param {Object[]} objectProps An array which represents a flattened list of object properties
 * @param {Object[]} annotationProps An array which represents a flattened list of annotation properties
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
 */
@Component({
    selector: 'property-tree',
    templateUrl: './propertyTree.component.html'
})
export class PropertyTreeComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit, AfterContentChecked {
    @Input() datatypeProps;
    @Input() objectProps;
    @Input() annotationProps;
    @Input() index;
    @Input() branchId;
    @Output() updateSearch = new EventEmitter<string>();
    @ViewChild('propertyVirtualScroll') virtualScroll;

    indent = INDENT;
    searchText = '';
    filterText = '';
    flatPropertyTree = [];
    filteredHierarchy = [];
    preFilteredHierarchy = [];
    midFilteredHierarchy = [];
    activeTab = '';
    dropdownFilterActive = false;
    dropdownFilters: HierarchyFilter[] = [];
    activeEntityFilter: HierarchyFilter;
    deprecatedEntityFilter: HierarchyFilter;
    chunks = [];
    visibleIndex = 0;
    renderedHierarchy = false;

    constructor(public os: OntologyStateService) {}

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
            name: 'Hide deprecated properties',
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
        this.flatPropertyTree = this.constructFlatPropertyTree();
        setTimeout( () => {
            this.renderedHierarchy = false;
            this.update();
        }, 500);
    }
    ngOnChanges(changesObj: SimpleChanges): void {
        if (!changesObj.datatypeProps || !changesObj.datatypeProps.isFirstChange()) {
            if (changesObj.branchId) {
                this.removeFilters();
            }
            this.flatPropertyTree = this.constructFlatPropertyTree();
            setTimeout( () => {
                this.renderedHierarchy = false;
                this.update();
            }, 500);
        }
    }
    ngAfterContentChecked(): void {
        if (this.filteredHierarchy.length === this.virtualScroll?.getDataLength() && !this.renderedHierarchy) {
            this.createHierarchy();
            this.renderedHierarchy = true;
        }
    }
    ngAfterViewInit(): void {
        this.virtualScroll?.scrolledIndexChange.subscribe(index => {
            this.visibleIndex = index;
        });
    }
    ngOnDestroy(): void {
        if (this.os.listItem?.editorTabStates) {
            this.os.listItem.editorTabStates.properties.index = 0;
        }
    }
    clickItem(entityIRI: string): void {
        this.os.selectItem(entityIRI).subscribe();
    }
    onKeyup(): void {
        this.filterText = this.searchText;
        this.dropdownFilterActive = some(this.dropdownFilters, 'flag');
        setTimeout( () => {
            this.renderedHierarchy = false;
            this.update();
        }, 500);
    }
    toggleOpen(node: HierarchyNode): void {
        node.isOpened = !node.isOpened;
        if (!node.title) {
            this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath] = node.isOpened;
        } else {
            node.set(node.isOpened, OntologyListItem.PROPERTIES_TAB);
            this.os.listItem.editorTabStates[this.activeTab].open[node.title] = node.isOpened;
        }
        this.filteredHierarchy = this.preFilteredHierarchy.filter(node => this.isShown(node));
        this.virtualScroll?.scrollToIndex(this.visibleIndex);
    }
    matchesSearchFilter(node: HierarchyNode): boolean {
        let searchMatch = false;
        // Check all possible name fields and entity fields to see if the value matches the search text
        some(node.entityInfo?.names, name => {
            if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                searchMatch = true;
            }
        });
        if (searchMatch) {
            return true;
        }

        // Check if beautified entity id matches search text
        if (getBeautifulIRI(node.entityIRI).toLowerCase().includes(this.filterText.toLowerCase())) {
            searchMatch = true;
        }

        return searchMatch;
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
    openEntities(node: HierarchyNode): boolean {
        if (node.title) {
            const toOpen = this.os.listItem.editorTabStates[this.activeTab].open[node.title];
            if (toOpen) {
                if (!node.isOpened) {
                    node.isOpened = true;
                    node.set(true, OntologyListItem.PROPERTIES_TAB);
                }
                node.displayNode = true;
            }
            return true;
        } else {
            const toOpen = this.os.listItem.editorTabStates[this.activeTab].open[node.joinedPath];
            if (toOpen) {
                if (!node.isOpened) {
                    node.isOpened = true;
                }
                node.displayNode = true;
            }
            return true;
        }
    }
    searchFilter(node: HierarchyNode): boolean {
        delete node.underline;
        delete node.parentNoMatch;
        delete node.displayNode;

        if (node.title) {
            node.isOpened = node.get(OntologyListItem.PROPERTIES_TAB);
            if (this.filterText || this.dropdownFilterActive) {
                node.parentNoMatch = true;
            } else {
                this.os.listItem.editorTabStates[this.activeTab].open[node.title] = node.isOpened;
            }
        } else {
            if (this.filterText || this.dropdownFilterActive) {
                delete node.isOpened;
                let match = false;
                if (this.matchesSearchFilter(node) && this.matchesDropdownFilters(node)) {
                    match = true;
                    this.openAllParents(node);
                    node.underline = true;
                    if (has(this.os.listItem.dataProperties.iris, node.entityIRI)) {
                        this.os.listItem.editorTabStates[this.activeTab].open['Data Properties'] = true;
                        delete node.parentNoMatch;
                    }
                    if (has(this.os.listItem.objectProperties.iris, node.entityIRI)) {
                        this.os.listItem.editorTabStates[this.activeTab].open['Object Properties'] = true;
                        delete node.parentNoMatch;
                    }
                    if (has(this.os.listItem.annotations.iris, node.entityIRI)) {
                        this.os.listItem.editorTabStates[this.activeTab].open['Annotation Properties'] = true;
                        delete node.parentNoMatch;
                    }
                }
                if (!match && node.hasChildren) {
                    node.parentNoMatch = true;
                    return true;
                }
                return match;
            }
        }
        return true;
    }
    matchesDropdownFilters(node: HierarchyNode): boolean {
        return every(this.dropdownFilters, filter => filter.flag ? filter.filter(node) : true);
    }
    isShown(node: HierarchyNode): boolean {
        const displayNode = !has(node, 'entityIRI') || (this.os.areParentsOpen(node, this.activeTab) && node.get(OntologyListItem.PROPERTIES_TAB));
        if ((this.filterText || this.dropdownFilterActive)&& node.parentNoMatch) {
            if (node.displayNode === undefined) {
                return false;
            } else {
                return displayNode && node.displayNode;
            }
        }
        return displayNode;
    }

    private update() {
        if (this.filterText || this.dropdownFilterActive) {
            this.os.listItem.editorTabStates[this.activeTab].open = {};
        }
        this.updateSearch.emit(this.filterText);
        this.preFilteredHierarchy = this.flatPropertyTree.filter(node => this.searchFilter(node));
        this.midFilteredHierarchy = this.preFilteredHierarchy.filter(node => this.openEntities(node));
        this.filteredHierarchy = this.midFilteredHierarchy.filter(node => this.isShown(node));
        this.createHierarchy();
    }
    private addGetToArrayItems(array, get) {
        return map(array, item => merge(item, {get}));
    }
    private removeFilters() {
        this.dropdownFilterActive = false;
        this.dropdownFilters = [Object.assign({}, this.activeEntityFilter), Object.assign({}, this.deprecatedEntityFilter)];
        this.searchText = '';
        this.filterText = '';
    }
    private constructFlatPropertyTree() {
        let result = [];
        if (this.datatypeProps !== undefined && this.datatypeProps.length) {
            result.push({
                title: 'Data Properties',
                get: this.os.getDataPropertiesOpened.bind(this.os),
                set: this.os.setDataPropertiesOpened.bind(this.os)
            });

            result = concat(result, this.addGetToArrayItems(this.datatypeProps, this.os.getDataPropertiesOpened.bind(this.os)));
        }
        if (this.objectProps !== undefined && this.objectProps.length) {
            result.push({
                title: 'Object Properties',
                get: this.os.getObjectPropertiesOpened.bind(this.os),
                set: this.os.setObjectPropertiesOpened.bind(this.os)
            });
            result = concat(result, this.addGetToArrayItems(this.objectProps, this.os.getObjectPropertiesOpened.bind(this.os)));
        }
        if (this.annotationProps !== undefined && this.annotationProps.length) {
            result.push({
                title: 'Annotation Properties',
                get: this.os.getAnnotationPropertiesOpened.bind(this.os),
                set: this.os.setAnnotationPropertiesOpened.bind(this.os)
            });
            result = concat(result, this.addGetToArrayItems(this.annotationProps, this.os.getAnnotationPropertiesOpened.bind(this.os)));
        }
        return result;
    }
    updateSearchText(value: string): void {
        this.searchText = value;
    }
    updateDropdownFilters(value: HierarchyFilter[]): void {
        this.dropdownFilters = value;
    }
    private createHierarchy():void {
        let selectedIndex;
        if (this.os.listItem.selected) {
            selectedIndex = findIndex(this.filteredHierarchy, (entity) => {
                if (entity.entityIRI === this.os.listItem.selected['@id']) {
                    return true;
                } else {
                    return false;
                }
            });
            selectedIndex < 0 ? this.virtualScroll?.scrollToIndex(0) : this.virtualScroll?.scrollToIndex(selectedIndex);
        } else {
            this.virtualScroll?.scrollToIndex(this.index);
        }
    }
}
