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
import * as angular from 'angular';
import { EntityNames } from './entityNames.interface';
import { Hierarchy } from './hierarchy.interface';
import { HierarchyNode } from './hierarchyNode.interface';
import { JSONLDObject } from './JSONLDObject.interface';
import { ParentNode } from './parentNode.interface';
import { VersionedRdfListItem } from './versionedRdfListItem.class';

const ontologyEditorTabStates = {
    project: {
        entityIRI: '',
        active: true,
        targetedSpinnerId: 'project-entity-spinner'
    },
    overview: {
        active: false,
        searchText: '',
        open: {},
        targetedSpinnerId: 'overview-entity-spinner'
    },
    classes: {
        active: false,
        searchText: '',
        index: 0,
        open: {},
        targetedSpinnerId: 'classes-entity-spinner'
    },
    properties: {
        active: false,
        searchText: '',
        index: 0,
        open: {},
        targetedSpinnerId: 'properties-entity-spinner'
    },
    individuals: {
        active: false,
        searchText: '',
        index: 0,
        open: {},
        targetedSpinnerId: 'individuals-entity-spinner'
    },
    concepts: {
        active: false,
        searchText: '',
        index: 0,
        open: {},
        targetedSpinnerId: 'concepts-entity-spinner'
    },
    schemes: {
        active: false,
        searchText: '',
        index: 0,
        open: {},
        targetedSpinnerId: 'schemes-entity-spinner'
    },
    search: {
        active: false
    },
    savedChanges: {
        active: false
    },
    commits: {
        active: false
    },
    visualization: {
        active: false,
        targetedSpinnerId: 'visualization-spinner'
    }
};

export class OntologyListItem extends VersionedRdfListItem {
    ontologyId: string
    isVocabulary: boolean
    editorTabStates: any // TODO better typing
    // ontology TODO: determine if needed
    importedOntologies: {id: string, ontologyId: string}[]
    importedOntologyIds: string[]
    createdFromExists: boolean
    userCanModify: boolean
    userCanModifyMaster: boolean
    // TODO figure out if this can be initialized here instead of in ontologyStateService. Do this when we upgrade property manager service.
    dataPropertyRange: {[key: string]: string}
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
    blankNodes: {[key: string]: string}
    entityInfo: EntityNames
    branches: JSONLDObject[]
    tags: JSONLDObject[]
    classesAndIndividuals: {[key: string]: string[]}
    classesWithIndividuals: string[]
    individualsParentPath: string[]
    propertyIcons: {[key: string]: string}
    noDomainProperties: string[]
    classToChildProperties: {[key: string]: string[]}
    iriList: string[]
    selected: JSONLDObject
    selectedBlankNodes: JSONLDObject[]
    failedImports: string[]
    seeHistory: boolean
    isSaved: boolean
    hasPendingRefresh: boolean
    goTo: {
        entityIRI: string,
        active: boolean
    }
    iriBegin: string
    iriThen: string

    constructor() {
        super();
        this.ontologyId = '';
        this.isVocabulary = false;
        this.editorTabStates = angular.copy(ontologyEditorTabStates);
        this.importedOntologies = [];
        this.importedOntologyIds = [];
        this.createdFromExists = true;
        this.userCanModify = false;
        this.userCanModifyMaster = false;
        this.dataPropertyRange = {};
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
        this.blankNodes = {};
        this.entityInfo = {};
        this.branches = [];
        this.tags = [];
        this.classesAndIndividuals = {};
        this.classesWithIndividuals = [];
        this.individualsParentPath = [];
        this.propertyIcons = {};
        this.noDomainProperties = [];
        this.classToChildProperties = {};
        this.iriList = [];
        this.selected = undefined;
        this.selectedBlankNodes = [];
        this.failedImports = [];
        this.seeHistory = false;
        this.isSaved = false;
        this.hasPendingRefresh = false;
        this.goTo = {
            entityIRI: '',
            active: false
        };
        this.iriBegin = '';
        this.iriThen = '';
    }
}
