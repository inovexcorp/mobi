/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { includes } from 'lodash';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { AxiomOverlayComponent } from '../axiomOverlay/axiomOverlay.component';
import { RDFS } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';

/**
 * @class ontology-editor.AxiomBlockComponent
 *
 * A component that creates a section that displays the appropriate axioms on the
 * {@link shared.OntologyStateService#listItem selected entity} based on its type. The components used for display
 * are {@link ontology-editor.ClassAxiomsComponent}, {@link ontology-editor.ObjectPropertyAxiomsComponent}, and
 * {@link ontology-editor.DatatypePropertyAxiomsComponent}. The section header contains a button for adding an axiom.
 * The component houses the methods for opening the modal for {@link ontology-editor.AxiomOverlayComponent adding} and
 * removing axioms. 
 */

@Component({
    selector: ' axiom-block',
    templateUrl: './axiomBlock.component.html'
})
export class AxiomBlockComponent {
    constructor(public om: OntologyManagerService, public os: OntologyStateService, private dialog: MatDialog,
                private pm: PropertyManagerService) {}

    showAxiomOverlay(): void {
        if (this.om.isClass(this.os.listItem.selected)) {
            this.dialog.open(AxiomOverlayComponent, {
                data: {
                    axiomList: this.pm.classAxiomList
                }
            }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
                if (result) {
                    this.updateClassHierarchy(result);
                }
            });
        } else if (this.om.isObjectProperty(this.os.listItem.selected)) {
            this.dialog.open(AxiomOverlayComponent, {
                data: {
                    axiomList: this.pm.objectAxiomList
                }
            }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
                if (result) {
                    this.updateObjectPropHierarchy(result);
                }
            });
        } else if (this.om.isDataTypeProperty(this.os.listItem.selected)) {
            this.dialog.open(AxiomOverlayComponent, {
                data: {
                    axiomList: this.pm.datatypeAxiomList
                }
            }).afterClosed().subscribe((result: { axiom: string, values: string[] }) => {
                if (result) {
                    this.updateDataPropHierarchy(result);
                }
            });
        }
    }
    updateClassHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
        if (updatedAxiomObj.axiom === `${RDFS}subClassOf` && updatedAxiomObj.values.length) {
            this.os.setSuperClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
            if (includes(this.os.listItem.individualsParentPath, this.os.listItem.selected['@id'])) {
                this.os.updateFlatIndividualsHierarchy(updatedAxiomObj.values);
            }
            this.os.setVocabularyStuff();
        }
    }
    updateDataPropHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
        if (updatedAxiomObj.axiom === `${RDFS}subPropertyOf` && updatedAxiomObj.values.length) {
            this.os.setSuperProperties(this.os.listItem.selected['@id'], updatedAxiomObj.values, 'dataProperties');
        } else if (updatedAxiomObj.axiom === `${RDFS}domain` && updatedAxiomObj.values.length) {
            this.os.addPropertyToClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
            this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
        }
    }
    updateObjectPropHierarchy(updatedAxiomObj: { axiom: string, values: string[] }): void {
        if (updatedAxiomObj.axiom === `${RDFS}subPropertyOf` && updatedAxiomObj.values.length) {
            this.os.setSuperProperties(this.os.listItem.selected['@id'], updatedAxiomObj.values, 'objectProperties');
            if (this.os.containsDerivedSemanticRelation(updatedAxiomObj.values)) {
                this.os.setVocabularyStuff();
            }
        } else if (updatedAxiomObj.axiom === `${RDFS}domain` && updatedAxiomObj.values.length) {
            this.os.addPropertyToClasses(this.os.listItem.selected['@id'], updatedAxiomObj.values);
            this.os.listItem.flatEverythingTree = this.os.createFlatEverythingTree(this.os.listItem);
        }
    }
}
