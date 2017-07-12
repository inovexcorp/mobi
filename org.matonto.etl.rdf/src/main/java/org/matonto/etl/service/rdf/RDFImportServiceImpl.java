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
import org.matonto.etl.api.rdf.BatchInserter;
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.openrdf.rio.ParserConfig;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParser;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BasicParserSettings;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nonnull;

@Component
public class RDFImportServiceImpl implements RDFImportService {

    private Map<String, Repository> initializedRepositories = new HashMap<>();

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
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Override
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont) throws IOException {
        checkFileExists(file);
        importFileToRepository(repositoryID, file, cont, getFileFormat(file));
    }

    @Override
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont, @Nonnull RDFFormat format)
            throws IOException {
        checkFileExists(file);
        importFileToRepository(repositoryID, file, cont, format);
    }

    @Override
    public void importFile(Resource datasetRecordID, File file, Boolean cont) throws IOException {
        checkFileExists(file);
        importFileToDataset(datasetRecordID, file, cont, getFileFormat(file));
    }

    @Override
    public void importFile(Resource datasetRecordID, File file, Boolean cont, RDFFormat format)
            throws IOException {
        checkFileExists(file);
        importFileToDataset(datasetRecordID, file, cont, format);
    }

    @Override
    public void importModel(String repositoryID, Model model) {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(model);
        }
    }

    @Override
    public void importModel(Resource datasetRecordID, Model model) {
        DatasetConnection conn = datasetManager.getConnection(datasetRecordID);
        conn.add(model);
        conn.close();
    }

    private void importFileToRepository(String repositoryID, @Nonnull File file, Boolean cont,
                                        @Nonnull RDFFormat format) throws IOException {
        Repository repository = getRepo(repositoryID);
        try (RepositoryConnection conn = repository.getConnection()) {
            importFile(conn, file, cont, format);
        }
    }

    private void importFileToDataset(Resource datasetRecordID, @Nonnull File file, Boolean cont,
                                     @Nonnull RDFFormat format) throws IOException {
        DatasetConnection conn = datasetManager.getConnection(datasetRecordID);
        importFile(conn, file, cont, format);
        conn.close();
    }

    private Repository getRepo(String repositoryID) {
        Repository repository = initializedRepositories.get(repositoryID);
        if (repository == null) {
            throw new IllegalArgumentException("Repository does not exist");
        }
        return repository;
    }

    private void checkFileExists(File file) throws FileNotFoundException {
        if (!file.exists()) {
            throw new FileNotFoundException("File not found");
        }
    }

    private RDFFormat getFileFormat(File file) throws IOException {
        // Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        return Rio.getParserFormatForFileName(file.getName()).orElseThrow(() ->
                new IOException("Unsupported file type"));
    }

    private void importFile(RepositoryConnection conn, @Nonnull File file, Boolean cont, @Nonnull RDFFormat format)
            throws IOException {
        RDFParser parser = Rio.createParser(format);
        ParserConfig parserConfig = new ParserConfig();
        if (cont) {
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_DATATYPES);
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_LANGUAGES);
            parserConfig.addNonFatalError(BasicParserSettings.NORMALIZE_DATATYPE_VALUES);
        }
        parser.setParserConfig(parserConfig);
        BatchInserter inserter = new BatchInserter(conn, transformer);
        parser.setRDFHandler(inserter);
        parser.parse(new FileInputStream(file), "");
    }
}