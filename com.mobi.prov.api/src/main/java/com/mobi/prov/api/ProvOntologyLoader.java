package com.mobi.prov.api;

/*-
 * #%L
 * com.mobi.prov.api
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

import com.mobi.exception.MobiException;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;

import java.io.IOException;
import java.io.InputStream;

public class ProvOntologyLoader {

    /**
     * Loads the provided {@link InputStream} of an ontology into the provided {@link OsgiRepository}.
     * @param repo The {@link OsgiRepository} to load data into
     * @param stream The {@link InputStream} of an ontology
     */
    public static void loadOntology(OsgiRepository repo, InputStream stream) {
        // Load inputstream into a Model
        RDFParser rdfParser = Rio.createParser(RDFFormat.TURTLE);
        Model model = new LinkedHashModel();
        rdfParser.setRDFHandler(new StatementCollector(model));
        try {
            rdfParser.parse(stream);
        } catch (IOException e) {
            throw new MobiException(e);
        }
        // Get ontology IRI
        Resource ontology = model.filter(null, RDF.TYPE, OWL.ONTOLOGY)
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Prov Ontology has no ontology definition"))
                .getSubject();
        try (RepositoryConnection conn = repo.getConnection()) {
            // Compare file model to repo data. Replace with provided file.
            Model existingModel = QueryResults.asModel(conn.getStatements(null, null, null, ontology));
            if (!Models.isomorphic(existingModel, model)) {
                conn.clear(ontology);
                conn.add(model, ontology);
            }
        }
    }
}
