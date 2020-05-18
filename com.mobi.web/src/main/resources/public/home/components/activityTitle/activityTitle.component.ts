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
import { get } from 'lodash';
import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";

import './activityTitle.component.scss';

/**
 * @class home.ActivityTitleComponent
 *
 * `activity-title` is a component which creates a `div` containing a title for the provided `Activity` using
 * the username of the associated user, the word associated with the type of Activity, and the titles of the
 * main associated `Entities`. The word and the predicate to retrieve `Entities` with are collected from the
 * {@link shared.provManagerService provManagerService}.
 *
 * @param {Object} activity A JSON-LD object of an `Activity`
 * @param {Object[]} entities An array of JSON-LD objects of `Entities`
 */
@Component({
    selector: 'activity-title',
    templateUrl: './activityTitle.component.html'
})
export class ActivityTitleComponent implements OnInit, OnChanges {
    @Input() activity;
    @Input() entities;

    public username = '(None)';
    public word = 'affected';
    public entitiesStr = '(None)';

    constructor(@Inject('provManagerService') private pm, @Inject('utilService') private util,
                @Inject('userManagerService') private um, @Inject('prefixes') private prefixes) {
    }
    
    ngOnInit(): void {
        this.setUsername(this.util.getPropertyId(this.activity, this.prefixes.prov + 'wasAssociatedWith'));
        this.setWord(this.activity);
        this.setEntities(this.activity);
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.activity) {
            this.setUsername(this.util.getPropertyId(changes.activity.currentValue, this.prefixes.prov + 'wasAssociatedWith'));
            this.setWord(changes.activity.currentValue);
            this.setEntities(changes.activity.currentValue);
        }
    }
    setEntities(activity) {
        let types = get(activity, '@type', []);
        let pred = '';
        this.pm.activityTypes.forEach(obj => {
            if (types.includes(obj.type)) {
                pred = obj.pred;
                return false;
            }
        });
        let entityTitles = get(activity, "['" + pred + "']", []).map(idObj => {
            let entity = this.entities.find(obj => obj['@id'] === idObj['@id']);
            return this.util.getDctermsValue(entity, 'title');
        });
        this.entitiesStr = entityTitles.join(', ').replace(/,(?!.*,)/gmi, ' and') || '(None)';
    }
    setUsername(iri) {
        if (iri) {
            this.username = get(this.um.users.find(user => user.iri === iri), 'username', '(None)');
        } else {
            this.username = '(None)';
        }
    }
    setWord(activity) {
        let types = get(activity, '@type', []);
        this.pm.activityTypes.forEach(obj => {
            if (types.includes(obj.type)) {
                this.word = obj.word;
                return false;
            }
        });
    }
}