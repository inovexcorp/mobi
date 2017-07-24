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
import org.matonto.etl.api.config.ExportServiceConfig;
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.persistence.utils.StatementIterable;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
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
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class RDFExportServiceImpl implements RDFExportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    private Map<String, Repository> initializedRepositories = new HashMap<>();

    private ValueFactory vf;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private DatasetManager datasetManager;

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
    public void setMf(ModelFactory mf) {
        this.mf = mf;
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
    public File exportToFile(ExportServiceConfig config, String repositoryID) throws IOException {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            return export(conn, config);
        }
    }

    @Override
    public File exportToFile(ExportServiceConfig config, Resource datasetRecordID) throws IOException {
        try (DatasetConnection conn = datasetManager.getConnection(datasetRecordID)) {
            return export(conn, config);
        }
    }

    @Override
    public File exportToFile(ExportServiceConfig config, Model model) throws IOException {
        String filePath = config.getFilePath().orElseThrow(() ->
                new IllegalArgumentException("The export file path is required"));
        RDFFormat format = config.getFormat() == null ? getFileFormat(filePath) : config.getFormat();
        return export(model, getFile(filePath), format);
    }

    private File export(RepositoryConnection conn, ExportServiceConfig config) throws IOException {
        String filePath = config.getFilePath().orElseThrow(() ->
                new IllegalArgumentException("The export file path is required"));
        RDFFormat format = config.getFormat() == null ? getFileFormat(filePath) : config.getFormat();
        Resource subjResource = config.getSubj() == null ? null : vf.createIRI(config.getSubj());
        IRI predicateIRI = config.getPred() == null ? null : vf.createIRI(config.getPred());
        Value objValue = null;

        if (config.getObjIRI() != null) {
            objValue = vf.createIRI(config.getObjIRI());
        } else if (config.getObjLit() != null) {
            objValue = vf.createLiteral(config.getObjLit());
        }

        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\n"
                + "Obj: " + objValue);
        RepositoryResult<Statement> result = conn.getStatements(subjResource, predicateIRI, objValue);
        return export(result, getFile(filePath), format);
    }

    private File export(Iterable<Statement> statements, File file, RDFFormat format) throws IOException {
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, new FileWriter(file)));
        Rio.write(new StatementIterable(statements, transformer), rdfWriter);
        return file;
    }

    private File getFile(String filePath) throws IOException {
        File file = new File(filePath);
        if (file.exists() && !file.canWrite()) {
            throw new IOException("Unable to write to file");
        }
        return file;
    }

    private Repository getRepo(String repositoryID) {
        Repository repository = initializedRepositories.get(repositoryID);
        if (repository == null) {
            throw new IllegalArgumentException("Repository does not exist");
        }
        return repository;
    }

    private RDFFormat getFileFormat(String filePath) throws IOException {
        // Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        return Rio.getParserFormatForFileName(filePath).orElseThrow(() -> new IOException("Unsupported file type"));
    }
}