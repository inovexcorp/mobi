package com.mobi.etl.service.rdf;

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
import com.mobi.dataset.api.DatasetManager;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.persistence.utils.BatchInserter;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.repository.api.DelegatingRepository;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicParserSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import javax.annotation.Nonnull;

@Component
public class RDFImportServiceImpl implements RDFImportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RDFImportServiceImpl.class);
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
    public void importFile(ImportServiceConfig config, @Nonnull File file) throws IOException {
        checkFileExists(file);
        importFileWithConfig(config, file, getFileFormat(config, file));
    }

    @Override
    public void importModel(ImportServiceConfig config, Model model) {
        try (RepositoryConnection conn = getConnection(config)) {
            conn.add(model);
            if (config.getLogOutput()) {
                LOGGER.debug("Import complete. " + model.size() + " statements imported");
            }
            if (config.getPrintOutput()) {
                System.out.println("Import complete. " + model.size() + " statements imported");
            }
        }
    }

    @Override
    public void importInputStream(ImportServiceConfig config, InputStream stream) throws IOException {
        if (config.getFormat() == null) {
            throw new IllegalArgumentException("Config must contain a format if importing an InputStream");
        }
        try (RepositoryConnection conn = getConnection(config)) {
            importInputStream(conn, config, stream, config.getFormat());
        }
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

    private RDFFormat getFileFormat(ImportServiceConfig config, File file) throws IOException {
        if (config.getFormat() != null) {
            return config.getFormat();
        } else {
            // Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
            return Rio.getParserFormatForFileName(file.getName()).orElseThrow(() ->
                    new IOException("Unsupported file type"));
        }
    }

    private RepositoryConnection getConnection(ImportServiceConfig config) {
        if (config.getRepository() != null) {
            Repository repository = getRepo(config.getRepository());
            return repository.getConnection();
        } else if (config.getDataset() != null) {
            return datasetManager.getConnection(config.getDataset());
        } else {
            throw new IllegalArgumentException("Must provide either a Repository or a DatasetRecord");
        }
    }

    private void importFileWithConfig(ImportServiceConfig config, File file, RDFFormat format) throws IOException {
        try (RepositoryConnection conn = getConnection(config)) {
            importFile(conn, config, file, format);
        }
    }

    private void importFile(RepositoryConnection conn, ImportServiceConfig config, @Nonnull File file,
                            @Nonnull RDFFormat format) throws IOException {
        importInputStream(conn, config, new FileInputStream(file), format);
    }

    private void importInputStream(RepositoryConnection conn, ImportServiceConfig config, @Nonnull InputStream stream,
                                   @Nonnull RDFFormat format) throws IOException {
        RDFParser parser = Rio.createParser(format);
        ParserConfig parserConfig = new ParserConfig();
        if (config.getContinueOnError()) {
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_DATATYPES);
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_LANGUAGES);
            parserConfig.addNonFatalError(BasicParserSettings.NORMALIZE_DATATYPE_VALUES);
        }
        parserConfig.addNonFatalError(BasicParserSettings.VERIFY_URI_SYNTAX);
        parser.setParserConfig(parserConfig);
        BatchInserter inserter = new BatchInserter(conn, transformer, config.getBatchSize());
        if (config.getLogOutput()) {
            inserter.setLogger(LOGGER);
        }
        if (config.getPrintOutput()) {
            inserter.setPrintToSystem(true);
        }
        parser.setRDFHandler(inserter);
        parser.parse(stream, "");
    }
}