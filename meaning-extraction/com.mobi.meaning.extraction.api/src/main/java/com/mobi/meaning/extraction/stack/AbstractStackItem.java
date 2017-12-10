package com.mobi.meaning.extraction.stack;


import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Value;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

public abstract class AbstractStackItem implements StackItem {

    protected final String id;

    protected final boolean root;

    protected IRI classIri;

    protected final MultiValueMap<IRI, Value> properties = new LinkedMultiValueMap<>();

    protected AbstractStackItem(String id, boolean root) {
        this(id, root, null);
    }

    protected AbstractStackItem(String id, boolean root, IRI classIri) {
        this.id = id;
        this.root = root;
        this.classIri = classIri;
    }

    @Override
    public String getIdentifier() {
        return this.id;
    }

    @Override
    public MultiValueMap<IRI, Value> getProperties() {
        return properties;
    }

    @Override
    public boolean isRoot() {
        return root;
    }

    @Override
    public IRI getClassIri() {
        return classIri;
    }

    public void setClassIri(IRI iri) {
        this.classIri = iri;
    }
}
