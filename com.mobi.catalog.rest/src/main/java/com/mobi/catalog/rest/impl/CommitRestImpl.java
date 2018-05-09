package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import static com.mobi.rest.util.RestUtils.getTypedObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.rest.CommitRest;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.InstantaneousEvent;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.jaxb.Links;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

/**
 *
 * @author Sean Smitz &lt;sean.smitz@inovexcorp.com&gt;
 */
@Component(immediate = true)
public class CommitRestImpl implements CommitRest {

    private static final Logger logger = LoggerFactory.getLogger(CommitRestImpl.class);

    private BNodeService bNodeService;
    private CatalogManager catalogManager;
    private SesameTransformer transformer;
    private ValueFactory vf;

    protected EngineManager engineManager;

    @Reference
    void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Override
    public Response getCommit(String commitId, String format) {
        Response response = Response.noContent().build();
        try {
            Optional<Commit> optCommit = catalogManager.getCommitChain(vf.createIRI(commitId)).stream().findFirst();

            if (optCommit.isPresent()) {
                response = createCommitResponse(optCommit.get(), format);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return response;
    }

    @Override
    public Response getCommitHistory(UriInfo uriInfo, String commitId, int offset, int limit) {
        Response response = Response.noContent().build();

        if (offset < 0) {
            throw ErrorUtils.sendError("Offset cannot be negative.", Response.Status.BAD_REQUEST);
        }

        if (limit < 0 || (offset > 0 && limit == 0)) {
            throw ErrorUtils.sendError("Limit must be positive.", Response.Status.BAD_REQUEST);
        }

        try {
            JSONArray commitChain = new JSONArray();

            final List<Commit> commits = catalogManager.getCommitChain(vf.createIRI(commitId));

            Stream<Commit> result = commits.stream();
            if (limit > 0) {
                result = result.skip(offset)
                        .limit(limit);
            }
            result.map(this::createCommitJson).forEach(commitChain::add);
            response = createPaginatedResponseWithJson(uriInfo, commitChain, commits.size(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return response;
    }

    /**
     * Creates the JSONObject to be returned in the commit chain to more easily work with the data associated with the
     * Commit.
     *
     * @param commit The Commit object to parse data from.
     * @return JSONObject with the necessary information set.
     */
    private JSONObject createCommitJson(Commit commit) {
        Literal emptyLiteral = vf.createLiteral("");
        Value creatorIRI = commit.getProperty(vf.createIRI(Activity.wasAssociatedWith_IRI))
                .orElse(null);
        Value date = commit.getProperty(vf.createIRI(InstantaneousEvent.atTime_IRI))
                .orElse(emptyLiteral);
        String message = commit.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue()))
                .orElse(emptyLiteral).stringValue();
        String baseCommit = commit.getProperty(vf.createIRI(Commit.baseCommit_IRI))
                .orElse(emptyLiteral).stringValue();
        String auxCommit = commit.getProperty(vf.createIRI(Commit.auxiliaryCommit_IRI))
                .orElse(emptyLiteral).stringValue();
        User creator = engineManager.retrieveUser(engineManager.getUsername((Resource) creatorIRI)
                .orElse("")).orElse(null);
        JSONObject creatorObject = new JSONObject();
        if (creator != null) {
            creatorObject.element("firstName", creator.getFirstName().stream().findFirst()
                    .orElse(emptyLiteral).stringValue())
                    .element("lastName", creator.getLastName().stream().findFirst().orElse(emptyLiteral)
                            .stringValue())
                    .element("username", creator.getUsername().orElse(emptyLiteral).stringValue());
        }

        return new JSONObject()
                .element("id", commit.getResource().stringValue())
                .element("creator", creatorObject)
                .element("date", date.stringValue())
                .element("message", message)
                .element("base", baseCommit)
                .element("auxiliary", auxCommit);
    }

    private Response createPaginatedResponseWithJson(UriInfo uriInfo, JSONArray items, int totalSize, int limit,
            int offset) {
        Links links = LinksUtils.buildLinks(uriInfo, items.size(), totalSize, limit, offset);
        Response.ResponseBuilder response = Response.ok(items).header("X-Total-Count", totalSize);
        if (links.getNext() != null) {
            response = response.link(links.getBase() + links.getNext(), "next");
        }
        if (links.getPrev() != null) {
            response = response.link(links.getBase() + links.getPrev(), "prev");
        }
        return response.build();
    }

    /**
     * Creates a Response for a Commit and its addition and deletion statements in the specified format. The JSONObject
     * in the Response has key "commit" with value of the Commit's JSON-LD and the keys and values of the result of
     * getCommitDifferenceObject.
     *
     * @param commit The Commit to create a response for
     * @param format The RDF format to return the addition and deletion statements in.
     * @return A Response containing a JSONObject with the Commit JSON-LD and its addition and deletion statements
     */
    private Response createCommitResponse(Commit commit, String format) {
        long start = System.currentTimeMillis();
        try {
            String differences = getCommitDifferenceJsonString(commit.getResource(), format);
            String response = differences.subSequence(0, differences.length() - 1) + ", \"commit\": "
                    + thingToJsonObject(commit, Commit.TYPE).toString() + "}";
            return Response.ok(response, MediaType.APPLICATION_JSON).build();
        } finally {
            logger.trace("createCommitResponse took {}ms", System.currentTimeMillis() - start);
        }
    }

    private String getCommitDifferenceJsonString(Resource commitId, String format) {
        long start = System.currentTimeMillis();
        try {
            return getDifferenceJsonString(catalogManager.getCommitDifference(commitId), format);
        } finally {
            logger.trace("getCommitDifferenceJsonString took {}ms", System.currentTimeMillis() - start);
        }
    }

    private String getDifferenceJsonString(Difference difference, String format) {
        long start = System.currentTimeMillis();
        try {
            return "{ \"additions\": " + getModelInFormat(difference.getAdditions(), format) + ", \"deletions\": "
                    + getModelInFormat(difference.getDeletions(), format) + "}";
        } finally {
            logger.trace("getDifferenceJsonString took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a Thing into a JSONObject by the first object of a specific type in the JSON-LD serialization of the
     * Thing's Model.
     *
     * @param thing The Thing to convert into a JSONObject.
     * @return The JSONObject with the JSON-LD of the Thing entity from its Model.
     */
    private JSONObject thingToJsonObject(Thing thing, String type) {
        long start = System.currentTimeMillis();
        try {
            return getTypedObjectFromJsonld(thingToJsonld(thing), type);
        } finally {
            logger.trace("thingToJsonObject took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Converts a Thing into a JSON-LD string.
     *
     * @param thing The Thing whose Model will be converted.
     * @return A JSON-LD string for the Thing's Model.
     */
    private String thingToJsonld(Thing thing) {
        return modelToJsonld(thing.getModel());
    }

    /**
     * Converts a Model into a JSON-LD string.
     *
     * @param model The Model to convert.
     * @return A JSON-LD string for the Model.
     */
    private String modelToJsonld(Model model) {
        return getModelInFormat(model, "jsonld");
    }

    /**
     * Converts a Model into a string of the provided RDF format, grouping statements by subject and predicate.
     *
     * @param model  The Model to convert.
     * @param format A string representing the RDF format to return the Model in.
     * @return A String of the converted Model in the requested RDF format.
     */
    private String getModelInFormat(Model model, String format) {
        return modelToSkolemizedString(model, format, transformer, bNodeService);
    }
}
