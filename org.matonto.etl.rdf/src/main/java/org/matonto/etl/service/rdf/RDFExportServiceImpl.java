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
import org.matonto.etl.api.config.RDFExportConfig;
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

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
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
    public File exportToFile(RDFExportConfig config, String repositoryID) throws IOException {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            return export(conn, config);
        }
    }

    @Override
    public File exportToFile(RDFExportConfig config, Resource datasetRecordID) throws IOException {
        try (DatasetConnection conn = datasetManager.getConnection(datasetRecordID)) {
            String filePath = getFilePath(config);
            RDFFormat format = getRDFFormat(config, filePath);

            Resource subjResource = getSubject(config);
            IRI predicateIRI = getPredicate(config);
            Value objValue = getObject(config);
            LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\nObj: " + objValue);

            if (!quadFormats.contains(format)) {
                LOGGER.warn("RDF format does not support quads so they will not be exported.");
                System.out.println("WARN: RDF format does not support quads so they will not be exported.");
            }
            File file = getFile(filePath);
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, new FileWriter(file)));
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
            return file;
        } catch (RDFHandlerException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public File exportToFile(RDFExportConfig config, Model model) throws IOException {
        String filePath = getFilePath(config);
        RDFFormat format = getRDFFormat(config, filePath);
        return export(model, getFile(filePath), format);
    }

    private File export(RepositoryConnection conn, RDFExportConfig config) throws IOException {
        String filePath = getFilePath(config);
        RDFFormat format = getRDFFormat(config, filePath);

        Resource subjResource = getSubject(config);
        IRI predicateIRI = getPredicate(config);
        Value objValue = getObject(config);
        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\nObj: " + objValue);

        RepositoryResult<Statement> result = conn.getStatements(subjResource, predicateIRI, objValue);
        return export(result, getFile(filePath), format);
    }

    private File export(Iterable<Statement> statements, File file, RDFFormat format) throws IOException {
        if (!quadFormats.contains(format)) {
            LOGGER.warn("RDF format does not support quads.");
        }
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, new FileWriter(file)));
        Rio.write(new StatementIterable(statements, transformer), rdfWriter);
        return file;
    }

    private String getFilePath(RDFExportConfig config) {
        return config.getFilePath().orElseThrow(() -> new IllegalArgumentException("The export file path is required"));
    }

    private File getFile(String filePath) throws IOException {
        File file = new File(filePath);
        if (file.exists() && !file.canWrite()) {
            throw new IOException("Unable to write to file");
        }
        return file;
    }

    private RDFFormat getFileFormat(String filePath) throws IOException {
        // Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        return Rio.getParserFormatForFileName(filePath).orElseThrow(() -> new IOException("Unsupported file type"));
    }

    private RDFFormat getRDFFormat(RDFExportConfig config, String filePath) throws IOException {
        return config.getFormat() == null ? getFileFormat(filePath) : config.getFormat();
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