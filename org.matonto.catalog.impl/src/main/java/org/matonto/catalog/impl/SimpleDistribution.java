package org.matonto.catalog.impl;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.matonto.catalog.api.Distribution;
import org.matonto.rdf.api.Resource;

import java.net.URL;
import java.time.OffsetDateTime;

public class SimpleDistribution implements Distribution {

    protected String title;
    protected String description;
    protected OffsetDateTime issued;
    protected OffsetDateTime modified;
    protected String license;
    protected String rights;
    protected URL accessURL;
    protected URL downloadURL;
    protected String mediaType;
    protected String format;
    protected long byteSize;
    protected Resource resource;

    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public OffsetDateTime getIssued() {
        return issued;
    }

    @Override
    public OffsetDateTime getModified() {
        return modified;
    }

    @Override
    public String getLicense() {
        return license;
    }

    @Override
    public String getRights() {
        return rights;
    }

    @Override
    public URL getAccessURL() {
        return accessURL;
    }

    @Override
    public URL getDownloadURL() {
        return downloadURL;
    }

    @Override
    public String getMediaType() {
        return mediaType;
    }

    @Override
    public String getFormat() {
        return format;
    }

    @Override
    public long getByteSize() {
        return byteSize;
    }

    @Override
    public Resource getResource() {
        return resource;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj.getClass() != getClass()) {
            return false;
        }
        SimpleDistribution rhs = (SimpleDistribution) obj;
        return new EqualsBuilder()
                .append(title, rhs.title)
                .append(description, rhs.description)
                .append(issued, rhs.issued)
                .append(modified, rhs.modified)
                .append(license, rhs.license)
                .append(rights, rhs.rights)
                .append(accessURL, rhs.accessURL)
                .append(downloadURL, rhs.downloadURL)
                .append(mediaType, rhs.mediaType)
                .append(format, rhs.format)
                .append(byteSize, rhs.byteSize)
                .append(resource, rhs.resource)
                .isEquals();
    }

    @Override
    public int hashCode() {
        // you pick a hard-coded, randomly chosen, non-zero, odd number
        // ideally different for each class
        return new HashCodeBuilder(17, 37)
                .append(title)
                .append(description)
                .append(issued)
                .append(modified)
                .append(license)
                .append(rights)
                .append(accessURL)
                .append(downloadURL)
                .append(mediaType)
                .append(format)
                .append(byteSize)
                .append(resource)
                .toHashCode();
    }

    public static class Builder {
        private final String title;
        private String description;
        private OffsetDateTime issued;
        private OffsetDateTime modified;
        private String license;
        private String rights;
        private URL accessURL;
        private URL downloadURL;
        private String mediaType;
        private String format;
        private long byteSize;
        private final Resource resource;

        public Builder(Resource resource, String title) {
            this.resource = resource;
            this.title = title;
        }

        public Builder description(String val) {
            description = val;
            return this;
        }

        public Builder issued(OffsetDateTime val) {
            issued = val;
            return this;
        }

        public Builder modified(OffsetDateTime val) {
            modified = val;
            return this;
        }

        public Builder license(String val) {
            license = val;
            return this;
        }

        public Builder rights(String val) {
            rights = val;
            return this;
        }

        public Builder accessURL(URL val) {
            accessURL = val;
            return this;
        }

        public Builder downloadURL(URL val) {
            downloadURL = val;
            return this;
        }

        public Builder mediaType(String val) {
            mediaType = val;
            return this;
        }

        public Builder format(String val) {
            format = val;
            return this;
        }

        public Builder byteSize(long val) {
            byteSize = val;
            return this;
        }

        public SimpleDistribution build() {
            setModified();
            return new SimpleDistribution(this);
        }

        private void setModified() {
            if (modified == null) {
                modified = issued;
            } else if (issued.isAfter(modified)) {
                throw new IllegalStateException("Modified time must occur after issued time.");
            }
        }
    }

    private SimpleDistribution(Builder builder) {
        title = builder.title;
        description = builder.description;
        issued = builder.issued;
        modified = builder.modified;
        license = builder.license;
        rights = builder.rights;
        accessURL = builder.accessURL;
        downloadURL = builder.downloadURL;
        mediaType = builder.mediaType;
        format = builder.mediaType;
        byteSize = builder.byteSize;
        resource = builder.resource;
    }
}
