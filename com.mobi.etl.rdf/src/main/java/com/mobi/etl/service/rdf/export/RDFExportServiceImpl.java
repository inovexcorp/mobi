package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.persistence.utils.StatementIterable;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RDFExportServiceImpl implements RDFExportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    private Map<String, OsgiRepository> initializedRepositories = new HashMap<>();

    private List<RDFFormat> quadFormats = Arrays.asList(RDFFormat.JSONLD, RDFFormat.NQUADS, RDFFormat.TRIG,
            RDFFormat.TRIX);

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    public void addRepository(OsgiRepository repository) {
        initializedRepositories.put(repository.getRepositoryID(), repository);
    }

    public void removeRepository(OsgiRepository repository) {
        initializedRepositories.remove(repository.getRepositoryID());
    }

    final ValueFactory vf = new ValidatingValueFactory();

    @Override
    public void export(RDFExportConfig config, String repositoryID) throws IOException {
        OsgiRepository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            export(conn, config);
        }
    }

    @Override
    public void export(RDFExportConfig config, Model model) throws IOException {
        export(model, config.getOutput(), config.getFormat());
    }

    private void export(RepositoryConnection conn, RDFExportConfig config) throws IOException {
        Resource subjResource = getSubject(config);
        IRI predicateIRI = getPredicate(config);
        Value objValue = getObject(config);
        Resource graphResource = getGraph(config);
        LOGGER.info("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\nObj: " + objValue
                + "\nGraph: " + graphResource);

        RepositoryResult<Statement> result;
        if (graphResource == null) {
            result = conn.getStatements(subjResource, predicateIRI, objValue);
        } else {
            result = conn.getStatements(subjResource, predicateIRI, objValue, graphResource);
        }

        export(result, config.getOutput(), config.getFormat());
    }

    private void export(Iterable<Statement> statements, OutputStream output, RDFFormat format) throws IOException {
        if (!quadFormats.contains(format)) {
            LOGGER.warn("RDF format does not support quads.");
        }
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, output));
        Rio.write(new StatementIterable(statements), rdfWriter);
    }

    private OsgiRepository getRepo(String repositoryID) {
        OsgiRepository repository = initializedRepositories.get(repositoryID);
        if (repository == null) {
            throw new IllegalArgumentException("Repository does not exist");
        }
        return repository;
    }

    private Resource getSubject(RDFExportConfig config) {
        return config.getSubj() == null ? null : vf.createIRI(config.getSubj());
    }

    private IRI getPredicate(RDFExportConfig config) {
        return config.getPred() == null ? null : vf.createIRI(config.getPred());
    }

    private Value getObject(RDFExportConfig config) {
        Value objValue = null;
        if (config.getObjIRI() != null) {
            objValue = vf.createIRI(config.getObjIRI());
        } else if (config.getObjLit() != null) {
            objValue = vf.createLiteral(config.getObjLit());
        }

        return objValue;
    }

    private Resource getGraph(RDFExportConfig config) {
        return config.getGraph() == null ? null : vf.createIRI(config.getGraph());
    }
}
