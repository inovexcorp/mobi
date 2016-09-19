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
            'ontologyDownloadOverlay',
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
            'createAnnotationOverlay',
            'createClassOverlay',
            'createIndividualOverlay',
            'createPropertyOverlay',
            'datatypePropertyAxioms',
            'datatypePropertyBlock',
            'datatypePropertyOverlay',
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
            'selectedDetails',
            'serializationSelect',
            'staticIri',
            'stringSelect',
            'treeItem',
            'uploadOntologyTab',
            'usagesBlock',

            /* Services */
            'ontologyUtilsManager'
        ]);
})();
