package com.mobi.etl.service.rdf.export;

/*-
 * #%L
 * com.mobi.etl.rdf
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.persistence.utils.StatementIterable;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
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

    private Map<String, Repository> initializedRepositories = new HashMap<>();

    private ValueFactory vf;
    private SesameTransformer transformer;

    private List<RDFFormat> quadFormats = Arrays.asList(RDFFormat.JSONLD, RDFFormat.NQUADS, RDFFormat.TRIG,
            RDFFormat.TRIX);

    @Reference(type = '*', dynamic = true)
    public void addRepository(DelegatingRepository repository) {
        initializedRepositories.put(repository.getRepositoryID(), repository);
    }

    public void removeRepository(DelegatingRepository repository) {
        initializedRepositories.remove(repository.getRepositoryID());
    }

    @Reference
    public void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public void export(RDFExportConfig config, String repositoryID) throws IOException {
        Repository repository = getRepo(repositoryID);
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
        Rio.write(new StatementIterable(statements, transformer), rdfWriter);
    }

    private Repository getRepo(String repositoryID) {
        Repository repository = initializedRepositories.get(repositoryID);
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