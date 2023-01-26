package com.mobi.etl.service.ontology;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.owl.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferencePolicyOption;

@Component
public class OntologyImportServiceImpl implements OntologyImportService {

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();
    private VersioningManager versioningManager;
    private CatalogManager catalogManager;
    private OntologyManager ontologyManager;
    private CatalogConfigProvider configProvider;

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference(policyOption = ReferencePolicyOption.GREEDY)
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider catalogConfigProvider) {
        this.configProvider = catalogConfigProvider;
    }


    @Override
    public Difference importOntology(Resource ontologyRecord, boolean update, Model ontologyData, User user,
                                     String commitMsg) {
        Resource masterBranch = catalogManager.getMasterBranch(configProvider.getLocalCatalogIRI(), ontologyRecord)
                .getResource();
        return importOntology(ontologyRecord, masterBranch, update, ontologyData, user, commitMsg);
    }

    @Override
    public Difference importOntology(Resource ontologyRecord, Resource branch, boolean update, Model ontologyData,
                                     User user, String commitMsg) {
        Model newData = mf.createEmptyModel();
        newData.addAll(ontologyData);
        Model existingData = ontologyManager.getOntologyModel(ontologyRecord, branch);

        if (update) {
            existingData.filter(null,
                    vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Ontology.TYPE))
                    .subjects()
                    .forEach(resource -> newData.addAll(existingData.filter(resource, null, null)));

            Difference diff = catalogManager.getDiff(existingData, newData);
            if (!diff.getAdditions().isEmpty() || !diff.getDeletions().isEmpty()) {
                versioningManager.commit(configProvider.getLocalCatalogIRI(), ontologyRecord, branch, user, commitMsg,
                        diff.getAdditions(), diff.getDeletions());
            }
            return diff;
        } else {
            newData.removeAll(existingData);

            if (!newData.isEmpty()) {
                versioningManager.commit(configProvider.getLocalCatalogIRI(), ontologyRecord, branch, user, commitMsg,
                        newData, null);
            }
            return new Difference.Builder().additions(newData).deletions(mf.createEmptyModel()).build();
        }
    }
}
