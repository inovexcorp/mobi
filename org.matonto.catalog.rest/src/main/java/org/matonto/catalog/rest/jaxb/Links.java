package org.matonto.catalog.rest.jaxb;

import javax.xml.bind.annotation.XmlElement;

public class Links {

    private String base;
    private String context;
    private String next;
    private String prev;
    private String self;

    @XmlElement
    public String getBase() {
        return base;
    }

    public void setBase(String base) {
        this.base = base;
    }

    @XmlElement
    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    @XmlElement
    public String getNext() {
        return next;
    }

    public void setNext(String next) {
        this.next = next;
    }

    @XmlElement
    public String getPrev() {
        return prev;
    }

    public void setPrev(String prev) {
        this.prev = prev;
    }

    @XmlElement
    public String getSelf() {
        return self;
    }

    public void setSelf(String self) {
        this.self = self;
    }
}
