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
(function() {
    'use strict';

    angular
        .module('ontology-editor', [
            /* New Directives */
            'advancedLanguageSelect',
            'annotationBlock',
            'associationBlock',
            'axiomBlock',
            'blankNodeValueDisplay',
            'characteristicsBlock',
            'characteristicsRow',
            'classAxioms',
            'classesTab',
            'classHierarchyBlock',
            'commitsTab',
            'conceptHierarchyBlock',
            'conceptSchemeHierarchyBlock',
            'conceptSchemesTab',
            'conceptsTab',
            'createConceptSchemeOverlay',
            'createEntityModal',
            'createIndividualOverlay',
            'datatypePropertyAxioms',
            'datatypePropertyBlock',
            'editBranchOverlay',
            'everythingTree',
            'importsBlock',
            'individualsTab',
            'individualHierarchyBlock',
            'individualTree',
            'individualTypesModal',
            'iriSelectOntology',
            'mergeBlock',
            'mergeTab',
            'newOntologyOverlay',
            'objectPropertyAxioms',
            'objectPropertyBlock',
            'ontologyButtonStack',
            'ontologyClassSelect',
            'ontologyCloseOverlay',
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
            'relationshipOverlay',
            'relationshipsBlock',
            'resolveConflictsBlock',
            'savedChangesTab',
            'selectedDetails',
            'serializationSelect',
            'staticIri',
            'superClassSelect',
            'superPropertySelect',
            'topConceptOverlay',
            'treeItem',
            'uploadChangesOverlay',
            'uploadOntologyOverlay',
            'uploadSnackbar',
            'usagesBlock',

            /* Services */
            'ontologyUtilsManager'
        ]);
})();
