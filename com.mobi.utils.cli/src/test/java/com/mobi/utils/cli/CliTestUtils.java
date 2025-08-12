package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.utils.cli.api.RestoreOperation;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.ArtifactVersion;
import org.apache.maven.artifact.versioning.DefaultArtifactVersion;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.Assert;
import org.mockito.Mockito;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.junit.Assert.fail;

public class CliTestUtils {

    /**
     * Load Files into Repository
     * @param repo Repo
     * @param files Trig Files
     */
    public static void loadFiles(Repository repo, String... files) {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.begin();
            for(String name : files){
                InputStream testData = RestoreServiceTest.class.getResourceAsStream(name);
                conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            }
            conn.commit();
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
    }

    /**
     * Query Resource
     * @param repo repo
     * @param path path to file
     * @param bindings bindings for query
     * @return Results
     */
    public static List<String> queryResource(Repository repo, String path, String... bindings){
        List<String> results = new ArrayList<>();
        List<String> bindingValues = new ArrayList<>();

        try (RepositoryConnection conn = repo.getConnection()) {
            String query = IOUtils.toString(Restore.class.getResourceAsStream(path), StandardCharsets.UTF_8);
            TupleQuery tupleQuery = conn.prepareTupleQuery(query);
            TupleQueryResult result = tupleQuery.evaluate();
            while (result.hasNext()) {  // iterate over the result
                bindingValues.clear();
                BindingSet bindingSet = result.next();

                for (String binding : bindings){
                    if (bindingSet.getValue(binding) != null){
                        bindingValues.add(bindingSet.getValue(binding).toString());
                    }else{
                        bindingValues.add("NULL");
                    }
                }
                results.add(String.join(";", bindingValues));
            }
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
        return results;
    }

    /**
     * Run Version Check
     * @param operation RestoreOperation
     * @param expectedVersions Versions that
     * @return A list of supported version
     * @throws InvalidVersionSpecificationException
     */
    public static List<String> runVersionCheck(RestoreOperation operation, List<String> expectedVersions) throws InvalidVersionSpecificationException {
        List<ArtifactVersion> supportedVersions = expectedVersions.stream()
                .map(version -> new DefaultArtifactVersion(version.substring(0, version.indexOf(";"))))
                .collect(Collectors.toUnmodifiableList());

        VersionRange versionRange = operation.getVersionRange();

        List<String> actualVersionCheck = supportedVersions.stream()
                .map(o-> String.format("%s;%s",o , versionRange.containsVersion(o))).collect(Collectors.toUnmodifiableList());
        return actualVersionCheck;
    }

    /**
     * mockRestoreOperation
     * @param clazz Class
     * @param spec VersionRange
     * @param priority Priority
     * @return Mocked RestoreOperation
     */
    public static RestoreOperation mockRestoreOperation(Class<? extends RestoreOperation> clazz, String spec, int priority) {
        RestoreOperation restoreOperation = Mockito.mock(clazz);
        try {
            Mockito.when(restoreOperation.getVersionRange()).thenReturn(VersionRange.createFromVersionSpec(spec));
            Mockito.when(restoreOperation.getPriority()).thenReturn(priority);
            Mockito.when(restoreOperation.toString()).thenReturn(String.format("%s-%s", spec, priority));

        } catch (InvalidVersionSpecificationException e) {
            fail(e.getMessage());
        }
        return restoreOperation;
    }

    /**
     * Convert a list of Restore Operation into an unmodifiable List
     * @param op list of Restore Operation
     * @return Unmodifiable List of Restore Operation
     */
    public static List<RestoreOperation> ofRestoreOperation(RestoreOperation... op){
        return Stream.of(op).collect(Collectors.toUnmodifiableList());
    }
}
