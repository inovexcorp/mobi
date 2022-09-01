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
import { MatDialog, MatDialogRef } from '@angular/material';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CreateAnnotationPropertyOverlayComponent } from '../createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.component';
import { CreateClassOverlayComponent } from '../createClassOverlay/createClassOverlay.component';
import { CreateConceptOverlayComponent } from '../createConceptOverlay/createConceptOverlay.component';
import { CreateConceptSchemeOverlayComponent } from '../createConceptSchemeOverlay/createConceptSchemeOverlay.component';
import { CreateDataPropertyOverlayComponent } from '../createDataPropertyOverlay/createDataPropertyOverlay.component';
import { CreateIndividualOverlayComponent } from '../createIndividualOverlay/createIndividualOverlay.component';
import { CreateObjectPropertyOverlayComponent } from '../createObjectPropertyOverlay/createObjectPropertyOverlay.component';

import './createEntityModal.component.scss';

/**
 * @class ontology-editor.CreateEntityModalComponent
 *
 * A component that creates content for a modal that provides buttons to create different types of entities in the
 * current {@link shared.OntologyStateService#listItem selected ontology}. The
 * options are {@link ontology-editor.CreateClassOverlayComponent classes},
 * {@link ontology-editor.CreateDataPropertyOverlayComponent data properties},
 * {@link ontology-editor.CreateObjectPropertyOverlayComponent object properties},
 * {@link ontology-editor.CreateAnnotationPropertyOverlayComponent annotations properties},
 * {@link ontology-editor.CreateIndividualOverlayComponent individuals}
 * {@link ontology-editor.CreateConceptOverlayComponent concepts} if ontology is a vocabulary, and
 * {@link ontology-editor.CreateConceptSchemeOverlayComponent concept schemes} if ontology is a
 * vocabulary. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-entity-modal',
    templateUrl: './createEntityModal.component.html',
})
export class CreateEntityModalComponent {

    constructor(private dialogRef: MatDialogRef<CreateEntityModalComponent>,
        public os: OntologyStateService,
        private dialog: MatDialog) {}

    createClass(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateClassOverlayComponent);
    }
    createDataProperty(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateDataPropertyOverlayComponent); 
    }
    createObjectProperty(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateObjectPropertyOverlayComponent); 
    }
    createAnnotationProperty(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateAnnotationPropertyOverlayComponent); 
    }
    createIndividual(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateIndividualOverlayComponent); 
    }
    createConcept(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateConceptOverlayComponent);
    }
    createConceptScheme(): void  {
        this.dialogRef.close();
        this.dialog.open(CreateConceptSchemeOverlayComponent);
    }
}