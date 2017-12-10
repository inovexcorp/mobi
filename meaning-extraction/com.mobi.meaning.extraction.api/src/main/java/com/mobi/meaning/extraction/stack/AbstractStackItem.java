package com.mobi.meaning.extraction.stack;

public abstract class AbstractStackItem implements StackItem {

    private final String id;

    public AbstractStackItem(String id) {
        this.id = id;
    }

    @Override
    public String getIdentifier() {
        return this.id;
    }
}
