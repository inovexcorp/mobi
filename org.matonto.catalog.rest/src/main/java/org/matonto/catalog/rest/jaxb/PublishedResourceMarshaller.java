package org.matonto.catalog.rest.jaxb;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlSchemaType;
import javax.xml.datatype.XMLGregorianCalendar;
import java.util.Set;

@XmlRootElement
public class PublishedResourceMarshaller {

    private String id;
    private String type;
    private String title;
    private String description;
    private XMLGregorianCalendar issued;
    private XMLGregorianCalendar modified;
    private String identifier;
    private Set<String> keywords;
    private Set<String> distributions;

    @XmlElement
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @XmlElement
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    @XmlElement
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @XmlElement
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @XmlElement
    @XmlSchemaType(name = "dateTime")
    public XMLGregorianCalendar getIssued() {
        return issued;
    }

    public void setIssued(XMLGregorianCalendar issued) {
        this.issued = issued;
    }

    @XmlElement
    @XmlSchemaType(name = "dateTime")
    public XMLGregorianCalendar getModified() {
        return modified;
    }

    public void setModified(XMLGregorianCalendar modified) {
        this.modified = modified;
    }

    @XmlElement
    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    @XmlElement
    public Set<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(Set<String> keywords) {
        this.keywords = keywords;
    }

    @XmlElement
    public Set<String> getDistributions() {
        return distributions;
    }

    public void setDistributions(Set<String> distributions) {
        this.distributions = distributions;
    }
}
