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
import { get, chunk, union } from 'lodash';
import { Component, Input, OnInit, OnChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { SPARQLSelectBinding } from '../../../shared/models/sparqlSelectResults.interface';

/**
 * @class ontology-editor.UsagesBlockComponent
 *
 * A component that creates a section that displays the provided usages of the
 * {@link shared.OntologyStateService#listItem selected entity} using
 * {@link ontology-editor.PropertyValuesComponent}. The usages are only shown 100 at a time to save rendering
 * time with a link at the bottom to load more.
 * 
 * @param {Object[]} usages An array of usage results for the selected entity
 */

@Component({
    selector: 'usages-block',
    templateUrl: './usagesBlock.component.html',
    styleUrls: ['./usagesBlock.component.scss']
})
export class UsagesBlockComponent implements OnInit, OnChanges, OnDestroy {
    @Input() usages: SPARQLSelectBinding[];

    size = 100;
    index = 0;
    id = '';
    results: {[key: string]: {subject: string, predicate: string, object: string}[]} = {};
    total = 0;
    shown = 0;
    chunks = 0;

    @ViewChild('usagesContainer', { static: true }) usagesContainer: ElementRef;

    constructor(public os: OntologyStateService) {}
    
    ngOnInit(): void {
        this.os.getActivePage().usagesElement = this.usagesContainer;
    }
    ngOnChanges(): void {
        this.size = 100;
        this.index = 0;
        this.shown = 0;
        this.results = this.getResults();
    }
    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.getActivePage().usagesElement = undefined;
        }
    }
    getMoreResults(): void {
        this.index++;
        get(chunk(this.usages, this.size), this.index, [])
            .forEach((binding: SPARQLSelectBinding) => this.addToResults(this.results, binding));
    }
    getResults(): {[key: string]: {subject: string, predicate: string, object: string}[]} {
        const results: {[key: string]: {subject: string, predicate: string, object: string}[]} = {};
        this.total = get(this.usages, 'length');
        const chunks = chunk(this.usages, this.size);
        this.chunks = chunks.length === 0 ? 0 : chunks.length - 1;
        get(chunks, this.index, []).forEach((binding: SPARQLSelectBinding) => this.addToResults(results, binding));
        return results;
    }

    private addToResults(results: {[key: string]: {subject: string, predicate: string, object: string}[]}, 
      binding: SPARQLSelectBinding) {
        results[binding.p.value] = union(
            get(results, binding.p.value, []), 
            [{subject: binding.s.value, predicate: binding.p.value, object: binding.o.value}]
        );
        this.shown++;
    }

}
