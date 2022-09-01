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

import { has, head, map, get, forEach, omit, find, mergeWith, isArray } from 'lodash';
import {first, switchMap} from 'rxjs/operators';
import { Component, Inject, OnChanges, Input } from '@angular/core';
import { CommitDifference } from '../../models/commitDifference.interface';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { CatalogManagerService } from '../../services/catalogManager.service';
import { OntologyManagerService } from '../../services/ontologyManager.service';

import './commitCompiledResource.component.scss';
import {OntologyStateService} from '../../services/ontologyState.service';

/**
 * @ngdoc component
 * @name shared.component:commitCompiledResource
 * @requires shared.service:httpService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:utilService
 *
 * @description
 * `commitCompiledResource` is a component that displays the compiled resource of the entity identified by the
 * provided `commitId` starting at the commit identified by the provided `commitId`. The display will include all
 * deleted statements from the commit styled to be easily identified. All added statements in the commit will also
 * be styled to be easily identified.
 *
 * @param {string} commitId The IRI string of a commit in the local catalog
 * @param {string} entityId entityId The IRI string of the entity to display
 * @param {Function} [entityNameFunc=undefined] An optional function to control how entity names are displayed.
 */
@Component({
    selector: 'commit-compiled-resource',
    templateUrl: './commitCompiledResource.component.html'
})

export class CommitCompiledResourceComponent implements OnChanges {
    @Input() commitId;
    @Input() entityId;
    @Input() entityNameFunc;
    error = '';
    resource = undefined;
    types = [];
    id = 'commit-compiled-resource';
    
    constructor(public cm: CatalogManagerService, public om: OntologyManagerService,
                public os: OntologyStateService, @Inject('utilService') public util) {}

    ngOnChanges(changes) {
        if (has(changes, 'commitId') || has(changes, 'entityId')) {
            this.setResource();
        }
    }
    setResource() {
        if (this.commitId) {
            // httpService.cancel(this.id);
            this.cm.getCompiledResource(this.commitId, this.entityId, true)
                .pipe(
                    first(),
                    switchMap( (resources: JSONLDObject[]) => {
                        const resource : any = head(resources) || {};
                        this.types = map(get(resource, '@type', []), type => ({type}));
                        this.resource = omit(resource, ['@id', '@type']);
                        return this.cm.getDifferenceForSubject(this.entityId, this.commitId).pipe(first());
                    })
                )
                .subscribe((response: CommitDifference) => {
                    const additionsObj = find(response.additions as JSONLDObject[], {'@id': this.entityId});
                    const deletionsObj = find(response.deletions as JSONLDObject[], {'@id': this.entityId});
                    forEach(get(additionsObj, '@type'), addedType => {
                        let typeObj = find(this.types, {type: addedType});
                        typeObj.add = true;
                    });
                    this.types = this.types.concat(map(get(deletionsObj, '@type', []), type => ({type, del: true})));
                    const additions = omit(additionsObj, ['@id', '@type']);
                    const deletions = omit(deletionsObj, ['@id', '@type']);
                    forEach(additions, (values, prop) => {
                        forEach(values, value => {
                            let resourceVal: any = find(this.resource[prop], value);
                            if (resourceVal) {
                                resourceVal.add = true;
                            }
                        });
                    });
                    forEach(deletions, (values, prop) => {
                        forEach(values, value => { value.del = true });
                    });
                    mergeWith(this.resource, deletions, (objValue, srcValue) => {
                        if (isArray(objValue)) {
                            return objValue.concat(srcValue);
                        }
                    });
                    this.error = '';
                }, errorMessage => {
                    this.error = errorMessage;
                    this.resource = undefined;
                    this.types = [];
                });
        } else {
            this.resource = undefined;
            this.types = [];
        }
    }
}
