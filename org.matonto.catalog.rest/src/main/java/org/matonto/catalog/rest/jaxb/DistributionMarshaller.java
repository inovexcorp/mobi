package org.matonto.catalog.rest.jaxb;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.datatype.XMLGregorianCalendar;

public class DistributionMarshaller {

    private String id;
    private String title;
    private String description;
    private XMLGregorianCalendar issued;
    private XMLGregorianCalendar modified;
    private String license;
    private String rights;
    private String accessURL;
    private String downloadURL;
    private String mediaType;
    private String format;
    private long bytesSize;

    @XmlElement
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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
    public XMLGregorianCalendar getIssued() {
        return issued;
    }

    public void setIssued(XMLGregorianCalendar issued) {
        this.issued = issued;
    }

    @XmlElement
    public XMLGregorianCalendar getModified() {
        return modified;
    }

    public void setModified(XMLGregorianCalendar modified) {
        this.modified = modified;
    }

    @XmlElement
    public String getLicense() {
        return license;
    }

    public void setLicense(String license) {
        this.license = license;
    }

    @XmlElement
    public String getRights() {
        return rights;
    }

    public void setRights(String rights) {
        this.rights = rights;
    }

    @XmlElement
    public String getAccessURL() {
        return accessURL;
    }

    public void setAccessURL(String accessURL) {
        this.accessURL = accessURL;
    }

    @XmlElement
    public String getDownloadURL() {
        return downloadURL;
    }

    public void setDownloadURL(String downloadURL) {
        this.downloadURL = downloadURL;
    }

    @XmlElement
    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    @XmlElement
    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    @XmlElement
    public long getBytesSize() {
        return bytesSize;
    }

    public void setBytesSize(long bytesSize) {
        this.bytesSize = bytesSize;
    }
}
