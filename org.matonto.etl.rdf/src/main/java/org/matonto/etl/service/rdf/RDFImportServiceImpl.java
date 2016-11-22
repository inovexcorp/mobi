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
import org.matonto.etl.api.rdf.RDFImportService;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.exception.RepositoryException;
import org.openrdf.rio.ParserConfig;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.RDFParser;
import org.openrdf.rio.Rio;
import org.openrdf.rio.helpers.BasicParserSettings;
import org.openrdf.rio.helpers.StatementCollector;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component(provide = RDFImportService.class)
public class RDFImportServiceImpl implements RDFImportService {

    private Map<String, Repository> initializedRepositories = new HashMap<>();

    private SesameTransformer transformer;

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

    /**
     * Imports a file into the openrdf repository (with the given repositoryID) deployed on karaf.
     *
     * @throws FileNotFoundException if file is not found.
     */
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont)
            throws IOException, RepositoryException, RDFParseException {
        if (!file.exists()) {
            throw new FileNotFoundException("File not found");
        }

        // Get the rdf format based on the file name. If the format returns null, it is an unsupported file type.
        RDFFormat format = Rio.getParserFormatForFileName(file.getName()).orElseThrow(() ->
                new IOException("Unsupported file type"));

        importFile(repositoryID,file, cont, format);
    }

    /**
     * Imports a file with a specified format into the openrdf repository (with the given repositoryID)
     * deployed on karaf.
     *
     * @throws FileNotFoundException if file is not found.
     */
    public void importFile(String repositoryID, @Nonnull File file, Boolean cont,@Nonnull RDFFormat format)
            throws IOException, RepositoryException, RDFParseException {
        if (!file.exists()) {
            throw new FileNotFoundException("File not found");
        }

        RDFParser parser = Rio.createParser(format);
        ParserConfig parserConfig = new ParserConfig();
        if (cont) {
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_DATATYPES);
            parserConfig.addNonFatalError(BasicParserSettings.FAIL_ON_UNKNOWN_LANGUAGES);
            parserConfig.addNonFatalError(BasicParserSettings.NORMALIZE_DATATYPE_VALUES);
        }
        parser.setParserConfig(parserConfig);
        org.openrdf.model.Model model = new org.openrdf.model.impl.LinkedHashModel();
        parser.setRDFHandler(new StatementCollector(model));
        try {
            parser.parse(new FileReader(file), "");
        } catch (RDFHandlerException e) {
            throw new RDFParseException(e);
        }

        importModel(repositoryID, transformer.matontoModel(model));
    }

    public void importModel(String repositoryID, Model model) {
        Repository repository = initializedRepositories.get(repositoryID);

        if (repository != null) {
            RepositoryConnection conn = repository.getConnection();
            conn.add(model);
        } else {
            throw new IllegalArgumentException("Repository does not exist");
        }
    }
}