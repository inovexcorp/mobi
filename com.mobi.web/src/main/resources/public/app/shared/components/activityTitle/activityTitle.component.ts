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
import { get } from 'lodash';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { UserManagerService } from '../../services/userManager.service';
import { User } from '../../models/user.class';
import { PROV } from '../../../prefixes';
import { ProvManagerService } from '../../services/provManager.service';
import { JSONLDObject } from '../../models/JSONLDObject.interface';
import { getDctermsValue, getEntityName, getPropertyId } from '../../utility';

/**
 * @class home.ActivityTitleComponent
 *
 * `activity-title` is a component which creates a `div` containing a title for the provided `Activity` using
 * the display name of the associated user, the word associated with the type of Activity, and the titles of the
 * main associated `Entities`. The word and the predicate to retrieve `Entities` with are collected from the
 * {@link shared.provManagerService provManagerService}.
 *
 * @param {Object} activity A JSON-LD object of an `Activity`
 * @param {Object[]} entities An array of JSON-LD objects of `Entities`
 */
@Component({
    selector: 'activity-title',
    templateUrl: './activityTitle.component.html',
    styleUrls: ['./activityTitle.component.scss']
})
export class ActivityTitleComponent implements OnInit, OnChanges {
    @Input() activity;
    @Input() entities;

    public username = '[Not Available]';
    public userDisplay = '[Not Available]';
    public word = 'affected';
    public entitiesStr = '(None)';

    constructor(private pm: ProvManagerService, private um: UserManagerService) {}
    
    ngOnInit(): void {
        this.setUserDisplay(getPropertyId(this.activity, `${PROV}wasAssociatedWith`));
        this.setWord(this.activity);
        this.setEntities(this.activity);
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.activity) {
            this.setUserDisplay(getPropertyId(changes.activity.currentValue, `${PROV}wasAssociatedWith`));
            this.setWord(changes.activity.currentValue);
            this.setEntities(changes.activity.currentValue);
        }
    }
    setEntities(activity: JSONLDObject): void {
        const types = get(activity, '@type', []);
        let pred = '';
        this.pm.activityTypes.forEach(obj => {
            if (types.includes(obj.type)) {
                pred = obj.pred;
                return false;
            }
        });
        const entityTitles = get(activity, `['${pred}']`, []).map(idObj => {
            const entity = this.entities.find(obj => obj['@id'] === idObj['@id']);
            return getEntityName(entity) || getDctermsValue(entity, 'title');
        });
        this.entitiesStr = entityTitles.join(', ').replace(/,(?!.*,)/gmi, ' and') || '(None)';
    }
    setUserDisplay(iri: string): void {
        if (iri) {
            const user = this.um.users.find((user: User) => user.iri === iri);
            this.username = user ? user.username : '[Not Available]';
            this.userDisplay = user ? user.displayName : '[Not Available]';
        } else {
            this.username = '[Not Available]';
            this.userDisplay = '[Not Available]';
        }
    }
    setWord(activity: JSONLDObject): void {
        const types = get(activity, '@type', []);
        this.pm.activityTypes.forEach(obj => {
            if (types.includes(obj.type)) {
                this.word = obj.word;
                return false;
            }
        });
    }
}
