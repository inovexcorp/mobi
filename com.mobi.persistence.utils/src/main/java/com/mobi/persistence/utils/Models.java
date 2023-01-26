package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.mobi.owlapi.utils.OwlApiUtils;
import com.mobi.persistence.utils.api.BNodeService;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.rio.ParserConfig;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.ParseErrorLogger;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.eclipse.rdf4j.rio.rdfxml.RDFXMLParser;
import org.eclipse.rdf4j.rio.turtle.TurtleParser;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class Models {
    protected static final Map<String, List<RDFParser>> preferredExtensionParsers;
    protected static final List<RDFParser> rdfParsers;
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

        rdfParsers = List.of(rdfJsonParser, jsonLdParser, turtleParser, rdfXmlParser, trigParser,
                nTriplesParser, nQuadsParser);

        preferredExtensionParsers = new LinkedHashMap<>();
        preferredExtensionParsers.put("json", List.of(rdfJsonParser, jsonLdParser));
        preferredExtensionParsers.put("jsonld", List.of(jsonLdParser));
        preferredExtensionParsers.put("ttl", List.of(turtleParser));
        preferredExtensionParsers.put("rdf", List.of(rdfXmlParser));
        preferredExtensionParsers.put("rdfs", List.of(rdfXmlParser));
        preferredExtensionParsers.put("trig", List.of(trigParser));
        preferredExtensionParsers.put("nt", List.of(nTriplesParser));
        preferredExtensionParsers.put("nq", List.of(nQuadsParser));
    }

    protected Models(){}

    /**
     * Retrieves an Object (Value) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param model The model to retrieve the value from
     * @return an object value from a model or an empty Optional.
     */
    public static Optional<Value> object(Model model) {
        return model.stream().map(Statement::getObject).findAny();
    }

    /**
     * Retrieves an Object (Literal) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param model The model to retrieve the object literal from
     * @return an object literal from a model or an empty Optional.
     */
    public static Optional<Literal> objectLiteral(Model model) {
        return model.stream().map(Statement::getObject)
                .filter(Literal.class::isInstance)
                .map(Literal.class::cast)
                .findAny();
    }

    /**
     * Retrieves an Object (IRI) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param model The model to retrieve the object iri from
     * @return an object iri from a model or an empty Optional.
     */
    public static Optional<IRI> objectIRI(Model model) {
        return model.stream()
                .map(Statement::getObject)
                .filter(IRI.class::isInstance)
                .map(IRI.class::cast)
                .findAny();
    }

    /**
     * Retrieves an Object (Resource) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param model The model to retrieve the object resource from
     * @return an object resource from a model or an empty Optional.
     */
    public static Optional<Resource> objectResource(Model model) {
        return model.stream()
                .map(Statement::getObject)
                .filter(Resource.class::isInstance)
                .map(Resource.class::cast)
                .findAny();
    }

    /**
     * Retrieves an Object (String) from the statements in a model.
     * Only one value is picked from the model and returned.
     *
     * @param model The model to retrieve the object string from
     * @return an object string from a model or an empty Optional.
     */
    public static Optional<String> objectString(Model model) {
        return model.stream()
                .map(st -> st.getObject().stringValue())
                .findAny();

    }

    /**
     * Retrieves an Subject (Resource) from the statements in a model.
     * Only one resource is picked from the model and returned.
     *
     * @param model The model to retrieve the subject from
     * @return a subject resource from a model or an empty Optional.
     */
    public static Optional<Resource> subject(Model model) {
        return model.stream()
                .map(Statement::getSubject)
                .findAny();
    }

    /**
     * Retrieves an Subject (IRI) from the statements in a model.
     * Only one IRI is picked from the model and returned.
     *
     * @param model The model to retrieve the subject from
     * @return a subject IRI from a model or an empty Optional.
     */
    public static Optional<IRI> subjectIRI(Model model) {
        return model.stream()
                .map(Statement::getSubject)
                .filter(IRI.class::isInstance)
                .map(IRI.class::cast)
                .findAny();

    }

    /**
     * Retrieves an Subject (BNode) from the statements in a model.
     * Only one BNode is picked from the model and returned.
     *
     * @param model The model to retrieve the subject from
     * @return a subject BNode from a model or an empty Optional.
     */
    public static Optional<BNode> subjectBNode(Model model) {
        return model.stream()
                .map(Statement::getSubject)
                .filter(BNode.class::isInstance)
                .map(BNode.class::cast)
                .findAny();
    }

    /**
     * Retrieves an Predicate (IRI) from the statements in a model.
     * Only one predicate is picked from the model and returned.
     *
     * @param model The model to retrieve the predicate from
     * @return a predicate IRI from a model or an empty Optional.
     */
    public static Optional<IRI> predicate(Model model) {
        return model.stream()
                .map(Statement::getPredicate)
                .findAny();
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
        if (!filteredModel.isEmpty()) {
            Statement statement = filteredModel.stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Model cannot be empty"));
            return Optional.of(statement.getSubject());
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
        if (!filteredModel.isEmpty()) {
            Statement statement = filteredModel.stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Model cannot be empty"));
            return Optional.of(statement.getObject());
        }
        return Optional.empty();
    }

    /**
     * Create a {@link ParsedModel} instance with Mobi Model from an InputStream.
     *
     * @param preferredExtension the preferred extension as a string
     * @param inputStream the InputStream to parse
     * @return {@link ParsedModel} with Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static ParsedModel createModel(String preferredExtension,
                                          InputStream inputStream) throws IOException {
        return createModel(preferredExtension, inputStream, new StatementCollector());
    }

    /**
     * Create a {@link ParsedModel} instance with Mobi Model from an InputStream.
     *
     * @param preferredExtension the preferred extension as a string
     * @param inputStream the InputStream to parse
     * @param collector the StatementCollector used to aggregate statements
     * @return {@link ParsedModel} with Mobi Model from the parsed InputStream
     * @throws IOException if an error occurs when accessing the InputStream contents
     */
    public static ParsedModel createModel(String preferredExtension, InputStream inputStream,
                                          StatementCollector collector) throws IOException {
        ByteArrayInputStream rdfData = toByteArrayInputStream(inputStream);

        if (preferredExtension.endsWith("gzip") || preferredExtension.endsWith("gz")) {
            preferredExtension = FilenameUtils.removeExtension(preferredExtension);
            try (BufferedInputStream bis = new BufferedInputStream(rdfData);
                    GZIPInputStream gzis = new GZIPInputStream(bis)) {
                rdfData = toByteArrayInputStream(gzis);
            }
        } else if (preferredExtension.endsWith("zip")) {
            preferredExtension = FilenameUtils.removeExtension(preferredExtension);
            try (BufferedInputStream bis = new BufferedInputStream(rdfData);
                    ZipInputStream zis = new ZipInputStream(bis)) {
                ZipEntry ze;
                int counter = 0;
                while ((ze = zis.getNextEntry()) != null) {
                    String fileName = ze.getName();
                    if (!ze.isDirectory() && !Paths.get(fileName).startsWith("__MACOSX")) {
                        counter++;
                        if (counter > 1) {
                            throw new MobiException("Compressed upload must only contain a single file.");
                        }
                        preferredExtension = FilenameUtils.getExtension(fileName);
                        rdfData = toByteArrayInputStream(zis);
                    }
                }
            }
        }
        return buildModel(preferredExtension, rdfData, collector);
    }

    private static ParsedModel buildModel(String preferredExtension, ByteArrayInputStream rdfData,
                                          StatementCollector collector) {
        assert preferredExtension != null;
        List<String> triedRDFFormats =  new ArrayList<>();
        ParsedModel parsedModel;
        try {
            rdfData.mark(0);
            if ("obo".equalsIgnoreCase(preferredExtension)) {
                parsedModel = parseOBO(rdfData, collector, triedRDFFormats);
            } else if ("ofn".equalsIgnoreCase(preferredExtension)) {
                parsedModel = parseFunctional(rdfData, collector, triedRDFFormats);
            } else if ("omn".equalsIgnoreCase(preferredExtension)) {
                parsedModel = parseManchester(rdfData, collector, triedRDFFormats);
            } else if ("owl".equalsIgnoreCase(preferredExtension) || "xml".equalsIgnoreCase(preferredExtension)) {
                parsedModel = parseOWLXML(rdfData, collector, triedRDFFormats);
            } else if (preferredExtensionParsers.containsKey(preferredExtension.toLowerCase())) {
                parsedModel = parseIteration(rdfData, collector, triedRDFFormats,
                        preferredExtensionParsers.get(preferredExtension));
            } else {
                parsedModel = parseOBO(rdfData, collector, triedRDFFormats);
                if (parsedModel.getRdfFormatName() == null) {
                    parsedModel = parseIteration(rdfData, collector, triedRDFFormats, rdfParsers);
                }
            }
        } finally {
            IOUtils.closeQuietly(rdfData);
        }

        // at this point throw exception so user will see parse error
        if (parsedModel.getRdfParseException().isPresent()) {
            throw parsedModel.getRdfParseException().get();
        }

        return parsedModel;
    }

    /**
     * Parsing rdfData ByteArrayInputStream.
     * @param rdfData InputStream to parse
     * @param collector StatementCollector used to aggregate statements
     * @param triedRDFFormats keeps track of all tried rdf formats
     * @param inputRDFParsers List of RDF parsers to try
     * @return {@link ParsedModel} results of the model building
     */
    private static ParsedModel parseIteration(ByteArrayInputStream rdfData, StatementCollector collector,
                                              List<String> triedRDFFormats, List<RDFParser> inputRDFParsers) {
        ParsedModel parsedModel = new ParsedModel();

        for (RDFParser parser : inputRDFParsers) {
            String parserName = parser.getRDFFormat().getName();
            try {
                Model model = parse(rdfData, parser, collector);
                parsedModel = new ParsedModel(model, parserName);
                break;
            } catch (RDFParseException e) {
                triedRDFFormats.add(parserName);
                parsedModel = new ParsedModel();
                parsedModel.addFormatToError(parserName, e.getMessage());
                rdfData.reset();
            } catch (Exception e) {
                rdfData.reset();
            }
        }
        return parsedModel;
    }

    private static Model parse(ByteArrayInputStream rdfData, RDFParser parser, StatementCollector collector)
            throws RDFParseException, IOException {
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
     * @param parsers the array of additional parsers to use when parsing the InputStream
     * @return a Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static Model createModel(InputStream inputStream, RDFParser... parsers) throws IOException {
        StatementCollector stmtCollector = new StatementCollector();
        return createModel(inputStream, stmtCollector, parsers).getModel();
    }

    /**
     * Create a Skolemized Mobi Model from an InputStream. Will attempt to parse the stream using the passed in
     * RDFParsers
     *
     * @param inputStream the InputStream to parse
     * @param modelFactory the {@link ModelFactory} help build the {@link StatementCollector}
     * @param bNodeService the {@link BNodeService} used for skolemizing bnodes
     * @param skolemizedBNodes map of BNodes to their corresponding deterministically skolemized IRI.
     * @return {@link ParsedModel} with Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static ParsedModel createSkolemizedModel(InputStream inputStream, ModelFactory modelFactory,
                                                    BNodeService bNodeService, Map<BNode, IRI> skolemizedBNodes,
                                                    RDFParser... parsers) throws IOException {
        StatementCollector stmtCollector = new SkolemizedStatementCollector(modelFactory, bNodeService,
                skolemizedBNodes);
        return createModel(inputStream, stmtCollector, parsers);
    }

    /**
     * Create a Skolemized Mobi Model from an InputStream. Will attempt to parse the stream using the passed in
     * preferred extension.
     *
     * @param preferredExtension the extension that will be used to determine which {@link RDFParser} to use
     * @param inputStream the InputStream to parse
     * @param modelFactory the {@link ModelFactory} help build the {@link StatementCollector}
     * @param bNodeService the {@link BNodeService} used for skolemizing bnodes
     * @param skolemizedBNodes map of BNodes to their corresponding deterministically skolemized IRI.
     * @return {@link ParsedModel} with Mobi Model from the parsed InputStream
     * @throws IOException if a error occurs when accessing the InputStream contents
     */
    public static ParsedModel createSkolemizedModel(String preferredExtension, InputStream inputStream,
                                              ModelFactory modelFactory,
                                              BNodeService bNodeService,
                                              Map<BNode, IRI> skolemizedBNodes) throws IOException {
        StatementCollector stmtCollector = new SkolemizedStatementCollector(modelFactory, bNodeService,
                skolemizedBNodes);
        return createModel(preferredExtension, inputStream, stmtCollector);
    }

    private static ParsedModel createModel(InputStream inputStream, StatementCollector collector,
                                           RDFParser... parsers) throws IOException {
        List<String> triedRDFFormats = new ArrayList<>();
        List<RDFFormat> formats = List.of(RDFFormat.JSONLD, RDFFormat.TURTLE,
                RDFFormat.RDFJSON, RDFFormat.RDFXML, RDFFormat.NTRIPLES, RDFFormat.NQUADS, RDFFormat.TRIG);

        List<RDFParser> allParsers = formats.stream().map(Rio::createParser).collect(Collectors.toList());
        allParsers.addAll(List.of(parsers));

        ByteArrayInputStream rdfData = toByteArrayInputStream(inputStream);

        ParsedModel parsedModel;
        try {
            rdfData.mark(0);
            parsedModel = parseIteration(rdfData, collector, triedRDFFormats , rdfParsers);

            if (parsedModel.getRdfFormatName() == null) {
                parsedModel = parseOWLXML(rdfData, collector, triedRDFFormats);
            }
            if (parsedModel.getRdfFormatName() == null) {
                parsedModel = parseOBO(rdfData, collector, triedRDFFormats);
            }
            if (parsedModel.getRdfFormatName() == null) {
                parsedModel = parseFunctional(rdfData, collector, triedRDFFormats);
            }
            if (parsedModel.getRdfFormatName() == null) {
                parsedModel = parseManchester(rdfData, collector, triedRDFFormats);
            }

        } finally {
            IOUtils.closeQuietly(rdfData);
        }

        if (parsedModel.getRdfFormatName() == null) {
            throw new IllegalArgumentException("InputStream was invalid for all formats " + triedRDFFormats);
        }

        return parsedModel;
    }

    private static ParsedModel parseFunctional(ByteArrayInputStream rdfData, StatementCollector collector,
                                               List<String> triedRDFFormats) {
        ParsedModel parsedModel;
        try {
            Path tmpTurtleFile = OwlApiUtils.parseFunctional(rdfData);
            parsedModel = getTurtleFromPath(tmpTurtleFile, collector,"OFN");
            Files.delete(tmpTurtleFile);
        } catch (Exception e) {
            triedRDFFormats.add("OFN");
            parsedModel = new ParsedModel();
            parsedModel.addFormatToError("OFN", e.getMessage());
            rdfData.reset();
        }
        return parsedModel;
    }

    private static ParsedModel parseManchester(ByteArrayInputStream rdfData, StatementCollector collector,
                                               List<String> triedRDFFormats) {
        ParsedModel parsedModel;
        try {
            Path tmpTurtleFile = OwlApiUtils.parseManchester(rdfData);
            parsedModel = getTurtleFromPath(tmpTurtleFile, collector,"OMN");
            Files.delete(tmpTurtleFile);
        } catch (Exception e) {
            triedRDFFormats.add("OMN");
            parsedModel = new ParsedModel();
            parsedModel.addFormatToError("OMN", e.getMessage());
            rdfData.reset();
        }
        return parsedModel;
    }

    private static ParsedModel parseOWLXML(ByteArrayInputStream rdfData, StatementCollector collector,
                                           List<String> triedRDFFormats) {
        ParsedModel parsedModel = parseIteration(rdfData, collector, triedRDFFormats, List.of(new RDFXMLParser()));
        if (parsedModel.getModel() == null) {
            try {
                Path tmpTurtleFile = OwlApiUtils.parseOWLXML(rdfData);
                parsedModel = getTurtleFromPath(tmpTurtleFile, collector,RDFFormat.RDFXML.getName());
                Files.delete(tmpTurtleFile);
            } catch (Exception e) {
                triedRDFFormats.add(RDFFormat.RDFXML.getName());
                parsedModel = new ParsedModel();
                parsedModel.addFormatToError(RDFFormat.RDFXML.getName(), e.getMessage());
                rdfData.reset();
            }
        }
        return parsedModel;
    }

    private static ParsedModel parseOBO(ByteArrayInputStream rdfData, StatementCollector collector,
                                        List<String> triedRDFFormats) {
        ParsedModel parsedModel;
        try {
            Path tmpTurtleFile = OwlApiUtils.parseOBO(rdfData);
            parsedModel = getTurtleFromPath(tmpTurtleFile, collector,"OBO");
            Files.delete(tmpTurtleFile);
        } catch (Exception e) {
            triedRDFFormats.add("OBO");
            parsedModel = new ParsedModel();
            parsedModel.addFormatToError("OBO", e.getMessage());
            rdfData.reset();
        }
        return parsedModel;
    }

    private static ParsedModel getTurtleFromPath(Path path, StatementCollector collector, String rdfFormatName)
            throws IOException {
        RDFParser parser = new TurtleParser();
        parser.setRDFHandler(collector);
        parser.setParseErrorListener(new ParseErrorLogger());
        parser.setParserConfig(new ParserConfig());
        parser.parse(Files.newInputStream(path), "");
        return new ParsedModel(new LinkedHashModel(collector.getStatements()), rdfFormatName);
    }

    /**
     * Reads the provided {@link InputStream} into a {@link ByteArrayInputStream}.
     *
     * @param inputStream the InputStream to convert
     * @return a ByteArrayInputStream
     */
    public static ByteArrayInputStream toByteArrayInputStream(InputStream inputStream) throws IOException {
        if (inputStream instanceof ByteArrayInputStream) {
            return (ByteArrayInputStream) inputStream;
        }

        byte[] buff = new byte[8000];
        int bytesRead = 0;
        ByteArrayOutputStream bao = new ByteArrayOutputStream();
        while ((bytesRead = inputStream.read(buff)) != -1) {
            bao.write(buff, 0, bytesRead);
        }
        byte[] data = bao.toByteArray();

        return new ByteArrayInputStream(data);
    }
}
