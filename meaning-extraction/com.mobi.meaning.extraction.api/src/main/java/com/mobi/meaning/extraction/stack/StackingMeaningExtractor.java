package com.mobi.meaning.extraction.stack;

import com.mobi.meaning.extraction.MeaningExtractor;

public interface StackingMeaningExtractor<T extends StackItem> extends MeaningExtractor {

    void pushStack(T item);

    T popStack();

    String getCurrentLocation();

}
