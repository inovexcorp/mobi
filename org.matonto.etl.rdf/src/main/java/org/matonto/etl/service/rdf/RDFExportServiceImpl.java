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
import org.matonto.etl.api.rdf.RDFExportService;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.DelegatingRepository;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.openrdf.repository.RepositoryException;
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
import java.util.Optional;


@Component(provide = RDFExportService.class)
public class RDFExportServiceImpl implements RDFExportService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RDFExportServiceImpl.class);

    private Map<String, Repository> initializedRepositories = new HashMap<>();

    private ValueFactory valueFactory;
    private ModelFactory modelFactory;
    private SesameTransformer transformer;

    @Reference(type = '*', dynamic = true)
    public void addRepository(DelegatingRepository repository) {
        initializedRepositories.put(repository.getRepositoryID(), repository);
    }

    public void removeRepository(DelegatingRepository repository) {
        initializedRepositories.remove(repository.getRepositoryID());
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Override
    public File exportToFile(String repositoryID, String filepath) throws RepositoryException, IOException {
        return exportToFile(repositoryID, filepath, null, null, null, null);
    }

    @Override
    public File exportToFile(String repositoryID, String filepath, String subj, String pred, String objIRI,
                             String objLit) throws RepositoryException, IOException {
        Resource subjResource = null;
        IRI predicateIRI = null;
        Value objValue = null;

        if (subj != null) {
            subjResource = valueFactory.createIRI(subj);
        }

        if (pred != null) {
            predicateIRI = valueFactory.createIRI(pred);
        }

        if (objIRI != null) {
            objValue = valueFactory.createIRI(objIRI);
        } else if (objLit != null) {
            objValue = valueFactory.createLiteral(objLit);
        }

        LOGGER.warn("Restricting to:\nSubj: " + subjResource + "\nPred: " + predicateIRI + "\n"
                    + "Obj: " + objValue);

        File file = new File(filepath);
        if (file.exists() && !file.canWrite()) {
            throw new IOException("Unable to write to file");
        }

        RDFFormat format = Rio.getParserFormatForFileName(file.getName()).orElseThrow(() ->
                new IOException("Unsupported file type"));

        Repository repository = initializedRepositories.get(repositoryID);

        if (repository != null) {
            RepositoryConnection conn = repository.getConnection();
            RepositoryResult<org.matonto.rdf.api.Statement> result =
                    conn.getStatements(subjResource, predicateIRI, objValue);

            Model model = modelFactory.createModel();
            result.forEach(model::add);

            return exportToFile(model, filepath, format);
        } else {
            throw new IllegalArgumentException("Repository does not exist");
        }
    }

    @Override
    public File exportToFile(Model model, String filepath) throws IOException {
        Optional<RDFFormat> optFormat = Rio.getWriterFormatForFileName(filepath);
        if (optFormat.isPresent()) {
            return exportToFile(model, filepath, optFormat.get());
        } else {
            throw new IllegalArgumentException("File format not supported");
        }
    }

    @Override
    public File exportToFile(Model model, String filepath, RDFFormat format) throws IOException {
        File file = new File(filepath);

        RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, new FileWriter(file)));
        Rio.write(transformer.sesameModel(model), rdfWriter);
        return file;
    }
}