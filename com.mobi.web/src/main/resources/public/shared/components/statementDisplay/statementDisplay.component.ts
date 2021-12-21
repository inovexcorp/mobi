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
import { Component, Input, OnInit } from '@angular/core';
import { has, get } from 'lodash';
import './statementDisplay.component.scss';
import { CommitChange } from '../../models/commitChange.interface';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { SplitIRIPipe } from '../../pipes/splitIRI.pipe';

/**
 * @ngdoc component
 * @name shared.component:statementDisplay
 *
 * @description
 * `statementDisplay` is a component that creates a div displaying the provided predicate and object.
 *
 * @param {string} predicate A string of the predicate to display
 * @param {Object} object An object representing the object of a triple to display
 * @param {Function} [entityNameFunc=undefined] An optional function to retrieve the name of an entity by its IRI.
 */
@Component({
    selector: 'statement-display',
    templateUrl: './statementDisplay.component.html'
})
export class StatementDisplayComponent implements OnInit {
    @Input() predicate: string;
    @Input() object: CommitChange;
    @Input() entityNameFunc: (args: any) => string;

    fullObject: string;
    o: string;

    constructor(private splitIRI: SplitIRIPipe, private prefixation: PrefixationPipe) {}

    ngOnInit(): void {
        if (has(this.object, '@id')) {
            this.fullObject = this.object['@id'];
            if (this.entityNameFunc) {
                this.o = this.entityNameFunc(this.fullObject) + ' <' + this.fullObject + '>';
            } else {
                const split: string = this.splitIRI.transform(this.fullObject).end;
                this.o = split ? split + ' <' + this.fullObject + '>' : this.fullObject;
            }
        } else {
            this.o = get(this.object, '@value', this.object)
                + (has(this.object, '@language') ? ' [language: ' + this.object['@language'] + ']' : '')
                + (has(this.object, '@type') ? ' [type: ' + this.prefixation.transform(this.object['@type']) + ']' : '');
            this.fullObject = this.o;
        }
    }
}
