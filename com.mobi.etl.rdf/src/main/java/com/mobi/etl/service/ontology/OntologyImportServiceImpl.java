package com.mobi.etl.service.ontology;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.owl.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;

@Component
public class OntologyImportServiceImpl implements OntologyImportService {

    private ValueFactory vf;
    private ModelFactory mf;
    private VersioningManager versioningManager;
    private CatalogManager catalogManager;
    private OntologyManager ontologyManager;
    private CatalogConfigProvider configProvider;

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider catalogConfigProvider) {
        this.configProvider = catalogConfigProvider;
    }

    @Override
    public Difference importOntology(IRI ontologyRecord, IRI branch, boolean update, Model ontologyData, User user, String commitMsg) {
        Model newData = mf.createModel(ontologyData);
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
            return new Difference.Builder().additions(newData).build();
        }
    }
}
