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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.document.translator.SemanticTranslationException;
import com.mobi.document.translator.SemanticTranslator;
import com.mobi.document.translator.ontology.ExtractedOntology;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Command(scope = "mobi", name = "document-translate",
        description = "Translates a document into RDF with an associated generated ontology.")
@Service
public class DocumentTranslationCLI implements Action {

    /**
     * Logging utility.
     */
    private static final Logger LOGGER = LoggerFactory.getLogger(DocumentTranslationCLI.class);

    @Argument(index = 0, name = "Document", required = true, description = "The document file to translate")
    @Completion(FileCompleter.class)
    private File documentFile;

    @Argument(index = 1, name = "Output Location", required = true,
            description = "The directory where we'll write the output zip file containing the ontology and data")
    @Completion(FileCompleter.class)
    private File outputDirectory;

    @Argument(index = 2, name = "Ontology IRI", required = true,
            description = "The IRI of the ontology you want to generate")
    private String ontologyIriString;

    @Argument(index = 3, name = "Document Type",
            description = "The type of document (If you don't want to use the file extension)")
    private String type;

    @Reference
    private List<SemanticTranslator> translators = new ArrayList<>();

    @Reference
    private OrmFactoryRegistry ormFactoryRegistry;

    @Reference
    private ValueFactory valueFactory;

    @Reference
    private ModelFactory modelFactory;


    @Override
    public Object execute() throws Exception {
        validateOutputLocation(outputDirectory);
        final String extension = validateFile(this.documentFile);
        final DocumentType documentType = identifyType(extension, this.type)
                .orElseThrow(() -> new SemanticTranslationException("Could not identify supported type from file extension: "
                        + extension));
        final SemanticTranslator translator = getTranslatorForType(documentType);
        final IRI ontologyIri = valueFactory.createIRI(ontologyIriString);
        final ExtractedOntology ontology = ormFactoryRegistry.createNew(ontologyIri,
                modelFactory.createModel(), ExtractedOntology.class);
        final Model results = translator.translate(Paths.get(documentFile.toURI()), ontology);
        final File outputFile = File.createTempFile(ontologyIri.getLocalName(), ".zip", outputDirectory);
        try (ZipOutputStream os = new ZipOutputStream(new FileOutputStream(outputFile))) {
            ZipEntry ontologyEntry = new ZipEntry("ontology.ttl");
            os.putNextEntry(ontologyEntry);
            //TODO - write ontology.
            ZipEntry dataEntry = new ZipEntry("data.ttl");
            os.putNextEntry(dataEntry);
            //TODO - write data.
        }
        return null;
    }

    private SemanticTranslator getTranslatorForType(DocumentType type) {
        LOGGER.info("Translating for type '{}' -- We have {} translators registered", type.name(), this.translators.size());
        switch (type) {
            case JSON:
                return translators.stream()
                        // If any of the supported types contains the type extensions.
                        .filter(translator -> CollectionUtils.containsAny(Arrays.asList(translator.getSupportedTypes()),
                                Arrays.asList(type.getExtensions())))
                        // Find the first matching the above filter predicate.
                        .findFirst()
                        // Or else throw an exception.
                        .orElseThrow(() -> new UnsupportedOperationException("No JSON translator was found in the system"));
            default:
                throw new UnsupportedOperationException("CLI doesn't yet support document type: " + type);
        }
    }

    private static void validateOutputLocation(File loc) throws IOException {
        FileUtils.forceMkdir(loc);
    }

    private static Optional<DocumentType> identifyType(final String extension, final String type)
            throws SemanticTranslationException {
        DocumentType documentType = null;
        if (type != null) {
            documentType = DocumentType.getTypeFromFileExtension(type)
                    .orElseThrow(() -> new SemanticTranslationException("Type '" + type + "' is unsupported"));
        } else {
            documentType = DocumentType.getTypeFromFileExtension(extension).orElse(null);
        }
        return Optional.ofNullable(documentType);
    }

    private static String validateFile(@Nonnull final File documentFile) throws IOException {
        if (documentFile.isFile()) {
            return FilenameUtils.getExtension(documentFile.getName());
        } else {
            throw new IOException("Specified file doesn't exist: " + documentFile.getAbsolutePath());
        }
    }
}
