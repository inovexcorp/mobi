package com.mobi.catalog.rest.utils;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.thingToSkolemizedObjectNode;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.InstantaneousEvent;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import net.minidev.json.JSONValue;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class CatalogRestUtils {

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Creates the JSONObject to be returned in the commit chain to more easily work with the data associated with the
     * Commit.
     *
     * @param commit        The Commit object to parse data from.
     * @param vf            The {@link ValueFactory} to use.
     * @param engineManager The {@link EngineManager} to use.
     * @return JSONObject with the necessary information set.
     */
    public static ObjectNode createCommitJson(Commit commit, ValueFactory vf, EngineManager engineManager) {
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
        ObjectNode creatorObject = mapper.createObjectNode();
        if (creator != null) {
            creatorObject.put("firstName", creator.getFirstName().stream().findFirst()
                    .orElse(emptyLiteral).stringValue());
            creatorObject.put("lastName", creator.getLastName().stream().findFirst().orElse(emptyLiteral)
                    .stringValue());
            creatorObject.put("username", creator.getUsername().orElse(emptyLiteral).stringValue());
        }

        ObjectNode commitJson = mapper.createObjectNode();
        commitJson.put("id", commit.getResource().stringValue());
        commitJson.set("creator", creatorObject);
        commitJson.put("date", date.stringValue());
        commitJson.put("message", message);
        commitJson.put("base", baseCommit);
        commitJson.put("auxiliary", auxCommit);

        return commitJson;
    }

    /**
     * Creates a Response for a Commit without its addition and deletion statements. The JSONObject in the Response has
     * the value of the Commit's JSON-LD.
     *
     * @param commit       The Commit to create a response for
     * @param transformer  The {@link SesameTransformer} to use.
     * @param bNodeService The {@link BNodeService} to use.
     * @return A Response containing a JSONObject with the Commit JSON-LD
     */
    public static Response createCommitResponse(Commit commit, SesameTransformer transformer,
                                                BNodeService bNodeService) {
        String response = thingToSkolemizedObjectNode(commit, Commit.TYPE, transformer, bNodeService).toString();
        return Response.ok(response, MediaType.APPLICATION_JSON).build();
    }

    /**
     * Creates a Response for a Commit and its addition and deletion statements in the specified format. The JSONObject
     * in the Response has key "commit" with value of the Commit's JSON-LD and the keys and values of the result of
     * getCommitDifferenceObject.
     *
     * @param commit       The Commit to create a response for
     * @param difference   The {@link Difference} for the specified commit.
     * @param format       The RDF format to return the addition and deletion statements in.
     * @param transformer  The {@link SesameTransformer} to use.
     * @param bNodeService The {@link BNodeService} to use.
     * @return A Response containing a JSONObject with the Commit JSON-LD and its addition and deletion statements
     */
    public static Response createCommitResponse(Commit commit, Difference difference, String format,
                                                SesameTransformer transformer, BNodeService bNodeService) {
        String differences = getDifferenceJsonString(difference, format, transformer, bNodeService);
        String response = differences.subSequence(0, differences.length() - 1) + ", \"commit\": "
                + thingToSkolemizedObjectNode(commit, Commit.TYPE, transformer, bNodeService).toString() + "}";
        return Response.ok(response, MediaType.APPLICATION_JSON).build();
    }

    /**
     * Creates a JSON string for the Difference statements in the specified RDF format. Key "additions" has value of the
     * Difference's addition statements and key "deletions" has value of the Difference's deletion statements.
     *
     * @param difference   The Difference to convert into a JSONObject.
     * @param format       String representing the RDF format to return the statements in.
     * @param transformer  The {@link SesameTransformer} to use.
     * @param bNodeService The {@link BNodeService} to use.
     * @return A JSONObject with a key for the Difference's addition statements and a key for the Difference's deletion
     * statements.
     */
    public static String getDifferenceJsonString(Difference difference, String format, SesameTransformer transformer,
                                                 BNodeService bNodeService) {
        String additions = modelToSkolemizedString(difference.getAdditions(), format, transformer, bNodeService);
        String deletions = modelToSkolemizedString(difference.getDeletions(), format, transformer, bNodeService);


        return "{ \"additions\": "
                + (format.toLowerCase().contains("json") ? additions : "\"" + JSONValue.escape(additions) + "\"")
                + ", \"deletions\": "
                + (format.toLowerCase().contains("json") ? deletions : "\"" + JSONValue.escape(deletions) + "\"")
                + " }";

    }
}
