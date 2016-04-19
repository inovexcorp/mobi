package org.matonto.catalog.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.api.PublishedResource;
import org.matonto.catalog.rest.CatalogRest;
import org.matonto.catalog.rest.jaxb.DistributionMarshaller;
import org.matonto.catalog.rest.jaxb.PaginatedResults;
import org.matonto.catalog.rest.jaxb.PublishedResourceMarshaller;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rest.util.ErrorUtils;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.core.Response;
import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;
import java.time.OffsetDateTime;
import java.util.GregorianCalendar;
import java.util.Optional;

@Component(immediate = true)
public class CatalogRestImpl implements CatalogRest {

    private CatalogManager catalogManager;
    private ValueFactory valueFactory;

    @Reference
    protected void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Override
    public PublishedResourceMarshaller getPublishedResource(String resourceId) {
        if (resourceId == null) {
            throw ErrorUtils.sendError("Must provide a resource ID.", Response.Status.BAD_REQUEST);
        }

        Resource resource =
                isBNodeString(resourceId) ? valueFactory.createBNode(resourceId) : valueFactory.createIRI(resourceId);

        Optional<PublishedResource> publishedResourceOptional = catalogManager.getResource(resource);

        if (publishedResourceOptional.isPresent()) {
            PublishedResource publishedResource = publishedResourceOptional.get();

            PublishedResourceMarshaller result = new PublishedResourceMarshaller();
            result.setTitle(publishedResource.getTitle());
            result.setDescription(publishedResource.getDescription());
            result.setIssued(getCalendar(publishedResource.getIssued()));
            result.setModified(getCalendar(publishedResource.getModified()));
            result.setIdentifier(resource.stringValue());
            return result;
        } else {
            return null;
        }
    }

    @Override
    public Response createPublishedResource(PublishedResourceMarshaller resource,
                                            @DefaultValue("http://matonto.org/ontologies/catalog#PublishedResource") String resourceType) {
        return null;
    }

    @Override
    public Response deletePublishedResource(String resourceId) {
        return null;
    }

    @Override
    public PaginatedResults<PublishedResourceMarshaller> listPublishedResources(@DefaultValue("http://matonto.org/ontologies/catalog#PublishedResource") String resourceType, String searchTerms, @DefaultValue("100") int limit, @DefaultValue("0") int start) {
        return null;
    }

    @Override
    public PaginatedResults<DistributionMarshaller> getDistributions(String resourceId, @DefaultValue("100") int limit, @DefaultValue("0") int start) {
        return null;
    }

    @Override
    public Response createDistribution(Distribution distribution, String resourceId) {
        return null;
    }

    @Override
    public Response deleteDistributions(String resourceId) {
        return null;
    }

    @Override
    public Response deleteDistribution(String resourceId, String distributionId) {
        return null;
    }

    @Override
    public Response getPublishedResource() {
        return null;
    }

    private boolean isBNodeString(String string) {
        return string.matches("^_:.*$");
    }

    private XMLGregorianCalendar getCalendar(OffsetDateTime offsetDateTime) {
        GregorianCalendar calendar = GregorianCalendar.from(offsetDateTime.toZonedDateTime());

        try {
            return DatatypeFactory.newInstance().newXMLGregorianCalendar(calendar);
        } catch (DatatypeConfigurationException e) {
            throw ErrorUtils.sendError(e, "Unable to serialize resource data", Response.Status.INTERNAL_SERVER_ERROR);
        }
    }
}
