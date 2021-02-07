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

import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.ParseErrorLogger;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.obolibrary.obo2owl.OWLAPIObo2Owl;
import org.obolibrary.oboformat.model.OBODoc;
import org.obolibrary.oboformat.parser.OBOFormatParser;
import org.obolibrary.oboformat.parser.OBOFormatParserException;
import org.semanticweb.owlapi.apibinding.OWLManager;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyCreationException;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLRuntimeException;
import org.semanticweb.owlapi.model.OntologyConfigurator;
import org.semanticweb.owlapi.rio.RioFunctionalSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioManchesterSyntaxParserFactory;
import org.semanticweb.owlapi.rio.RioOWLXMLParserFactory;
import org.semanticweb.owlapi.rio.RioRenderer;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class Models {
    public static final LinkedHashMap<String, List<RDFParser>> preferredExtensionParsers;
    public static final List<RDFParser> rdfParsers;
    public static final String ERROR_OBJECT_DELIMITER = ";;;";

    static {
        // RDFFormat Parsers
        RDFParser rdfJsonParser = Rio.createParser(RDFFormat.RDFJSON);
        RDFParser jsonLdParser = Rio.createParser(RDFFormat.JSONLD);
        RDFParser turtleParser = Rio.createParser(RDFFormat.TURTLE);
        RDFParser rdfXmlParser = Rio.createParser(RDFFormat.RDFXML);
        RDFParser trigParser = Rio.createParser(RDFFormat.TRIG);
        RDFParser nTriplesParser = Rio.createParser(RDFFormat.NTRIPLES);
        RDFParser nQuadsParser = Rio.createParser(RDFFormat.NQUADS);

        // OWLAPIRDFFormat Parsers
        RDFParser rioFunctionalSyntaxParser = new RioFunctionalSyntaxParserFactory().getParser();
        RDFParser rioManchesterSyntaxParser = new RioManchesterSyntaxParserFactory().getParser();
        RDFParser rioOWLXMLParser = new RioOWLXMLParserFactory().getParser();

        rdfParsers = Arrays.asList(rdfJsonParser, jsonLdParser, turtleParser, rdfXmlParser,
                rioFunctionalSyntaxParser, rioManchesterSyntaxParser, rioOWLXMLParser, trigParser,
                nTriplesParser, nQuadsParser);

        preferredExtensionParsers = new LinkedHashMap<String, List<RDFParser>>();
        preferredExtensionParsers.put("json", Arrays.asList(rdfJsonParser, jsonLdParser));
        preferredExtensionParsers.put("jsonld", Arrays.asList(jsonLdParser));
        preferredExtensionParsers.put("ttl", Arrays.asList(turtleParser));
        preferredExtensionParsers.put("xml", Arrays.asList(rioOWLXMLParser, rdfXmlParser));
        preferredExtensionParsers.put("ofn", Arrays.asList(rioFunctionalSyntaxParser));
        preferredExtensionParsers.put("omn", Arrays.asList(rioManchesterSyntaxParser));
        preferredExtensionParsers.put("owx", Arrays.asList(rioOWLXMLParser));
        preferredExtensionParsers.put("rdf", Arrays.asList(rdfXmlParser));
        preferredExtensionParsers.put("rdfs", Arrays.asList(rdfXmlParser));
        preferredExtensionParsers.put("owl", Arrays.asList(rdfXmlParser, rioOWLXMLParser));
        preferredExtensionParsers.put("trig", Arrays.asList(trigParser));
        preferredExtensionParsers.put("nt", Arrays.asList(nTriplesParser));
        preferredExtensionParsers.put("nq", Arrays.asList(nQuadsParser));
    }

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
     * Create a Mobi Model from an InputStream.
     *
     * @param preferredExtension the preferred extension as a string
     * @param inputStream the InputStream to parse
     * @param transformer the SesameTransformer to convert a SesameModel to a Mobi Model
     * @return a Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static Model createModel(String preferredExtension,
                                    InputStream inputStream,
                                    SesameTransformer transformer) throws IOException {
        List<String> triedRDFFormats =  new ArrayList<>();
        org.eclipse.rdf4j.model.Model model = new LinkedHashModel();
        ByteArrayInputStream rdfData = toByteArrayInputStream(inputStream);
        RDFParseException rdfParseException = null;

        try {
            rdfData.mark(0);
            // Check OBOFormat
            if (preferredExtension.equalsIgnoreCase("obo")) {
                try {
                    model = parseOBO(rdfData);
                } catch (OBOFormatParserException e) {
                    String template = "Error parsing OBO format based on obo extension ;;; %s";
                    rdfParseException = new RDFParseException(String.format(template, e.getMessage()));
                    rdfData.reset();
                } catch (Exception e) {
                    rdfData.reset();
                }
            }
            else if (preferredExtensionParsers.containsKey(preferredExtension.toLowerCase())) {
                for (RDFParser parser : preferredExtensionParsers.get(preferredExtension)) {
                    try {
                        model = parse(rdfData, parser);
                        rdfParseException = null;
                        break;
                    } catch (RDFParseException e) {
                        String template = "Error parsing %s format based on %s extension ;;; %s";
                        rdfParseException = new RDFParseException(String.format(template, parser.getRDFFormat().getName(), preferredExtension,  e.getMessage()));
                        rdfData.reset();
                    } catch (Exception e) {
                        rdfData.reset();
                    }
                }
            } else {
                try {
                    model = parseOBO(rdfData);
                    rdfParseException = null;
                } catch (OBOFormatParserException e) {
                    triedRDFFormats.add("OBO");
                    String template = "Error parsing OBO format. No Extension provided ;;; %s";
                    rdfParseException = new RDFParseException(String.format(template, e.getMessage()));
                    rdfData.reset();
                } catch (Exception e) {
                    rdfData.reset();
                }
                if (rdfParseException != null) {
                    for (RDFParser parser : rdfParsers) {
                        try {
                            model = parse(rdfData, parser);
                            rdfParseException = null;
                            break;
                        } catch (RDFParseException e) {
                            String parserName = parser.getRDFFormat().getName();
                            triedRDFFormats.add(parserName);
                            String template = "File was tried against all formats. No extension provided ;;; Formats: %s";
                            rdfParseException = new RDFParseException(String.format(template, triedRDFFormats));
                            rdfData.reset();
                        } catch (Exception e) {
                            rdfData.reset();
                        }
                    }
                }
            }

            // at this point throw exception so user will see parse error
            if (rdfParseException != null) {
                throw rdfParseException;
            }
        } finally {
            IOUtils.closeQuietly(rdfData);
        }
        return transformer.mobiModel(model);
    }

    public static org.eclipse.rdf4j.model.Model parse(ByteArrayInputStream rdfData, RDFParser parser) throws RDFParseException, IOException {
        final StatementCollector collector = new StatementCollector();
        parser.setRDFHandler(collector);
        parser.setParseErrorListener(new ParseErrorLogger());
        parser.setParserConfig(new ParserConfig());
        parser.parse(rdfData, "");
        return new LinkedHashModel(collector.getStatements());
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
        StatementCollector stmtCollector = new StatementCollector();
        return createModel(inputStream, transformer, stmtCollector, parsers);
    }

    public static Model createSkolemizedModel(InputStream inputStream, ModelFactory modelFactory,
                                              SesameTransformer transformer, BNodeService bNodeService,
                                              RDFParser... parsers) throws IOException {
        StatementCollector stmtCollector = new SkolemizedStatementCollector(modelFactory, transformer, bNodeService);
        return createModel(inputStream, transformer, stmtCollector, parsers);
    }

    private static Model createModel(InputStream inputStream, SesameTransformer transformer, StatementCollector collector, RDFParser... parsers) throws IOException {
        org.eclipse.rdf4j.model.Model model = new LinkedHashModel();

        List<RDFFormat> formats = asList(RDFFormat.JSONLD, RDFFormat.TRIG, RDFFormat.TURTLE,
                RDFFormat.RDFJSON, RDFFormat.RDFXML, RDFFormat.NTRIPLES, RDFFormat.NQUADS);

        List<RDFParser> allParsers = formats.stream().map(Rio::createParser).collect(Collectors.toList());
        allParsers.addAll(Arrays.asList(parsers));

        ByteArrayInputStream rdfData = toByteArrayInputStream(inputStream);

        try {
            rdfData.mark(0);
            for (RDFParser rdfParser : rdfParsers) {
                try {
                    rdfParser.setRDFHandler(collector);
                    rdfParser.setParseErrorListener(new ParseErrorLogger());
                    rdfParser.setParserConfig(new ParserConfig());
                    rdfParser.parse(rdfData, "");
                    model = new LinkedHashModel(collector.getStatements());
                    break;
                } catch (Exception e) {
                    rdfData.reset();
                }
            }
            if (model.isEmpty()) {
                // Check OBOFormat
                try {
                    model = parseOBO(rdfData);
                } catch (Exception e) {
                    rdfData.reset();
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

    private static org.eclipse.rdf4j.model.Model parseOBO(ByteArrayInputStream rdfData) throws IOException {
        OBOFormatParser parser = new OBOFormatParser();
        OBODoc obodoc;
        // Parse into an OBODoc
        try (InputStreamReader isReader = new InputStreamReader(rdfData, StandardCharsets.UTF_8);
                BufferedReader bufferedReader = new BufferedReader(isReader)) {
            parser.setReader(new BufferedReader(bufferedReader));
            obodoc = new OBODoc();
            parser.parseOBODoc(obodoc);
        }
        // Convert to an OWLOntology
        OWLOntologyManager manager = OWLManager.createOWLOntologyManager();
        manager.setOntologyConfigurator(new OntologyConfigurator());
        OWLAPIObo2Owl bridge = new OWLAPIObo2Owl(manager);
        OWLOntology ontology;
        try {
            ontology = bridge.convert(obodoc);
        } catch (OWLOntologyCreationException e) {
            throw new OWLRuntimeException(e);
        }
        // Render into an RDF4J Model
        org.eclipse.rdf4j.model.Model sesameModel = new LinkedHashModel();
        RDFHandler rdfHandler = new StatementCollector(sesameModel);
        OWLDocumentFormat format = ontology.getFormat();
        format.setAddMissingTypes(false);
        RioRenderer renderer = new RioRenderer(ontology, rdfHandler, format);
        renderer.render();
        org.eclipse.rdf4j.model.Model model = sesameModel;
        return model;
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
