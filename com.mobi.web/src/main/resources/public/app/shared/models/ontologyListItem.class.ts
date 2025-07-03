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
import { MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { cloneDeep } from 'lodash';

import { EntityNames } from './entityNames.interface';
import { Hierarchy } from './hierarchy.interface';
import { HierarchyNode } from './hierarchyNode.interface';
import { ParentNode } from './parentNode.interface';
import { VersionedRdfListItem } from './versionedRdfListItem.class';
import { YasguiQuery } from './yasguiQuery.class';

const ontologyEditorTabStates = {
    project: {
        entityIRI: '',
        element: undefined,
    },
    overview: {
        searchText: '',
        open: {},
        element: undefined,
        usagesElement: undefined
    },
    classes: {
        searchText: '',
        index: 0,
        open: {},
        element: undefined,
        usagesElement: undefined
    },
    properties: {
        searchText: '',
        index: 0,
        open: {},
        element: undefined,
        usagesElement: undefined
    },
    individuals: {
        searchText: '',
        index: 0,
        open: {},
        element: undefined,
    },
    concepts: {
        searchText: '',
        index: 0,
        open: {},
        element: undefined,
        usagesElement: undefined
    },
    schemes: {
        searchText: '',
        index: 0,
        open: {},
        element: undefined,
        usagesElement: undefined
    },
    search: {
        openIndex: 0
    },
    visualization: {
        targetedSpinnerId: 'visualization-spinner'
    }
};

export class OntologyListItem extends VersionedRdfListItem {
    ontologyId: string
    isVocabulary: boolean
    editorTabStates: any
    createdFromExists: boolean
    derivedConcepts: string[]
    derivedConceptSchemes: string[]
    derivedSemanticRelations: string[]
    deprecatedIris: {[key: string]: string}
    classes: Hierarchy
    dataProperties: Hierarchy
    objectProperties: Hierarchy
    annotations: Hierarchy
    individuals: {
        iris: {[key: string]: string},
        flat: HierarchyNode[]
    };
    flatEverythingTree: (HierarchyNode|ParentNode)[]
    concepts: Hierarchy
    conceptSchemes: Hierarchy
    entityInfo: EntityNames
    classesAndIndividuals: {[key: string]: string[]}
    classesWithIndividuals: string[]
    individualsParentPath: string[]
    propertyIcons: {[key: string]: string}
    noDomainProperties: string[]
    classToChildProperties: {[key: string]: string[]}
    iriList: string[]
    seeHistory: boolean
    openSnackbar: MatSnackBarRef<SimpleSnackBar>
    iriBegin: string
    iriThen: string
    query: YasguiQuery

    static PROJECT_TAB = 0;
    static OVERVIEW_TAB = 1;
    static CLASSES_TAB = 2;
    static PROPERTIES_TAB = 3;
    static INDIVIDUALS_TAB = 4;
    static CONCEPTS_SCHEMES_TAB = 5;
    static CONCEPTS_TAB = 6;
    static SEARCH_TAB = 7;
    static VISUALIZATION_TAB = 8;

    constructor() {
        super();
        this.tabIndex = OntologyListItem.PROJECT_TAB;
        this.ontologyId = '';
        this.isVocabulary = false;
        this.editorTabStates = cloneDeep(ontologyEditorTabStates);
        this.createdFromExists = true;
        this.userCanModify = false;
        this.userCanModifyMaster = false;
        this.derivedConcepts = [];
        this.derivedConceptSchemes = [];
        this.derivedSemanticRelations = [];
        this.classes = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.dataProperties = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.objectProperties = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.annotations = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.individuals = {
            iris: {},
            flat: []
        };
        this.flatEverythingTree = [];
        this.concepts = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.conceptSchemes = {
            iris: {},
            parentMap: {},
            childMap: {},
            circularMap: {},
            flat: []
        };
        this.entityInfo = {};
        this.classesAndIndividuals = {};
        this.classesWithIndividuals = [];
        this.individualsParentPath = [];
        this.propertyIcons = {};
        this.noDomainProperties = [];
        this.classToChildProperties = {};
        this.iriList = [];
        this.seeHistory = false;
        this.iriBegin = '';
        this.iriThen = '';
        this.query = new YasguiQuery();
    }
}
