package com.mobi.meaning.extraction.json;

import com.mobi.meaning.extraction.MeaningExtractionException;
import com.mobi.meaning.extraction.MeaningExtractor;
import com.mobi.meaning.extraction.ontology.ExtractedOntology;
import com.mobi.meaning.extraction.stack.AbstractStackingMeaningExtractor;
import com.mobi.meaning.extraction.stack.StackingMeaningExtractor;
import com.mobi.rdf.api.Model;

import java.io.InputStream;
import java.nio.file.Path;

public class JsonMeaningExtractor extends AbstractStackingMeaningExtractor<JsonStackItem> implements StackingMeaningExtractor<JsonStackItem>, MeaningExtractor {

    @Override
    public Model extractMeaning(InputStream dataStream, String entityIdentifier, ExtractedOntology managedOntology) throws MeaningExtractionException {
        return null;
    }

    @Override
    public Model extractMeaning(Path rawFile, ExtractedOntology managedOntology) throws MeaningExtractionException {
        return null;
    }
}
