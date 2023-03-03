/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.ProjectTabComponent
 *
 * A component that creates a page containing information about the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The display includes a
 * {@link ontology-editor.SelectedDetailsComponent}, an
 * {@link ontology-editor.OntologyPropertiesBlockComponent}, an
 * {@link ontology-editor.ImportsBlockComponent}, and a {@link ontology-editor.PreviewBlockComponent}.
 */
@Component({
    selector: 'project-tab',
    templateUrl: './projectTab.component.html'
})
export class ProjectTabComponent implements OnInit, OnDestroy {
    @ViewChild('projectTab', { static: true }) projectTab: ElementRef;
    
    constructor(public os: OntologyStateService) {}

    ngOnDestroy(): void {
        if (this.os.listItem) {
            this.os.listItem.editorTabStates.project.element = undefined;
        }
    }
    ngOnInit(): void {
        this.os.listItem.editorTabStates.project.element = this.projectTab;
    }
}
