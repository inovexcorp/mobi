package com.mobi.meaning.extraction.stack;

import com.mobi.meaning.extraction.MeaningExtractor;

import java.util.Stack;
import java.util.stream.Collectors;

public abstract class AbstractStackingMeaningExtractor<T extends StackItem> implements MeaningExtractor, StackingMeaningExtractor<T> {

    private final String delimiter;

    private final String prefix;

    private final String suffix;

    private final Stack<T> stack;

    protected AbstractStackingMeaningExtractor() {
        this("|", "{", "}");
    }

    protected AbstractStackingMeaningExtractor(String delimiter, String prefix, String suffix) {
        this.delimiter = delimiter;
        this.prefix = prefix;
        this.suffix = suffix;
        this.stack = new Stack<>();
    }

    @Override
    public void pushStack(T item) {
        stack.add(item);
    }

    @Override
    public T popStack() {
        return stack.pop();
    }

    @Override
    public String getCurrentLocation() {
        return stack.stream().map(StackItem::getIdentifier).collect(Collectors.joining(delimiter, prefix, suffix));
    }

}
