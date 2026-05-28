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
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryWrapper;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.nativerdf.NativeStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

public class NormalizeHeadGraphLanguageTagsTest {
    private static final String SKOS_PREF_LABEL = "http://www.w3.org/2004/02/skos/core#prefLabel";
    private static final String AMPHIBIANS_IRI = "http://example.org/ontology#Amphibians";
    private static final String KITTY_IRI = "http://example.org/ontology#Kitty";
    private static final String HEAD_GRAPH_IRI = "https://mobi.com/records#vocab1/HEAD";

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    private AutoCloseable closeable;
    private ValueFactory vf;
    private NativeRepositoryWrapper repo;

    @Mock
    private CatalogConfigProvider config;

    private NormalizeHeadGraphLanguageTags operation;

    @Before
    public void setUp() throws IOException {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();
        // Use NativeStore (matches production) — preserves byte-level language tag casing
        // distinction. MemoryStore would deduplicate "Foo"@en-US and "Foo"@en-us during parsing
        // via case-insensitive Literal.equals(), masking the corruption pattern we're fixing.
        repo = new NativeRepositoryWrapper();
        SailRepository sailRepo = new SailRepository(new NativeStore(tempFolder.newFolder("nativestore")));
        sailRepo.init();
        repo.setDelegate(sailRepo);

        Mockito.when(config.getRepository()).thenReturn(repo);

        operation = new NormalizeHeadGraphLanguageTags();
        operation.configProvider = config;
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
        Mockito.reset(config);
    }

    /**
     * Verifies the fix against synthetic test data that reproduces the MP-3569 corruption.
     *
     * <p>The user edited the SKOS Amphibians concept's en-US prefLabel from "Amphibians" to
     * "Amphibians_1" on a feature branch and merged it into master. Due to the language tag
     * casing bug, the deletion of "Amphibians"@en-us failed silently against the stored
     * "Amphibians"@en-US, leaving BOTH labels in the master HEAD graph.</p>
     *
     * <p>After NormalizeHeadGraphLanguageTags runs:
     * <ul>
     *   <li>The stale "Amphibians"@en-US must be deleted (matched by the deletion of
     *       "Amphibians"@en-us reachable via the influenced revision in the commit chain)</li>
     *   <li>"Amphibians_1"@en-us (the user-intended new value) must remain</li>
     *   <li>"Amphibiens"@fr (untouched) must remain</li>
     *   <li>"Kitty"@en-US on the unrelated Kitty concept must NOT be deleted (no matching
     *       deletion in the chain) — this would be a false positive</li>
     * </ul>
     */
    @Test
    public void fixesAmphibiansCorruption() {
        loadTrigResource("/normalizeHeadGraphTestData.trig");

        // Pre-condition: the synthetic data contains the documented corruption.
        Set<Literal> prefLabelsBefore = collectPrefLabels(HEAD_GRAPH_IRI, AMPHIBIANS_IRI);
        System.out.println("[BEFORE] Amphibians prefLabels: " + prefLabelsBefore);
        Assert.assertTrue("Test data must contain stale \"Amphibians\"@en-US",
                prefLabelsBefore.contains(vf.createLiteral("Amphibians", "en-US")));
        Assert.assertTrue("Test data must contain new \"Amphibians_1\"@en-us",
                prefLabelsBefore.contains(vf.createLiteral("Amphibians_1", "en-us")));
        Assert.assertTrue("Test data must contain untouched \"Amphibiens\"@fr",
                prefLabelsBefore.contains(vf.createLiteral("Amphibiens", "fr")));

        Set<Literal> kittyLabelsBefore = collectPrefLabels(HEAD_GRAPH_IRI, KITTY_IRI);
        Assert.assertTrue("Test data must contain untouched \"Kitty\"@en-US (false-positive guard)",
                kittyLabelsBefore.contains(vf.createLiteral("Kitty", "en-US")));

        operation.execute();

        // Post-condition: stale gone, new value retained, untouched language retained.
        Set<Literal> prefLabelsAfter = collectPrefLabels(HEAD_GRAPH_IRI, AMPHIBIANS_IRI);
        System.out.println("[AFTER]  Amphibians prefLabels: " + prefLabelsAfter);
        Assert.assertFalse("Stale \"Amphibians\"@en-US should be deleted after normalization",
                prefLabelsAfter.contains(vf.createLiteral("Amphibians", "en-US")));
        Assert.assertTrue("User-intended \"Amphibians_1\"@en-us must remain",
                prefLabelsAfter.contains(vf.createLiteral("Amphibians_1", "en-us")));
        Assert.assertTrue("Untouched \"Amphibiens\"@fr must remain",
                prefLabelsAfter.contains(vf.createLiteral("Amphibiens", "fr")));
        Assert.assertEquals("Amphibians should have exactly 2 prefLabels (Amphibians_1 + Amphibiens)",
                2, prefLabelsAfter.size());

        // Critical false-positive guard: Kitty had no matching deletion in the chain.
        Set<Literal> kittyLabelsAfter = collectPrefLabels(HEAD_GRAPH_IRI, KITTY_IRI);
        System.out.println("[AFTER]  Kitty prefLabels: " + kittyLabelsAfter);
        Assert.assertTrue("Kitty was never edited — its label must remain",
                kittyLabelsAfter.contains(vf.createLiteral("Kitty", "en-US")));
    }

    /**
     * Sanity check: with no records in the repository, the operation should detect that nothing
     * needs fixing and exit quickly without errors.
     */
    @Test
    public void noOpWhenNoUppercaseTags() {
        operation.execute();
        // If no exception, the test passes.
    }


    /**
     * Benchmark: measures the time spent in each phase of the operation against the real backup.
     * Useful for assessing scaling characteristics. Skips silently if backup file isn't present.
     */
    @Test
    public void benchmarkAgainstRealBackup() throws Exception {
        if (NormalizeHeadGraphLanguageTagsTest.class.getResource("/largeVocabBackup.trig") == null) {
            System.out.println("[BENCH] largeVocabBackup.trig not present — skipping benchmark.");
            return;
        }
        long t0 = System.nanoTime();
        loadTrigResource("/largeVocabBackup.trig");
        long tLoad = System.nanoTime() - t0;
        System.out.printf("[BENCH] TriG load:                  %6.1f ms%n", tLoad / 1_000_000.0);

        try (RepositoryConnection conn = repo.getConnection()) {
            // Count total triples
            long totalCount;
            try (TupleQueryResult r = conn.prepareTupleQuery(
                    "SELECT (COUNT(*) AS ?c) WHERE { GRAPH ?g { ?s ?p ?o } }").evaluate()) {
                totalCount = ((Literal) r.next().getValue("c")).longValue();
            }
            // Count uppercase lang-tag literals across all graphs
            long uppercaseTotal;
            try (TupleQueryResult r = conn.prepareTupleQuery(
                    "SELECT (COUNT(?o) AS ?c) WHERE { GRAPH ?g { ?s ?p ?o } "
                            + "FILTER(isLiteral(?o) && LANG(?o) != \"\" && LANG(?o) != LCASE(LANG(?o))) }").evaluate()) {
                uppercaseTotal = ((Literal) r.next().getValue("c")).longValue();
            }
            System.out.printf("[BENCH] Total statements:           %,d%n", totalCount);
            System.out.printf("[BENCH] Uppercase lang literals:    %,d (across all graphs)%n", uppercaseTotal);
        }

        // Phase 1: ASK guard
        long t1 = System.nanoTime();
        boolean hasAffected;
        try (RepositoryConnection conn = repo.getConnection()) {
            String checkQ = org.apache.commons.io.IOUtils.toString(
                    java.util.Objects.requireNonNull(NormalizeHeadGraphLanguageTagsTest.class
                            .getResourceAsStream("/checkUppercaseLangTags.rq")),
                    java.nio.charset.StandardCharsets.UTF_8);
            hasAffected = conn.prepareBooleanQuery(checkQ).evaluate();
        }
        long tAsk = System.nanoTime() - t1;
        System.out.printf("[BENCH] Phase 1 (ASK guard):        %6.1f ms (result=%s)%n",
                tAsk / 1_000_000.0, hasAffected);

        // Phase 2: SELECT to find stale tuples
        long t2 = System.nanoTime();
        int staleCount;
        try (RepositoryConnection conn = repo.getConnection()) {
            String findQ = org.apache.commons.io.IOUtils.toString(
                    java.util.Objects.requireNonNull(NormalizeHeadGraphLanguageTagsTest.class
                            .getResourceAsStream("/deleteStaleUppercaseLangTags.rq")),
                    java.nio.charset.StandardCharsets.UTF_8);
            try (TupleQueryResult r = conn.prepareTupleQuery(findQ).evaluate()) {
                int c = 0;
                while (r.hasNext()) { r.next(); c++; }
                staleCount = c;
            }
        }
        long tSelect = System.nanoTime() - t2;
        System.out.printf("[BENCH] Phase 2 (SELECT stale):     %6.1f ms (found=%d)%n",
                tSelect / 1_000_000.0, staleCount);

        // Phase 3: Full operation (ASK + SELECT + Java delete)
        long t3 = System.nanoTime();
        operation.execute();
        long tOp = System.nanoTime() - t3;
        System.out.printf("[BENCH] Phase 3 (full execute):     %6.1f ms%n", tOp / 1_000_000.0);

        // Now repeat against the AFTER state (no more stale matches) to measure clean-repo behavior
        long t4 = System.nanoTime();
        operation.execute();
        long tOp2 = System.nanoTime() - t4;
        System.out.printf("[BENCH] Phase 4 (re-run on clean):  %6.1f ms (ASK should be false, skip)%n",
                tOp2 / 1_000_000.0);
    }

    /**
     * One-time verification against the real pre-4.4 backup (file not checked in, used locally).
     * Enable by placing the backup's system.trig at src/test/resources/largeVocabBackup.trig.
     * Skips silently if the resource isn't present.
     */
    @Test
    public void fixesRealBackupIfPresent() {
        if (NormalizeHeadGraphLanguageTagsTest.class.getResource("/largeVocabBackup.trig") == null) {
            System.out.println("[REAL] largeVocabBackup.trig not present — skipping real-backup verification.");
            return;
        }
        loadTrigResource("/largeVocabBackup.trig");
        String largeVocabHead = "https://mobi.com/records#0cdb8aaf-8df6-4753-b0f3-23a914dd7a00/HEAD";

        Set<Literal> before = collectPrefLabels(largeVocabHead, AMPHIBIANS_IRI);
        System.out.println("[REAL][BEFORE] Amphibians prefLabels: " + before);
        Assert.assertTrue("Real backup must have stale \"Amphibians\"@en-US",
                before.contains(vf.createLiteral("Amphibians", "en-US")));
        Assert.assertTrue("Real backup must have new \"Amphibians_1\"@en-us",
                before.contains(vf.createLiteral("Amphibians_1", "en-us")));

        operation.execute();

        Set<Literal> after = collectPrefLabels(largeVocabHead, AMPHIBIANS_IRI);
        System.out.println("[REAL][AFTER]  Amphibians prefLabels: " + after);
        Assert.assertFalse("Stale Amphibians@en-US must be deleted in real backup",
                after.contains(vf.createLiteral("Amphibians", "en-US")));
        Assert.assertTrue("Amphibians_1@en-us must be retained in real backup",
                after.contains(vf.createLiteral("Amphibians_1", "en-us")));
    }

    private void loadTrigResource(String resourcePath) {
        try (RepositoryConnection conn = repo.getConnection();
             InputStream in = NormalizeHeadGraphLanguageTagsTest.class.getResourceAsStream(resourcePath)) {
            conn.begin();
            conn.add(Rio.parse(in, "", RDFFormat.TRIG));
            conn.commit();
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
    }

    private Set<Literal> collectPrefLabels(String headGraphIRI, String subjectIRI) {
        Set<Literal> labels = new HashSet<>();
        try (RepositoryConnection conn = repo.getConnection()) {
            String query = ""
                    + "SELECT ?label WHERE { "
                    + "  GRAPH <" + headGraphIRI + "> { "
                    + "    <" + subjectIRI + "> <" + SKOS_PREF_LABEL + "> ?label "
                    + "  } "
                    + "}";
            try (TupleQueryResult result = conn.prepareTupleQuery(query).evaluate()) {
                result.forEach(b -> labels.add((Literal) b.getValue("label")));
            }
        }
        return labels;
    }
}
