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
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { difference, get, remove, set, pull, unset, some } from 'lodash';
import { OWL } from '../../../prefixes';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.IndividualTypesModalComponent
 *
 * A component that creates content for a modal that edits the types of the selected individual in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a 'mat-autocomplete'
 * for the classes this individual will be an instance of. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'individual-types-modal',
    templateUrl: './individualTypesModal.component.html'
})
export class IndividualTypesModalComponent implements OnInit {
    entityName = '';
    types = [];
    error = '';
    namedIndividualIri = `${OWL}NamedIndividual`;

    constructor(private matDialogRef: MatDialogRef<IndividualTypesModalComponent>, public om: OntologyManagerService,
        public os: OntologyStateService) {}
    
    ngOnInit(): void {
        this.entityName = this.om.getEntityName(this.os.listItem.selected);
        this.types = Object.assign([], this.os.listItem.selected['@type']);
    }
    submit(): void {
        // Ensure the Individual has at least type that's an actual class so it doesn't disappear from the UI
        if (!some(this.types, type => type in this.os.listItem.classes.iris)) {
            this.error = 'Types must include at least one defined Class';
            return;
        }
        const originalTypes = Object.assign([], this.os.listItem.selected['@type']);
        
        // Handle vocabulary stuff
        let wasConcept = this.os.containsDerivedConcept(originalTypes);
        let isConcept = this.os.containsDerivedConcept(this.types);
        let wasConceptScheme = this.os.containsDerivedConceptScheme(originalTypes);
        let isConceptScheme = this.os.containsDerivedConceptScheme(this.types);

        if (isConcept && isConceptScheme) {
            this.error = 'Individual cannot be both a Concept and Concept Scheme';
            return;
        }

        this.os.listItem.selected['@type'] = this.types;
        
        const addedTypes = difference(this.types, originalTypes);
        const removedTypes = difference(originalTypes, this.types);

        if (addedTypes.length || removedTypes.length) {
            let unselect = false;

            // Handle vocabulary stuff
            wasConcept = this.os.containsDerivedConcept(originalTypes);
            isConcept = this.os.containsDerivedConcept(this.types);
            wasConceptScheme = this.os.containsDerivedConceptScheme(originalTypes);
            isConceptScheme = this.os.containsDerivedConceptScheme(this.types);

            // Handle added types
            addedTypes.forEach((type: string) => {
                const indivs = get(this.os.listItem.classesAndIndividuals, type, []);
                indivs.push(this.os.listItem.selected['@id']);
                this.os.listItem.classesAndIndividuals[type] = indivs;
            });

            // Handle removed types
            removedTypes.forEach((type: string ) => {
                const parentAndIndivs = get(this.os.listItem.classesAndIndividuals, `['${type}']`, []);
                if (parentAndIndivs.length) {
                    remove(parentAndIndivs, item => item === this.os.listItem.selected['@id']);
                    if (!parentAndIndivs.length) {
                        delete this.os.listItem.classesAndIndividuals[type];
                    }
                }
            });

            set(this.os.listItem, 'classesWithIndividuals', Object.keys(this.os.listItem.classesAndIndividuals));
            this.os.listItem.individualsParentPath = this.os.getIndividualsParentPath(this.os.listItem);
            this.os.listItem.individuals.flat = this.os.createFlatIndividualTree(this.os.listItem);

            // Made into a Concept
            if (!wasConcept && isConcept) {
                this.os.addConcept(this.os.listItem.selected);
                pull(Object.keys(this.os.listItem.selected), '@id', '@type').forEach(key => {
                    this.os.updateVocabularyHierarchies(key, this.os.listItem.selected[key]);
                });
            }
            // No longer a Concept
            if (!isConcept && wasConcept) {
                delete this.os.listItem.concepts.iris[this.os.listItem.selected['@id']];                                
                this.os.deleteEntityFromHierarchy(this.os.listItem.concepts, this.os.listItem.selected['@id']);
                this.os.deleteEntityFromHierarchy(this.os.listItem.conceptSchemes, this.os.listItem.selected['@id']);
                this.os.listItem.concepts.flat = this.os.flattenHierarchy(this.os.listItem.concepts);
                this.os.listItem.conceptSchemes.flat = this.os.flattenHierarchy(this.os.listItem.conceptSchemes);
                if (this.os.listItem.editorTabStates.concepts.entityIRI === this.os.listItem.selected['@id']) {
                    unset(this.os.listItem.editorTabStates.concepts, 'entityIRI');
                    unset(this.os.listItem.editorTabStates.concepts, 'usages');
                    if (this.os.getActiveKey() === 'concepts') {
                        unselect = true;
                    }
                }
                if (this.os.listItem.editorTabStates.schemes.entityIRI === this.os.listItem.selected['@id']) {
                    unset(this.os.listItem.editorTabStates.schemes, 'entityIRI');
                    unset(this.os.listItem.editorTabStates.schemes, 'usages');
                    if (this.os.getActiveKey() === 'schemes') {
                        unselect = true;
                    }
                }
            }
            // Made into a Concept Scheme
            if (!wasConceptScheme && isConceptScheme) {
                this.os.addConceptScheme(this.os.listItem.selected);
                pull(Object.keys(this.os.listItem.selected), '@id', '@type').forEach(key => {
                    this.os.updateVocabularyHierarchies(key, this.os.listItem.selected[key]);
                });
            }
            // No longer a Concept Scheme
            if (!isConceptScheme && wasConceptScheme) {
                delete this.os.listItem.conceptSchemes.iris[this.os.listItem.selected['@id']];                                
                this.os.deleteEntityFromHierarchy(this.os.listItem.conceptSchemes, this.os.listItem.selected['@id']);
                this.os.listItem.conceptSchemes.flat = this.os.flattenHierarchy(this.os.listItem.conceptSchemes);
                if (this.os.listItem.editorTabStates.schemes.entityIRI === this.os.listItem.selected['@id']) {
                    unset(this.os.listItem.editorTabStates.schemes, 'entityIRI');
                    unset(this.os.listItem.editorTabStates.schemes, 'usages');
                    if (this.os.getActiveKey() === 'schemes') {
                        unselect = true;
                    }
                }
            }
            if (addedTypes.length) {
                this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {'@id': this.os.listItem.selected['@id'], '@type': addedTypes});
            }
            if (removedTypes.length) {
                this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, {'@id': this.os.listItem.selected['@id'], '@type': removedTypes});
            }
            if (unselect) {
                this.os.unSelectItem();
            }
            this.os.saveCurrentChanges().subscribe();
            this.matDialogRef.close();
        } else {
            this.matDialogRef.close();
        }
    }
}
