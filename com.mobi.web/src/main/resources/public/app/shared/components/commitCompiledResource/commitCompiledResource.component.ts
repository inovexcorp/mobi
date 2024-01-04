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

import { has, map, get, forEach, omit, find, cloneDeep } from 'lodash';
import { Component, OnChanges, Input, ViewChild, ElementRef, SimpleChanges } from '@angular/core';

import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { Difference } from '../../models/difference.class';
import { getBeautifulIRI, isBlankNodeId } from '../../utility';
import { JSONLDId } from '../../models/JSONLDId.interface';
import { JSONLDValue } from '../../models/JSONLDValue.interface';

interface JSONLDIdDisplay extends JSONLDId {
    add?: boolean,
    del?: boolean
}

interface JSONLDValueDisplay extends JSONLDValue {
  add?: boolean,
  del?: boolean
}

/**
 * @class shared.CommitCompiledResourceComponent
 *
 * A component that displays the compiled resource of the entity identified by the provided `commitId` starting at the
 * commit identified by the provided `commitId`. The display will include all deleted statements from the commit styled
 * to be easily identified. All added statements in the commit will also be styled to be easily identified.
 *
 * @param {string} commitId The IRI string of a commit in the local catalog
 * @param {string} entityId entityId The IRI string of the entity to display
 * @param {Function} [entityNameFunc=undefined] An optional function to control how entity names are displayed.
 */
@Component({
    selector: 'commit-compiled-resource',
    templateUrl: './commitCompiledResource.component.html',
    styleUrls: ['./commitCompiledResource.component.scss']
})
export class CommitCompiledResourceComponent implements OnChanges {
    @Input() entityId;
    @Input() entityNameFunc;

    @Input() triples?: JSONLDObject;
    @Input() changes: Difference;

    readonly isBlankNodeId = isBlankNodeId;
    resource: {[key: string]: (JSONLDIdDisplay | JSONLDValueDisplay)[] } = undefined;
    types: {type: string, add?: boolean, del?: boolean}[] = [];

    @ViewChild('compiledResource', { static: true }) compiledResource: ElementRef;
    
    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (has(changes, 'triples') || has(changes, 'changes')) {
            this.setResource();
        }
    }
    getDisplay(str: string): string {
      return this.entityNameFunc ? this.entityNameFunc(str) : getBeautifulIRI(str);
    }
    setResource(): void {
        if (this.triples || this.changes) {
            this.types = map(get(this.triples, '@type', []), type => ({type}));
            this.resource = omit(cloneDeep(this.triples), ['@id', '@type']);
            const additionsObj = find(this.changes ? this.changes.additions as JSONLDObject[] : [], {'@id': this.entityId});
            const deletionsObj = find(this.changes ?this.changes.deletions as JSONLDObject[] : [], {'@id': this.entityId});
            forEach(get(additionsObj, '@type'), addedType => {
                const typeObj = find(this.types, {type: addedType});
                if (typeObj) {
                    typeObj.add = true;
                } else {
                    this.types.push({type: addedType, add: true});
                }
            });
            forEach(get(deletionsObj, '@type'), deletedType => {
                const typeObj = find(this.types, {type: deletedType});
                if (typeObj) {
                    typeObj.del = true;
                } else {
                    this.types.push({type: deletedType, del: true});
                }
            });
            const additions = omit(additionsObj, ['@id', '@type']);
            const deletions = omit(deletionsObj, ['@id', '@type']);
            forEach(additions, (values, prop) => {
                forEach(values, value => {
                    const resourceVal: JSONLDIdDisplay | JSONLDValueDisplay = find(this.resource[prop], value);
                    if (resourceVal) {
                        resourceVal.add = true;
                    } else {
                        const newValue = Object.assign({}, value);
                        newValue.add = true;
                        if (this.resource[prop]) {
                            this.resource[prop].push(newValue);
                        } else {
                            this.resource[prop] = [newValue];
                        }
                    }
                });
            });
            forEach(deletions, (values, prop) => {
                forEach(values, value => {
                    const resourceVal: JSONLDIdDisplay | JSONLDValueDisplay = find(this.resource[prop], value);
                    if (resourceVal) {
                        resourceVal.del = true;
                    } else {
                        const newValue = Object.assign({}, value);
                        newValue.del = true;
                        if (this.resource[prop]) {
                            this.resource[prop].push(newValue);
                        } else {
                            this.resource[prop] = [newValue];
                        }
                    }
                });
            });
        } else {
            this.resource = undefined;
            this.types = [];
        }
    }
}
