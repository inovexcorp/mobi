package com.mobi.etl.service.ontology;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.ontology.OntologyImportService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.owl.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.Models;
import org.apache.commons.io.FilenameUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class OntologyImportServiceImpl implements OntologyImportService {

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    @Reference
    protected VersioningManager versioningManager;

    @Reference
    protected BranchManager branchManager;

    @Reference
    protected DifferenceManager differenceManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected OntologyManager ontologyManager;

    @Reference
    protected CatalogConfigProvider configProvider;


    @Override
    public Difference importOntology(Resource ontologyRecord, boolean update, File ontologyData, User user,
                                     String commitMsg) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), ontologyRecord,
                            conn).getResource();
            return importOntology(ontologyRecord, masterBranch, update, ontologyData, user, commitMsg);
        }
    }

    @Override
    public Difference importOntology(Resource ontologyRecord, Resource branch, boolean update, File ontologyData,
                                     User user, String commitMsg) {
        Model newData = mf.createEmptyModel();
        Model existingData = ontologyManager.getOntologyModel(ontologyRecord, branch);

        if (update) {
            // Should find a way to process updates (minus owl:Ontology triples) without loading into memory. The
            // current approach will not scale for very large updates.
            try (InputStream in = new FileInputStream(ontologyData)) {
                RDFFormat format = Rio.getParserFormatForFileName(ontologyData.getName())
                        .orElse(RDFFormat.TURTLE);
                newData.addAll(Rio.parse(in, "", format));
            } catch (IOException e) {
                throw new IllegalStateException("Could not read ontology data file.");
            }
            existingData.filter(null,
                    vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), vf.createIRI(Ontology.TYPE))
                    .subjects()
                    .forEach(resource -> newData.addAll(existingData.filter(resource, null, null)));

            Difference diff = differenceManager.getDiff(existingData, newData);
            if (!diff.getAdditions().isEmpty() || !diff.getDeletions().isEmpty()) {
                try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                    File additionsFile = createTempFileFromModel(diff.getAdditions());
                    File deletionsFile = createTempFileFromModel(diff.getDeletions());
                    commitManager.createInProgressCommit(configProvider.getLocalCatalogIRI(), ontologyRecord, user,
                            additionsFile, deletionsFile, conn);
                    versioningManager.commit(configProvider.getLocalCatalogIRI(), ontologyRecord, branch, user,
                            commitMsg, conn);
                }
            }
            return diff;
        } else {
            try (InputStream in = new FileInputStream(ontologyData)) {
                String ext = FilenameUtils.getExtension(ontologyData.getName());
                StatementCollector collector = new FilteredStatementCollector(existingData);
                newData.addAll(Models.createModel(ext, in, collector).getModel());
            } catch (IOException e) {
                throw new IllegalStateException("Could not read ontology data file.");
            }
            if (!newData.isEmpty()) {
                try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                    commitManager.createInProgressCommit(configProvider.getLocalCatalogIRI(), ontologyRecord, user,
                            createTempFileFromModel(newData), null, conn);
                    versioningManager.commit(configProvider.getLocalCatalogIRI(), ontologyRecord, branch, user,
                            commitMsg, conn);
                }
            }
            return new Difference.Builder().additions(newData).deletions(mf.createEmptyModel()).build();
        }
    }

    private File createTempFileFromModel(Model model) {
        try {
            Path tmpFile = Files.createTempFile(null, ".ttl");
            Rio.write(model, Files.newOutputStream(tmpFile), RDFFormat.TURTLE);
            return tmpFile.toFile();
        } catch (IOException e) {
            throw new IllegalStateException("Could not write data to file.");
        }
    }

    private class FilteredStatementCollector extends StatementCollector {
        private Model excludedStatements;

        public FilteredStatementCollector(Model excludedStatements) {
            super();
            this.excludedStatements = excludedStatements;
        }

        @Override
        public void handleStatement(Statement st) {
            if (!excludedStatements.contains(st)) {
                super.handleStatement(st);
            }
        }
    }
}
