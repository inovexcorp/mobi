package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
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

import static java.util.Arrays.asList;

import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.UnsupportedRDFormatException;
import org.eclipse.rdf4j.rio.helpers.ParseErrorLogger;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;

public class Models {

    protected Models(){}

    /**
     * Retrieves an Object (Value) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the value from
     * @return an object value from a model or an empty Optional.
     */
    public static Optional<Value> object(Model m) {
        return m.stream().map(Statement::getObject).findAny();
    }

    /**
     * Retrieves an Object (Literal) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object literal from
     * @return an object literal from a model or an empty Optional.
     */
    public static Optional<Literal> objectLiteral(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Literal).map(l -> (Literal) l).findAny();
    }

    /**
     * Retrieves an Object (IRI) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object iri from
     * @return an object iri from a model or an empty Optional.
     */
    public static Optional<IRI> objectIRI(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof IRI).map(r -> (IRI) r).findAny();
    }

    /**
     * Retrieves an Object (Resource) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object resource from
     * @return an object resource from a model or an empty Optional.
     */
    public static Optional<Resource> objectResource(Model m) {
        return m.stream().map(Statement::getObject).filter(o -> o instanceof Resource).map(r -> (Resource) r).findAny();
    }

    /**
     * Retrieves an Object (String) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param m The model to retrieve the object string from
     * @return an object string from a model or an empty Optional.
     */
    public static Optional<String> objectString(Model m) {
        return m.stream().map(st -> st.getObject().stringValue()).findAny();

    }

    /**
     * Retrieves an Subject (Resource) from the statements in a model.
     * Only one resource is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject resource from a model or an empty Optional.
     */
    public static Optional<Resource> subject(Model m) {
        return m.stream().map(Statement::getSubject).findAny();
    }

    /**
     * Retrieves an Subject (IRI) from the statements in a model.
     * Only one IRI is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject IRI from a model or an empty Optional.
     */
    public static Optional<IRI> subjectIRI(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof IRI).map(s -> (IRI) s).findAny();

    }

    /**
     * Retrieves an Subject (BNode) from the statements in a model.
     * Only one BNode is picked from the model and returned.
     *
     * @param m The model to retrieve the subject from
     * @return a subject BNode from a model or an empty Optional.
     */
    public static Optional<BNode> subjectBNode(Model m) {
        return m.stream().map(Statement::getSubject).filter(s -> s instanceof BNode).map(s -> (BNode) s).findAny();
    }

    /**
     * Retrieves an Predicate (IRI) from the statements in a model.
     * Only one predicate is picked from the model and returned.
     *
     * @param m The model to retrieve the predicate from
     * @return a predicate IRI from a model or an empty Optional.
     */
    public static Optional<IRI> predicate(Model m) {
        return m.stream().map(Statement::getPredicate).findAny();
    }

    /**
     * Finds the first subject in the provided Model that has the given predicate and object.
     *
     * @param model The Model to filter
     * @param predicate The predicate to filter by
     * @param object The object to filter by
     * @return An Optional Resource of the first subject found with the given predicate and object
     */
    public static Optional<Resource> findFirstSubject(Model model, IRI predicate, IRI object) {
        Model filteredModel = model.filter(null, predicate, object);
        if (filteredModel.size() > 0) {
            Optional<Statement> optionalStatement = filteredModel.stream().findFirst();
            if (optionalStatement.isPresent()) {
                return Optional.of(optionalStatement.get().getSubject());
            }
        }
        return Optional.empty();
    }

    /**
     * Finds the first object in the provided Model that has the given subject and predicate.
     *
     * @param model The Model to filter
     * @param subject The subject to filter by
     * @param predicate The predicate to filter by
     * @return An Optional Value of the first object found with the given subject and predicate
     */
    public static Optional<Value> findFirstObject(Model model, IRI subject, IRI predicate) {
        Model filteredModel = model.filter(subject, predicate, null);
        if (filteredModel.size() > 0) {
            Optional<Statement> optionalStatement = filteredModel.stream().findFirst();
            if (optionalStatement.isPresent()) {
                return Optional.of(optionalStatement.get().getObject());
            }
        }
        return Optional.empty();
    }

    /**
     * Create a Mobi Model from an InputStream. Will attempt to parse the stream as different RDFFormats.
     *
     * @param inputStream the InputStream to parse
     * @param transformer the SesameTransformer to convert a SesameModel to a Mobi Model
     * @return a Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static Model createModel(InputStream inputStream, SesameTransformer transformer, RDFParser... parsers) throws IOException {
        org.eclipse.rdf4j.model.Model model = new LinkedHashModel();

        Set<RDFFormat> formats = new HashSet<>(asList(RDFFormat.JSONLD, RDFFormat.TRIG, RDFFormat.TURTLE,
                RDFFormat.RDFJSON, RDFFormat.RDFXML, RDFFormat.NTRIPLES, RDFFormat.NQUADS));

        Iterator<RDFFormat> rdfFormatIterator = formats.iterator();
        ByteArrayInputStream rdfData = toByteArrayInputStream(inputStream);

        try {
            rdfData.mark(0);

            while (rdfFormatIterator.hasNext()) {
                RDFFormat format = rdfFormatIterator.next();
                try {
                    model = Rio.parse(rdfData, "", format);
                    break;
                } catch (RDFParseException | UnsupportedRDFormatException e) {
                    rdfData.reset();
                }
            }
            if (model.isEmpty()) {
                for (RDFParser parser : parsers) {
                    try {
                        final StatementCollector collector = new StatementCollector();
                        parser.setRDFHandler(collector);
                        parser.setParseErrorListener(new ParseErrorLogger());
                        parser.setParserConfig(new ParserConfig());
                        parser.parse(rdfData, "");
                        model = new LinkedHashModel(collector.getStatements());
                        break;
                    } catch (Exception e) {
                        rdfData.reset();
                    }
                }
            }
        } finally {
            IOUtils.closeQuietly(rdfData);
        }

        if (model.isEmpty()) {
            throw new IllegalArgumentException("InputStream was invalid for all formats.");
        }

        return transformer.mobiModel(model);
    }

    /**
     * Reads the provided {@link InputStream} into a {@link ByteArrayInputStream}.
     *
     * @param inputStream the InputStream to convert
     * @return a ByteArrayInputStream
     */
    private static ByteArrayInputStream toByteArrayInputStream(InputStream inputStream) throws IOException {
        byte[] buff = new byte[8000];
        int bytesRead = 0;
        ByteArrayOutputStream bao = new ByteArrayOutputStream();
        while ((bytesRead = inputStream.read(buff)) != -1) {
            bao.write(buff, 0, bytesRead);
        }
        byte[] data = bao.toByteArray();

        return new ByteArrayInputStream(data);
    }

//    public static boolean isomorphic(Iterable<? extends Statement> model1,
//                                     Iterable<? extends Statement> model2) {
//          }
//
//    public static boolean isSubset(Iterable<? extends Statement> model1,
//                                   Iterable<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    public static boolean isSubset(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean isSubsetInternal(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean matchModels(Set<? extends Statement> model1, Set<? extends Statement> model2) {
//        //TODO Implement
//        return false;
//    }
//
//    private static boolean matchModels(List<? extends Statement> model1, Iterable<? extends Statement> model2,
//                                       Map<BNode, BNode> bNodeMapping, int idx) {
//        //TODO Implement
//        return false;
//    }
//
//    private static List<Statement> findMatchingStatements(Statement st, Iterable<? extends Statement> model,
//                                                          Map<BNode, BNode> bNodeMapping) {
//        //TODO Implement
//        return new ArrayList<Statement>();
//    }
//
//    private static boolean statementsMatch(Statement st1, Statement st2, Map<BNode, BNode> bNodeMapping) {
//        //TODO Implement
//        return false;
//    }


}