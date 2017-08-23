package org.matonto.etl.service.rdf;

/*-
 * #%L
 * org.matonto.etl.rdf
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
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.etl.api.config.rdf.RDFExportConfig;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.persistence.utils.StatementIterable;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
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
    private DatasetManager datasetManager;

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

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }
    
    @Override
    public void export(RDFExportConfig config, String repositoryID) throws IOException {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            export(conn, config);
        }
    }

    @Override
    public void export(RDFExportConfig config, Resource datasetRecordID) throws IOException {
        try (DatasetConnection conn = datasetManager.getConnection(datasetRecordID)) {
            RDFFormat format = config.getFormat();

            Resource subjResource = getSubject(config);
            IRI predicateIRI = getPredicate(config);
            Value objValue = getObject(config);
            LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\nObj: " + objValue);

            if (!quadFormats.contains(format)) {
                LOGGER.warn("RDF format does not support quads so they will not be exported.");
                System.out.println("WARN: RDF format does not support quads so they will not be exported.");
            }
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, config.getOutput()));
            List<Resource> defaultsList = RepositoryResults.asList(conn.getDefaultNamedGraphs());
            defaultsList.add(conn.getSystemDefaultNamedGraph());
            Resource[] defaults = defaultsList.toArray(new Resource[defaultsList.size()]);
            List<Resource> graphsList = RepositoryResults.asList(conn.getNamedGraphs());
            Resource[] graphs = graphsList.toArray(new Resource[graphsList.size()]);
            rdfWriter.startRDF();
            for (Statement st: conn.getStatements(subjResource, predicateIRI, objValue, defaults)) {
                Statement noContext = vf.createStatement(st.getSubject(), st.getPredicate(), st.getObject());
                rdfWriter.handleStatement(transformer.sesameStatement(noContext));
            }
            if (quadFormats.contains(format)) {
                for (Statement st: conn.getStatements(subjResource, predicateIRI, objValue, graphs)) {
                    rdfWriter.handleStatement(transformer.sesameStatement(st));
                }
            }
            rdfWriter.endRDF();
        } catch (RDFHandlerException e) {
            throw new MatOntoException(e);
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
        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\nObj: " + objValue);

        RepositoryResult<Statement> result = conn.getStatements(subjResource, predicateIRI, objValue);
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
}