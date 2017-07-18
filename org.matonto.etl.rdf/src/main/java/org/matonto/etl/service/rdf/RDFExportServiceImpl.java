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
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.persistence.utils.RepositoryResults;
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
    public File exportToFile(String repositoryID, String filePath) throws IOException {
        return exportToFile(repositoryID, filePath, null, null, null, null);
    }

    @Override
    public File exportToFile(String repositoryID, String filePath, String subj, String pred, String objIRI,
                             String objLit) throws IOException {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            return export(conn, filePath, subj, pred, objIRI, objLit);
        }
    }

    @Override
    public File exportToFile(Resource datasetRecordID, String filePath) throws IOException {
        return exportToFile(datasetRecordID, filePath, null, null, null, null);
    }

    @Override
    public File exportToFile(Resource datasetRecordID, String filePath, String subj, String pred, String objIRI,
                             String objLit) throws IOException {
        DatasetConnection conn = datasetManager.getConnection(datasetRecordID);
        File file = export(conn, filePath, subj, pred, objIRI, objLit);
        conn.close();
        return file;
    }

    @Override
    public File exportToFile(Model model, String filePath) throws IOException {
        return export(model, getFile(filePath), getFileFormat(filePath));
    }

    @Override
    public File exportToFile(Model model, String filePath, RDFFormat format) throws IOException {
        return export(model, getFile(filePath), format);
    }

    private File export(RepositoryConnection conn, String filePath, String subj, String pred, String objIRI,
                        String objLit) throws IOException {
        Resource subjResource = null;
        IRI predicateIRI = null;
        Value objValue = null;

        if (subj != null) {
            subjResource = vf.createIRI(subj);
        }

        if (pred != null) {
            predicateIRI = vf.createIRI(pred);
        }

        if (objIRI != null) {
            objValue = vf.createIRI(objIRI);
        } else if (objLit != null) {
            objValue = vf.createLiteral(objLit);
        }

        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\n"
                + "Obj: " + objValue);
        RepositoryResult<Statement> result = conn.getStatements(subjResource, predicateIRI, objValue);
        Model model = RepositoryResults.asModel(result, mf);
        return exportToFile(model, filePath);
    }

    private File export(Model model, File file, RDFFormat format) throws IOException {
        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, new FileWriter(file)));
        Rio.write(transformer.sesameModel(model), rdfWriter);
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