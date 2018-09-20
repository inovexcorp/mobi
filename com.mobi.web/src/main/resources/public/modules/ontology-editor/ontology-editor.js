/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        .module('ontology-editor', [
            /* New Directives */
            'advancedLanguageSelect',
            'annotationBlock',
            'annotationOverlay',
            'associationBlock',
            'axiomBlock',
            'axiomOverlay',
            'blankNodeValueDisplay',
            'characteristicsBlock',
            'characteristicsRow',
            'classAxioms',
            'classesTab',
            'classHierarchyBlock',
            'commitOverlay',
            'commitsTab',
            'conceptHierarchyBlock',
            'conceptSchemeHierarchyBlock',
            'conceptSchemesTab',
            'conceptsTab',
            'createBranchOverlay',
            'createClassOverlay',
            'createConceptOverlay',
            'createConceptSchemeOverlay',
            'createIndividualOverlay',
            'createPropertyOverlay',
            'datatypePropertyAxioms',
            'datatypePropertyBlock',
            'datatypePropertyOverlay',
            'editBranchOverlay',
            'everythingTree',
            'hierarchyTree',
            'importsBlock',
            'importsOverlay',
            'individualsTab',
            'individualHierarchyBlock',
            'individualTree',
            'iriSelect',
            'languageSelect',
            'mergeBlock',
            'mergeTab',
            'newOntologyOverlay',
            'objectPropertyAxioms',
            'objectPropertyBlock',
            'objectPropertyOverlay',
            'ontologyBranchSelect',
            'ontologyButtonStack',
            'ontologyCloseOverlay',
            'ontologyDefaultTab',
            'ontologyDownloadOverlay',
            'ontologyTab',
            'ontologyEditorPage',
            'ontologyPropertiesBlock',
            'ontologyPropertyOverlay',
            'ontologySidebar',
            'openOntologyTab',
            'overviewTab',
            'previewBlock',
            'projectTab',
            'propertiesTab',
            'propertyValues',
            'propertyHierarchyBlock',
            'recordAccessOverlay',
            'relationshipOverlay',
            'relationshipsBlock',
            'resolveConflictsBlock',
            'savedChangesTab',
            'searchTab',
            'selectedDetails',
            'serializationSelect',
            'staticIri',
            'superClassSelect',
            'superPropertySelect',
            'topConceptOverlay',
            'treeItem',
            'uploadChangesOverlay',
            'uploadOntologyOverlay',
            'uploadOntologyTab',
            'usagesBlock',

            /* Services */
            'ontologyUtilsManager'
        ]);
})();
