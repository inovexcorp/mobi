/*-
 * #%L
 * org.matonto.web
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
            /* Custom Directives */
            /*'annotationEditor',
            'annotationTree',
            'classEditor',
            'createOntologyOverlay',
            'defaultTab',
            'individualEditor',
            'ontologyEntityEditors',
            'ontologyOpenOverlay',
            'ontologySideBar',
            'ontologyTrees',
            'ontologyUploadOverlay',
            'propertyEditor',
            'propertyTree',*/

            /* New Directives */
            'annotationBlock',
            'annotationOverlay',
            'associationBlock',
            'axiomBlock',
            'axiomOverlay',
            'classAxioms',
            'classesTab',
            'classHierarchyBlock',
            'conceptHierarchyBlock',
            'conceptsTab',
            'createAnnotationOverlay',
            'createClassOverlay',
            'createConceptOverlay',
            'createConceptSchemeOverlay',
            'createIndividualOverlay',
            'createPropertyOverlay',
            'datatypePropertyAxioms',
            'datatypePropertyBlock',
            'datatypePropertyOverlay',
            'editorRadioButtons',
            'everythingTree',
            'hierarchyTree',
            'importsBlock',
            'individualsTab',
            'individualHierarchyBlock',
            'individualTree',
            'newOntologyTab',
            'objectPropertyAxioms',
            'objectPropertyBlock',
            'objectPropertyOverlay',
            'objectSelect',
            'ontologyCloseOverlay',
            'ontologyDefaultTab',
            'ontologyDownloadOverlay',
            'ontologyOverlays',
            'ontologyTab',
            'ontologyEditorTabset',
            'ontologyPropertiesBlock',
            'ontologyPropertyOverlay',
            'openOntologyTab',
            'overviewTab',
            'previewBlock',
            'projectTab',
            'propertiesTab',
            'propertyValues',
            'propertyHierarchyBlock',
            'relationshipOverlay',
            'relationshipsBlock',
            'selectedDetails',
            'serializationSelect',
            'staticIri',
            'stringSelect',
            'topConceptsBlock',
            'treeItem',
            'uploadOntologyTab',
            'usagesBlock',
            'vocabularyTab',

            /* Services */
            'ontologyUtilsManager'
        ]);
})();
