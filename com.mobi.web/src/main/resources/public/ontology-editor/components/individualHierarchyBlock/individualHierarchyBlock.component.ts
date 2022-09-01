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
import { Component } from '@angular/core';

import { OntologyStateService } from "../../../shared/services/ontologyState.service";

const template = require('./individualHierarchyBlock.component.html');

/**
 * @ngdoc component
 * @class ontology-editor.IndividualHierarchyBlockComponent
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `individualHierarchyBlock` is a component that creates a section that displays a
 * {@link ontology-editor.IndividualTreeComponent} of the individuals in the current
 * {@link shared.OntologyStateService#listItem selected ontology} underneath their class types.
 */
@Component({
    templateUrl: './individualHierarchyBlock.component.html',
    selector: 'individual-hierarchy-block'
})
export class IndividualHierarchyBlockComponent {
    constructor(public os:OntologyStateService) {
    }

    updateSearch (value:string): void {
        this.os.listItem.editorTabStates.individuals.searchText = value;
    }
}