package com.mobi.versionedrdf.api;

/*-
 * #%L
 * com.mobi.versionedrdf.api
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

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;

public interface QueryableVersionedRDF {
    /**
     * Returns the VersionedRdfRecord as TURTLE in an OutputStream.
     *
     * @return an OutputStream of TURTLE
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */
    ByteArrayOutputStream asTurtle();

    /**
     * Returns the VersionedRdfRecord as TURTLE written to the given OutputStream.
     *
     * @param outputStream The outputStream to write the TURTLE to
     * @return the OutputStream that was written to
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */
    <T extends OutputStream> T asTurtle(T outputStream);

    /**
     * Returns the VersionedRdfRecord as RDF-XML in an OutputStream.
     *
     * @return an OutputStream of RDF-XML
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */
    ByteArrayOutputStream asRdfXml();

    /**
     * Returns the VersionedRdfRecord as RDF-XML written to the given OutputStream.
     *
     * @param outputStream The outputStream to write the RDF-XML to
     * @return the OutputStream that was written to
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */

    <T extends OutputStream> T asRdfXml(T outputStream);

    /**
     * Returns the VersionedRdfRecord as JSON-LD in an OutputStream.
     *
     * @param skolemize Whether or not blank node ids should be skolemized before rendering
     * @return an OutputStream of JSON-LD
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */
    ByteArrayOutputStream asJsonLD(boolean skolemize);

    /**
     * Returns the VersionedRdfRecord as JSON-LD written to the given OutputStream.
     *
     * @param skolemize Whether or not blank node ids should be skolemized before rendering
     * @param outputStream The outputStream to write the JSON-LD to
     * @return the OutputStream that was written to
     * @throws org.eclipse.rdf4j.rio.RDFHandlerException If an error occurs while parsing
     */
    <T extends OutputStream> T asJsonLD(boolean skolemize, T outputStream);

    /**
     * Searches the VersionedRdfRecord & its import closures using the provided Sparql query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from VersionedRdfRecord imports when querying
     * @return a Tuple Set with the query results.
     */
    TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports);

    /**
     * Searches the VersionedRdfRecord & its import closures using the provided SPARQL query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from VersionedRdfRecord imports when querying
     * @return a model with the query results.
     */
    Model getGraphQueryResults(String queryString, boolean includeImports);

    /**
     * Searches the VersionedRdfRecord & its import closures using the provided SPARQL query.
     *
     * @param queryString Sparql query string you want to execute.
     * @param includeImports Include data from VersionedRdfRecord imports when querying
     * @param format Specified format for the return of queries
     * @param skolemize Whether or not the VersionedRdfRecord should be skoelmized before serialized
     * @return OutputStream OutputStream that the rdf should be written to
     */
    OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                            boolean skolemize);

    /**
     * Searches the VersionedRdfRecord & its import closures using the provided SPARQL query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from VersionedRdfRecord imports when querying
     * @param format the specified format for the return of queries
     * @param skolemize whether or not the VersionedRdfRecord should be skoelmized before serialized
     * @param outputStream OutputStream that the rdf should be written to
     * @return OutputStream
     */
    OutputStream getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                            boolean skolemize, OutputStream outputStream);

    /**
     * Searches the VersionedRdfRecord & its import closures using the provided SPARQL query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from VersionedRdfRecord imports when querying
     * @param format the specified format for the return of queries
     * @param skolemize whether or not the VersionedRdfRecord should be skoelmized before serialized
     * @param limit Integer limit
     * @param outputStream OutputStream that the rdf should be written to
     * @return OutputStream
     */
    boolean getGraphQueryResultsStream(String queryString, boolean includeImports, RDFFormat format,
                                       boolean skolemize, Integer limit, OutputStream outputStream);
}
