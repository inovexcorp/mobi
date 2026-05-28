package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.utils.cli.api.PostRestoreOperation;
import com.mobi.utils.cli.utils.RestoreUtils;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.apache.maven.artifact.versioning.VersionRange;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * PostRestoreOperation that repairs master branch HEAD graphs whose language tags were stored
 * with mixed casing (e.g. {@code @en-US}) in backups taken before the language tag normalization
 * fix was deployed.
 *
 * <p>Root cause: jsonld-java lowercases language tags on every JSON-LD round-trip, but the
 * initial Turtle import preserves original casing. RDF4J NativeStore byte-level value-ID
 * comparison is case-sensitive once the value-ID cache (default size 128) evicts entries —
 * exposed on large vocabularies. So a removal of {@code "Foo"@en-us} silently fails against a
 * stored {@code "Foo"@en-US}, leaving both labels visible after a commit or merge.</p>
 *
 * <p>This operation:</p>
 * <ol>
 *   <li>Runs an ASK guard to skip immediately when no HEAD graph has any uppercase language
 *       tag literal (no overhead on clean repos).</li>
 *   <li>Runs a SPARQL SELECT (not UPDATE) to identify each uppercase-tagged literal in any
 *       master HEAD graph that is paired with a case-equivalent (same string, case-insensitive
 *       same language) intended deletion anywhere in the full commit chain (master + merged
 *       branches via {@code (mcat:baseCommit|mcat:auxiliaryCommit|mcat:branchCommit)*}).</li>
 *   <li>For each result, removes the actual byte-level stored Statement via
 *       {@code conn.getStatements} + {@code conn.remove}. SPARQL UPDATE DELETE cannot be used
 *       here because it re-binds literals through the value factory and can resolve to a
 *       different value-ID than the one stored, causing silent failures under cache eviction.</li>
 * </ol>
 *
 * <p>The remaining uppercase language tags are left in place (they're valid BCP 47 form, and
 * actually changing the byte-level casing in NativeStore is not reliably possible once a
 * literal has been assigned an internal value-ID).</p>
 */
@Component(
        service = { NormalizeHeadGraphLanguageTags.class, PostRestoreOperation.class }
)
public class NormalizeHeadGraphLanguageTags implements PostRestoreOperation {
    private static final Logger LOGGER = LoggerFactory.getLogger(NormalizeHeadGraphLanguageTags.class);

    private static final String CHECK_UPPERCASE_LANG_TAGS;
    private static final String FIND_STALE_UPPERCASE;

    static {
        try {
            CHECK_UPPERCASE_LANG_TAGS = IOUtils.toString(
                    Objects.requireNonNull(NormalizeHeadGraphLanguageTags.class
                            .getResourceAsStream("/checkUppercaseLangTags.rq")),
                    StandardCharsets.UTF_8);
            FIND_STALE_UPPERCASE = IOUtils.toString(
                    Objects.requireNonNull(NormalizeHeadGraphLanguageTags.class
                            .getResourceAsStream("/deleteStaleUppercaseLangTags.rq")),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected CatalogConfigProvider configProvider;

    @Activate
    public void activate() {
        LOGGER.debug(getClass().getSimpleName() + " activate");
    }

    @Override
    public Integer getPriority() {
        // Run after CleanCatalogDefault (100) but before ClearOntologyCache (1000)
        return 500;
    }

    @Override
    public VersionRange getVersionRange() throws InvalidVersionSpecificationException {
        // Only run when restoring from a backup made before 4.4, where the normalization fix landed.
        // Double-protected: even if run against a clean backup, CHECK_UPPERCASE_LANG_TAGS returns
        // false and the operation exits immediately.
        return VersionRange.createFromVersionSpec("(,4.4)");
    }

    @Override
    public void execute() {
        LOGGER.debug(getClass().getSimpleName() + " execute");
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            boolean hasAffected = conn.prepareBooleanQuery(CHECK_UPPERCASE_LANG_TAGS).evaluate();
            if (!hasAffected) {
                RestoreUtils.out("No HEAD graphs with uppercase language tags found — skipping.", LOGGER);
                return;
            }
            RestoreUtils.out("Found HEAD graphs with uppercase language tags. Removing stale duplicates...",
                    LOGGER);

            // Collect (headGraph, s, p, uppercase) tuples for stale literals.
            // Materialize into a list so the query is not still being consumed while we remove.
            List<StaleEntry> stale = new ArrayList<>();
            try (TupleQueryResult result = conn.prepareTupleQuery(FIND_STALE_UPPERCASE).evaluate()) {
                result.forEach(b -> {
                    Resource headGraph = (Resource) b.getValue("headGraph");
                    Resource s = (Resource) b.getValue("s");
                    IRI p = (IRI) b.getValue("p");
                    Literal uppercase = (Literal) b.getValue("uppercase");
                    stale.add(new StaleEntry(headGraph, s, p, uppercase));
                });
            }
            RestoreUtils.out("\tIdentified " + stale.size()
                    + " stale uppercase-tagged literal(s) for removal.", LOGGER);

            // Remove via Java API using the actual byte-level stored Statement (preserves the
            // original casing, so conn.remove succeeds even under value-ID cache eviction).
            int removed = 0;
            for (StaleEntry e : stale) {
                removed += removeCaseInsensitive(conn, e.headGraph, e.s, e.p, e.uppercase);
            }
            RestoreUtils.out("\tRemoved " + removed + " stale statement(s) from HEAD graphs.", LOGGER);
            RestoreUtils.out("Language tag normalization complete.", LOGGER);
        }
    }

    /**
     * Finds and removes triples in {@code headGraph} matching the given subject and predicate
     * where the object is a language-tagged literal with the same string value as {@code target}
     * and a case-insensitively equal language tag. Returns the number of statements removed.
     */
    private int removeCaseInsensitive(RepositoryConnection conn, Resource headGraph, Resource s,
                                      IRI p, Literal target) {
        String label = target.getLabel();
        String langLower = target.getLanguage().orElse("").toLowerCase();
        List<Statement> toRemove = new ArrayList<>();
        try (RepositoryResult<Statement> iter = conn.getStatements(s, p, null, headGraph)) {
            iter.forEach(st -> {
                Value obj = st.getObject();
                if (obj instanceof Literal l && l.getLanguage().isPresent()
                        && label.equals(l.getLabel())
                        && langLower.equals(l.getLanguage().get().toLowerCase())) {
                    toRemove.add(st);
                }
            });
        }
        toRemove.forEach(st -> conn.remove(st, headGraph));
        return toRemove.size();
    }

    private record StaleEntry(Resource headGraph, Resource s, IRI p, Literal uppercase) {}
}
