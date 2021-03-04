package com.mobi.document.translator.cli;

/*-
 * #%L
 * com.mobi.document.translation.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.impl.csv.CsvSemanticTranslator;
import com.mobi.document.translator.ontology.ExtractedOntology;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.karaf.shell.api.action.*;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.annotation.Nonnull;

@Command(scope = "mobi", name = "document-translate",
        description = "Translates a document into RDF with an associated generated ontology.")
@Service
public class DocumentTranslationCLI implements Action {

    /**
     * Logging utility.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentTranslationCLI.class);

    @Argument(name = "document", required = true, description = "The document file to translate")
    @Completion(FileCompleter.class)
    private File documentFile;

    @Argument(index = 1, name = "outputLocation", required = true,
            description = "The directory where we'll write the output zip file containing the ontology and data")
    @Completion(FileCompleter.class)
    private File outputDirectory;

    @Option(name = "-i", aliases ="--ontology-iri",
            description = "The IRI of the ontology you want to generate")
    private String ontologyIriString;

    @Option(name = "-t", aliases = "--document-type",
            description = "The type of document (If you don't want to use the file extension)")
    private String type;

    @Option(name = "-r", aliases = "--row-count",
            description = "The desired amount of rows (excluding headers) to parse a csv in order to determine range datatype")
    private int desiredRows;


    @Reference
    private List<SemanticTranslator> translators = new ArrayList<>();

    @Reference
    private OrmFactoryRegistry ormFactoryRegistry;

    @Reference
    private ValueFactory valueFactory;

    @Reference
    private ModelFactory modelFactory;

    @Reference
    private SesameTransformer sesameTransformer;

    @Override
    public Object execute() throws Exception {
        validateOutputLocation(outputDirectory);
        final SemanticTranslator translator = getTranslatorForType(type != null ? type
                : FilenameUtils.getExtension(documentFile.getName()));
        ontologyIriString = ontologyIriString != null ? ontologyIriString
                        : String.format("urn://mobi.inovexcorp.com/extractedOntology/%s", UUID.randomUUID().toString());
        final IRI ontologyIri = valueFactory.createIRI(ontologyIriString);
        final ExtractedOntology ontology = ormFactoryRegistry.createNew(ontologyIri,
                modelFactory.createModel(), ExtractedOntology.class);
        final Model results = translator.translate(Paths.get(documentFile.toURI()), ontology);
        final File outputFile = File.createTempFile(ontologyIri.getLocalName(), ".zip", outputDirectory);
        try (ZipOutputStream os = new ZipOutputStream(new FileOutputStream(outputFile))) {
            final ZipEntry ontologyEntry = new ZipEntry("ontology.ttl");
            os.putNextEntry(ontologyEntry);
            writeData(ontology.getModel(), os);
            ZipEntry dataEntry = new ZipEntry("data.ttl");
            os.putNextEntry(dataEntry);
            writeData(results, os);
        }
        return null;
    }

    private void writeData(final Model model, OutputStream os) {
        org.eclipse.rdf4j.rio.RDFHandler handler1 =
                new BufferedGroupingRDFHandler(Rio.createWriter(RDFFormat.TURTLE, os));
        Rio.write(sesameTransformer.sesameModel(model), handler1);
    }

    private SemanticTranslator getTranslatorForType(String type) {
        LOGGER.info("Translating for type '{}' -- We have {} translators registered", type, this.translators.size());
        SemanticTranslator derivedTranslator = translators.stream()
                // If any of the supported types contains the type extensions.
                .filter(translator -> Arrays.asList(translator.getSupportedTypes()).contains(type))
                // Find the first matching the above filter predicate.
                .findFirst()
                // Or else throw an exception.
                .orElseThrow(() -> new UnsupportedOperationException("No translator was found in the system for that file type"));

        if (derivedTranslator instanceof CsvSemanticTranslator) {
            ((CsvSemanticTranslator) derivedTranslator).setDesiredRows(desiredRows);
        }

        return derivedTranslator;
    }

    private static void validateOutputLocation(File loc) throws IOException {
        FileUtils.forceMkdir(loc);
    }

    private static String validateFile(@Nonnull final File documentFile) throws IOException {
        if (documentFile.isFile()) {
            return FilenameUtils.getExtension(documentFile.getName());
        } else {
            throw new IOException("Specified file doesn't exist: " + documentFile.getAbsolutePath());
        }
    }
}
