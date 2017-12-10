package com.mobi.meaning.extraction.stack;

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.rdf.api.Model;

import java.io.InputStream;
import java.nio.file.Path;

public class ExampleStackingMeaningExtractor extends AbstractStackingMeaningExtractor<ExampleStackItem> {

    @Override
    public Model extractMeaning(Path rawFile, ExtractedOntology managedOntology) throws MeaningExtractionException {
        throw new MeaningExtractionException("Not implemented in this test object");
    }

    @Override
    public Model extractMeaning(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws MeaningExtractionException {
        throw new MeaningExtractionException("Not implemented in this test object");
    }
}
