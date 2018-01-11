package com.mobi.document.translator.cli;

import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.semantic.translator.SemanticTranslationException;
import com.mobi.semantic.translator.SemanticTranslator;
import com.mobi.semantic.translator.ontology.ExtractedOntology;
import com.mobi.semantic.translator.stack.impl.json.JsonStackingSemanticTranslator;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Command(scope = "mobi", name = "document-translate",
        description = "Translates a document into RDF with an associated generated ontology.")
@Service
public class DocumentTranslationCLI implements Action {

    @Argument(index = 0, name = "Document", required = true, description = "The document file to translate")
    @Completion(FileCompleter.class)
    private File documentFile;

    @Argument(index = 1, name = "Ontology IRI", required = true,
            description = "The IRI of the ontology you want to generate")
    private String ontologyIriString;

    @Argument(index = 2, name = "Output Location", required = true,
            description = "The directory where we'll write the output zip file containing the ontology and data")
    private File outputDirectory;

    @Argument(index = 3, name = "Document Type",
            description = "The type of document -- If you don't want to use the file extension")
    private String type;

    private Collection<SemanticTranslator> translators = new ArrayList<>();

    private OrmFactoryRegistry ormFactoryRegistry;

    private ValueFactory valueFactory;

    private ModelFactory modelFactory;

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    void setOrmFactoryRegistry(OrmFactoryRegistry registry) {
        this.ormFactoryRegistry = registry;
    }

    @Reference(dynamic = true, multiple = true, unbind = "unregisterTranslator")
    void registerTranslator(SemanticTranslator translator) {
        this.translators.add(translator);
    }

    void unregisterTranslator(SemanticTranslator translator) {
        this.translators.remove(translator);
    }

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

    private SemanticTranslator getTranslatorForType(DocumentType type) throws IOException

    {
        switch (type) {
            case JSON:
                return translators.stream().filter(translator -> translator instanceof JsonStackingSemanticTranslator)
                        .findFirst()
                        .orElseThrow(() -> new UnsupportedOperationException("No JSON translator was found in the system"));
            default:
                throw new UnsupportedOperationException("CLI doesn't yet support document type: " + type);
        }
    }

    private static void validateOutputLocation(File loc) throws IOException {
        FileUtils.forceMkdir(loc);
    }

    private static Optional<DocumentType> identifyType(final String extension, final String type) throws SemanticTranslationException {
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
